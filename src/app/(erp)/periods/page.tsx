"use client";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const PERIODS = gql`
  query Periods($companyId: ID!) {
    fiscalPeriods(companyId: $companyId) {
      id
      year
      month
      startDate
      endDate
      status
    }
  }
`;
const CREATE = gql`
  mutation CreatePeriod($input: PeriodInput!) {
    createFiscalPeriod(input: $input) {
      id
    }
  }
`;
const STATUS = gql`
  mutation PeriodStatus($companyId: ID!, $id: ID!, $status: PeriodStatus!) {
    setFiscalPeriodStatus(companyId: $companyId, id: $id, status: $status) {
      id
      status
    }
  }
`;
export default function PeriodsPage() {
  const company = useSessionStore((s) => s.company);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { data, refetch } = useQuery(PERIODS, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [create] = useMutation(CREATE);
  const [setStatus] = useMutation(STATUS);
  async function add(v: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  }) {
    await create({ variables: { input: { ...v, companyId: company?.id } } });
    setOpen(false);
    message.success("Fiscal period created");
    refetch();
  }
  async function change(id: string, status: string) {
    await setStatus({ variables: { companyId: company?.id, id, status } });
    refetch();
  }
  return (
    <>
      <PageTitle
        title="Monthly Closing"
        description="Open periods accept slips; closed periods block confirmation and approval."
        actions={
          <Button type="primary" onClick={() => setOpen(true)}>
            Add Period
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id"
          dataSource={data?.fiscalPeriods ?? []}
          columns={[
            { title: "Year", dataIndex: "year" },
            { title: "Month", dataIndex: "month" },
            { title: "Start", dataIndex: "startDate" },
            { title: "End", dataIndex: "endDate" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag color={v === "OPEN" ? "green" : "red"}>{v}</Tag>
              ),
            },
            {
              title: "Action",
              render: (_: unknown, r: { id: string; status: string }) => (
                <Popconfirm
                  title={`Set period ${r.status === "OPEN" ? "closed" : "open"}?`}
                  onConfirm={() =>
                    change(r.id, r.status === "OPEN" ? "CLOSED" : "OPEN")
                  }
                >
                  <Button>{r.status === "OPEN" ? "Close" : "Reopen"}</Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="Create Fiscal Period"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={add}>
          <Space align="start">
            <Form.Item
              className="required-field"
              label="Year"
              name="year"
              rules={[{ required: true }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              className="required-field"
              label="Month"
              name="month"
              rules={[{ required: true }]}
            >
              <Input type="number" min={1} max={12} />
            </Form.Item>
          </Space>
          <Form.Item
            className="required-field"
            label="Start Date"
            name="startDate"
            rules={[{ required: true }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            className="required-field"
            label="End Date"
            name="endDate"
            rules={[{ required: true }]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
