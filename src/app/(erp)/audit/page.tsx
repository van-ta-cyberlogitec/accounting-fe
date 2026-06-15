"use client";
import { gql, useQuery } from "@apollo/client";
import { Card, Table } from "antd";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const AUDIT = gql`
  query Audit($companyId: ID!) {
    auditEvents(companyId: $companyId) {
      id
      actorId
      action
      entityType
      entityId
      createdAt
    }
  }
`;
export default function AuditPage() {
  const company = useSessionStore((s) => s.company);
  const { data, loading } = useQuery(AUDIT, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  return (
    <>
      <PageTitle
        title="Audit Log"
        description="Append-only approval, posting, reversal, and access history."
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.auditEvents ?? []}
          columns={[
            { title: "Time", dataIndex: "createdAt" },
            { title: "Action", dataIndex: "action" },
            { title: "Entity", dataIndex: "entityType" },
            { title: "Entity ID", dataIndex: "entityId" },
            { title: "Actor", dataIndex: "actorId" },
          ]}
        />
      </Card>
    </>
  );
}
