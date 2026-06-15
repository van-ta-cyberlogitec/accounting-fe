"use client";
import {
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { PageTitle } from "@/components/PageTitle";
export default function DashboardPage() {
  return (
    <>
      <PageTitle
        title="Accounting Dashboard"
        description="Foundation and General Ledger overview"
      />
      <Row gutter={[16, 16]}>
        {[
          ["Active accounts", 2, <BankOutlined key="a" />],
          ["Draft slips", 0, <BookOutlined key="b" />],
          ["Pending approval", 0, <SafetyOutlined key="c" />],
          ["Posted this month", 0, <CheckCircleOutlined key="d" />],
        ].map(([title, value, prefix]) => (
          <Col xs={24} sm={12} xl={6} key={String(title)}>
            <Card>
              <Statistic title={title} value={Number(value)} prefix={prefix} />
            </Card>
          </Col>
        ))}
      </Row>
      <div className="mt-4">
        <Card>
          <Typography.Title level={4}>V1 workflow</Typography.Title>
          <Typography.Paragraph>
            Create a balanced slip, confirm it, approve it with a different
            user, and review the resulting trial balance. Posted slips are
            corrected by reversal.
          </Typography.Paragraph>
        </Card>
      </div>
    </>
  );
}
