import { useSessionStore } from "@/stores/session-store";

let pendingRefreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

export function getJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function fetchNewToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: { refreshToken },
      }),
    });
    const result = await response.json();
    if (result.errors) return null;
    return result.data.refreshToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

export async function refreshSessionToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const state = useSessionStore.getState();
  const currentRefreshToken = state.refreshToken;
  if (!currentRefreshToken) {
    state.clear();
    return null;
  }

  if (pendingRefreshPromise) {
    return pendingRefreshPromise;
  }

  pendingRefreshPromise = fetchNewToken(currentRefreshToken).then((tokens) => {
    pendingRefreshPromise = null;
    if (tokens) {
      useSessionStore
        .getState()
        .setSession(tokens.accessToken, tokens.refreshToken);
      return tokens;
    } else {
      useSessionStore.getState().clear();
      return null;
    }
  });

  return pendingRefreshPromise;
}
