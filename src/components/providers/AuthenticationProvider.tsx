"use client";
import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";
import { getJwtExpiry, refreshSessionToken } from "@/utils/auth-helper";

export function AuthenticationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;

    async function checkAndScheduleRefresh() {
      const token = useSessionStore.getState().accessToken;
      if (!token) return;

      const expiry = getJwtExpiry(token);
      if (!expiry) return;

      const timeRemaining = expiry - Date.now();
      // Refresh 1 minute (60,000ms) before the token expires
      const delay = timeRemaining - 60000;

      if (delay <= 0) {
        await refreshSessionToken();
      } else {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(async () => {
          await refreshSessionToken();
        }, delay);
      }
    }

    checkAndScheduleRefresh();

    const handleActivity = () => {
      checkAndScheduleRefresh();
    };

    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleActivity);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleActivity);
    };
  }, [accessToken]);

  return <>{children}</>;
}
