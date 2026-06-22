"use client";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Card, Input, Modal, Space, Table, Tag } from "antd";
import { message } from "@/components/providers/AppProviders";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";

const QUERY = gql`
  query Closing($companyId: ID!) {
    fiscalPeriods(companyId: $companyId) {
      id
      year
      month
      startDate
      endDate
      status
    }
    periodCloseEvents(companyId: $companyId) {
      id
      periodId
      action
      actorId
      reason
      createdAt
    }
  }
`;
const CLOSE = gql`
  mutation Close($companyId: ID!, $periodId: ID!) {
    closePeriod(companyId: $companyId, periodId: $periodId) {
      id
      status
    }
  }
`;
const REOPEN = gql`
  mutation Reopen($companyId: ID!, $periodId: ID!, $reason: String!) {
    reopenPeriod(companyId: $companyId, periodId: $periodId, reason: $reason) {
      id
      status
    }
  }
`;
interface FiscalPeriod {
  id: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: string;
}

export default function ClosingPage() {
  const company = useSessionStore((s) => s.company);
  const { data, loading, refetch } = useQuery(QUERY, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [close] = useMutation(CLOSE);
  const [reopen] = useMutation(REOPEN);
  async function closePeriod(id: string) {
    try {
      await close({ variables: { companyId: company?.id, periodId: id } });
      message.success("Period closed and snapshots created");
      refetch();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Close failed");
    }
  }
  function reopenPeriod(id: string) {
    let reason = "";
    Modal.confirm({
      title: "Reopen accounting period",
      content: (
        <Input.TextArea
          placeholder="Required reason"
          onChange={(e) => (reason = e.target.value)}
        />
      ),
      onOk: async () => {
        try {
          await reopen({
            variables: { companyId: company?.id, periodId: id, reason },
          });
          refetch();
        } catch (e) {
          message.error(e instanceof Error ? e.message : "Reopen failed");
        }
      },
    });
  }
  return (
    <>
      <PageTitle
        title="Period Closing"
        description="Manage fiscal periods, close books and view audit trail."
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.fiscalPeriods ?? []}
          columns={[
            {
              title: "Period",
              render: (_: unknown, r: FiscalPeriod) =>
                `${r.year}-${String(r.month).padStart(2, "0")}`,
            },
            { title: "Start", dataIndex: "startDate" },
            { title: "End", dataIndex: "endDate" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag color={v === "OPEN" ? "green" : "default"}>{v}</Tag>
              ),
            },
            {
              title: "Actions",
              render: (_: unknown, r: FiscalPeriod) => (
                <Space>
                  {r.status === "OPEN" ? (
                    <Button type="primary" onClick={() => closePeriod(r.id)}>
                      Close
                    </Button>
                  ) : (
                    <Button onClick={() => reopenPeriod(r.id)}>Reopen</Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Card title="Close / Reopen History" className="mt-4">
        <Table
          rowKey="id"
          pagination={{ pageSize: 5 }}
          dataSource={data?.periodCloseEvents ?? []}
          columns={[
            { title: "Action", dataIndex: "action" },
            { title: "Period ID", dataIndex: "periodId" },
            { title: "Reason", dataIndex: "reason" },
            { title: "Created", dataIndex: "createdAt" },
          ]}
        />
      </Card>
    </>
  );
}
