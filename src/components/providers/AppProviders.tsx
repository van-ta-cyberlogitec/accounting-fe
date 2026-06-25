"use client";
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  fromPromise,
} from "@apollo/client";
import { App, ConfigProvider } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import { refreshSessionToken } from "@/utils/auth-helper";
import { AuthenticationProvider } from "./AuthenticationProvider";

export let message: MessageInstance;
export let notification: NotificationInstance;
export let modal: Omit<ModalStaticFunctions, "warn">;

function AntdAppHelper({ children }: { children: React.ReactNode }) {
  const app = App.useApp();

  message = app.message;
  notification = app.notification;
  modal = app.modal;

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    const httpLink = new HttpLink({
      uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
    });

    const authLink = setContext((_, { headers }) => {
      const token = useSessionStore.getState().accessToken;
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        },
      };
    });

    const errorLink = onError(({ graphQLErrors, operation, forward }) => {
      if (graphQLErrors) {
        const hasAuthError = graphQLErrors.some(
          (err) => err.message === "INVALID_ACCESS_TOKEN",
        );

        if (hasAuthError) {
          return fromPromise(refreshSessionToken()).flatMap((tokens) => {
            if (!tokens) {
              return forward(operation);
            }
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                authorization: `Bearer ${tokens.accessToken}`,
              },
            }));
            return forward(operation);
          });
        }
      }
    });

    return new ApolloClient({
      link: errorLink.concat(authLink).concat(httpLink),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          notifyOnNetworkStatusChange: true,
        },
      },
    });
  }, []);
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#155eef", borderRadius: 6, fontSize: 13 },
        components: { Table: { headerBg: "#eef3fb" } },
      }}
    >
      <App>
        <AntdAppHelper>
          <AuthenticationProvider>
            <ApolloProvider client={client}>{children}</ApolloProvider>
          </AuthenticationProvider>
        </AntdAppHelper>
      </App>
    </ConfigProvider>
  );
}
