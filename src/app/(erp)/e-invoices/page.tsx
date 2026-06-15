"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- table records come from Apollo. */ import {
  gql,
  useMutation,
  useQuery,
} from "@apollo/client";
import { Button, Card, Select, Space, Table, Tag, message } from "antd";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const QUERY = gql`
  query EInvoices($companyId: ID!) {
    eInvoices(companyId: $companyId) {
      id
      receivableId
      requestKey
      providerReference
      status
      lookupUrl
      attemptCount
    }
    sourceDocuments(companyId: $companyId, type: RECEIVABLE) {
      id
      documentNumber
      description
    }
  }
`;
const CREATE = gql`
  mutation CreateInvoice(
    $companyId: ID!
    $receivableId: ID!
    $requestKey: String!
  ) {
    createEInvoice(
      companyId: $companyId
      receivableId: $receivableId
      requestKey: $requestKey
    ) {
      id
      status
    }
  }
`;
const ISSUE = gql`
  mutation Issue($companyId: ID!, $id: ID!) {
    issueEInvoice(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const REFRESH = gql`
  mutation Refresh($companyId: ID!, $id: ID!) {
    refreshEInvoiceStatus(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const CANCEL = gql`
  mutation CancelInvoice($companyId: ID!, $id: ID!) {
    cancelEInvoice(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
export default function EInvoicesPage() {
  const company = useSessionStore((s) => s.company);
  const [receivableId, setReceivableId] = useState<string>();
  const { data, loading, refetch } = useQuery(QUERY, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [issue] = useMutation(ISSUE);
  const [create] = useMutation(CREATE);
  const [refresh] = useMutation(REFRESH);
  const [cancel] = useMutation(CANCEL);
  async function run(kind: string, id: string) {
    const mutation =
      kind === "issue" ? issue : kind === "refresh" ? refresh : cancel;
    try {
      await mutation({ variables: { companyId: company?.id, id } });
      message.success(`Invoice ${kind} completed`);
      refetch();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Action failed");
    }
  }
  return (
    <>
      <PageTitle
        title="E-Invoices / WE-TAX"
        description="Deterministic local provider adapter for create, issue, status and cancellation."
        actions={
          <Space>
            <Select
              className="min-w-72"
              placeholder="Select receivable"
              value={receivableId}
              onChange={setReceivableId}
              options={(data?.sourceDocuments ?? []).map((document: any) => ({
                value: document.id,
                label: `${document.documentNumber} - ${document.description}`,
              }))}
            />
            <Button
              type="primary"
              disabled={!receivableId}
              onClick={async () => {
                await create({
                  variables: {
                    companyId: company?.id,
                    receivableId,
                    requestKey: crypto.randomUUID(),
                  },
                });
                message.success("E-invoice created");
                setReceivableId(undefined);
                refetch();
              }}
            >
              Create
            </Button>
          </Space>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.eInvoices ?? []}
          columns={[
            { title: "Request Key", dataIndex: "requestKey" },
            { title: "Provider Ref", dataIndex: "providerReference" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag
                  color={
                    v === "ISSUED"
                      ? "green"
                      : v === "CANCELLED"
                        ? "red"
                        : "blue"
                  }
                >
                  {v}
                </Tag>
              ),
            },
            { title: "Attempts", dataIndex: "attemptCount" },
            {
              title: "Lookup",
              dataIndex: "lookupUrl",
              render: (v: string) =>
                v ? (
                  <a href={v} target="_blank">
                    Open
                  </a>
                ) : (
                  "-"
                ),
            },
            {
              title: "Actions",
              render: (_: unknown, r: any) => (
                <Space>
                  {r.status === "CREATED" && (
                    <Button type="primary" onClick={() => run("issue", r.id)}>
                      Issue
                    </Button>
                  )}
                  <Button onClick={() => run("refresh", r.id)}>Refresh</Button>
                  {r.status === "ISSUED" && (
                    <Button danger onClick={() => run("cancel", r.id)}>
                      Cancel
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
