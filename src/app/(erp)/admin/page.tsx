"use client";
import { gql, useQuery } from "@apollo/client";
import { Card, Col, Row, Table } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { PageTitle } from "@/components/PageTitle";
const ADMIN = gql`
  query Admin {
    users {
      id
      email
      displayName
      active
    }
    roles {
      id
      code
      name
    }
  }
`;
export default function AdminPage() {
  const { data, loading } = useQuery(ADMIN);
  return (
    <>
      <PageTitle
        title="Users, Roles & Company Access"
        description="Seeded maker, checker, administrator, and auditor responsibilities."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Users">
            <Table
              rowKey="id"
              loading={loading}
              dataSource={data?.users ?? []}
              columns={[
                { title: "Email", dataIndex: "email" },
                { title: "Display Name", dataIndex: "displayName" },
                {
                  title: "Active",
                  dataIndex: "active",
                  render: (v: boolean) =>
                    v ? (
                      <CheckCircleFilled
                        style={{ color: "#52c41a", fontSize: "16px" }}
                      />
                    ) : (
                      <CloseCircleFilled
                        style={{ color: "#bfbfbf", fontSize: "16px" }}
                      />
                    ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Roles">
            <Table
              rowKey="id"
              loading={loading}
              pagination={false}
              dataSource={data?.roles ?? []}
              columns={[
                { title: "Code", dataIndex: "code" },
                { title: "Name", dataIndex: "name" },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
