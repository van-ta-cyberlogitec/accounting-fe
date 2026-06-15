"use client";
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { App, ConfigProvider } from "antd";
import { setContext } from "@apollo/client/link/context";
import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const client = useMemo(
    () =>
      new ApolloClient({
        link: setContext((_, context) => ({
          headers: {
            ...context.headers,
            authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        })).concat(
          new HttpLink({
            uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
          }),
        ),
        cache: new InMemoryCache(),
      }),
    [accessToken],
  );
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#155eef", borderRadius: 6, fontSize: 13 },
        components: { Table: { headerBg: "#eef3fb" } },
      }}
    >
      <App>
        <ApolloProvider client={client}>{children}</ApolloProvider>
      </App>
    </ConfigProvider>
  );
}
