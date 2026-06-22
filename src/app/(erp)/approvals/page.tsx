"use client";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Card, Input, Modal, Space, Table, Tag } from "antd";
import { message } from "@/components/providers/AppProviders";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const JOURNALS = gql`
  query ApprovalJournals($companyId: ID!) {
    journalsByCompany(companyId: $companyId) {
      id
      journalNumber
      accountingDate
      description
      status
    }
  }
`;
const POST = gql`
  mutation Post($companyId: ID!, $id: ID!, $key: String!) {
    postJournal(companyId: $companyId, id: $id, idempotencyKey: $key) {
      id
      status
    }
  }
`;
const REJECT = gql`
  mutation Reject($companyId: ID!, $id: ID!) {
    rejectJournal(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const REVERSE = gql`
  mutation Reverse($companyId: ID!, $id: ID!, $date: String!) {
    reverseJournal(companyId: $companyId, id: $id, accountingDate: $date) {
      id
      journalNumber
    }
  }
`;
export default function ApprovalsPage() {
  const company = useSessionStore((s) => s.company);
  const { data, refetch } = useQuery(JOURNALS, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [post] = useMutation(POST);
  const [reject] = useMutation(REJECT);
  const [reverse] = useMutation(REVERSE);
  const [reason, setReason] = useState("");
  async function run(kind: string, id: string) {
    if (!company) return;
    if (kind === "post")
      await post({
        variables: { companyId: company.id, id, key: crypto.randomUUID() },
      });
    if (kind === "reject")
      await reject({ variables: { companyId: company.id, id } });
    if (kind === "reverse")
      await reverse({
        variables: {
          companyId: company.id,
          id,
          date: new Date().toISOString().slice(0, 10),
        },
      });
    message.success(
      kind === "reverse"
        ? `Approved slip cancelled by linked reversal. Reason: ${reason}`
        : `Journal ${kind}ed`,
    );
    setReason("");
    refetch();
  }
  return (
    <>
      <PageTitle
        title="Slip Approve / Cancel"
        description="Managers approve confirmed slips. Cancelling an approved slip creates an auditable reversal."
      />
      <Card>
        <Table
          rowKey="id"
          dataSource={data?.journalsByCompany ?? []}
          columns={[
            { title: "Voucher No", dataIndex: "journalNumber" },
            { title: "Date", dataIndex: "accountingDate" },
            { title: "Description", dataIndex: "description" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: "Actions",
              render: (_: unknown, r: { id: string; status: string }) => (
                <Space>
                  {r.status === "SUBMITTED" && (
                    <>
                      <Button type="primary" onClick={() => run("post", r.id)}>
                        Approve
                      </Button>
                      <Button onClick={() => run("reject", r.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {r.status === "POSTED" && (
                    <Button
                      danger
                      onClick={() =>
                        Modal.confirm({
                          title: "Cancel approved slip",
                          content: (
                            <Input.TextArea
                              placeholder="Cancellation reason"
                              onChange={(e) => setReason(e.target.value)}
                            />
                          ),
                          okText: "Create reversal",
                          okButtonProps: { danger: true },
                          onOk: () => run("reverse", r.id),
                        })
                      }
                    >
                      Cancel / Reverse
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
