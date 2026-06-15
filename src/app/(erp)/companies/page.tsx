"use client";
import { gql, useQuery } from "@apollo/client";
import { Card, Table, Tag } from "antd";
import { PageTitle } from "@/components/PageTitle";

const COMPANIES = gql`
  query CompanyAccess {
    companiesForCurrentUser {
      id
      code
      name
      baseCurrency
      active
    }
  }
`;
export default function CompaniesPage() {
  const { data, loading } = useQuery(COMPANIES);
  return (
    <>
      <PageTitle
        title="Companies & User Access"
        description="Companies available to the signed-in user. Every accounting query is company-scoped."
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.companiesForCurrentUser ?? []}
          columns={[
            { title: "Company Code", dataIndex: "code" },
            { title: "Company Name", dataIndex: "name" },
            { title: "Base Currency", dataIndex: "baseCurrency" },
            { title: "Access", render: () => <Tag color="green">Granted</Tag> },
          ]}
        />
      </Card>
    </>
  );
}
