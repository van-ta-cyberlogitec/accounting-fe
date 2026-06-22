"use client";
import { gql, useMutation } from "@apollo/client";
import { Button, Card, Form, Input, Typography } from "antd";
import { message } from "@/components/providers/AppProviders";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session-store";

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
    }
  }
`;
export default function LoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [login, { loading }] = useMutation(LOGIN);
  async function submit(values: { email: string; password: string }) {
    try {
      const { data } = await login({ variables: values });
      setSession(data.login.accessToken, data.login.refreshToken);
      router.push("/dashboard");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Login failed");
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <Typography.Title level={2}>ERP Accounting</Typography.Title>
        <Typography.Paragraph type="secondary">
          Foundation and General Ledger
        </Typography.Paragraph>
        <Form
          layout="vertical"
          onFinish={submit}
          initialValues={{
            email: "admin@accounting.local",
            password: "ChangeMe123!",
          }}
        >
          <Form.Item
            className="required-field"
            label="Email"
            name="email"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            className="required-field"
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            Sign in
          </Button>
        </Form>
      </Card>
    </main>
  );
}
