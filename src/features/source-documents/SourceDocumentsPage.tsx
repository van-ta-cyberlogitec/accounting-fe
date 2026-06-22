"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Apollo results are dynamic until generated types are refreshed. */
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { message } from "@/components/providers/AppProviders";
import dayjs from "dayjs";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const LIST = gql`
  query SourceDocuments($companyId: ID!, $type: SourceDocumentType!) {
    sourceDocuments(companyId: $companyId, type: $type) {
      id
      documentNumber
      documentDate
      accountingDate
      description
      status
      currency
      totalAmount
      partnerId
      voucherType
      paymentMethod
      bankAccountId
      journalId
      lines {
        id
        accountId
        description
        debit
        credit
        partnerId
        profitCenterId
        employeeCode
      }
    }
    accountsByCompany(companyId: $companyId) {
      id
      code
      name
    }
    partnersByCompany(companyId: $companyId) {
      id
      code
      name
    }
  }
`;
const SAVE = gql`
  mutation SaveSource($input: SourceDocumentInput!, $id: ID) {
    saveSourceDocument(input: $input, id: $id) {
      id
    }
  }
`;
const SUBMIT = gql`
  mutation SubmitSource($companyId: ID!, $id: ID!) {
    submitSourceDocument(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const APPROVE = gql`
  mutation ApproveSource($companyId: ID!, $id: ID!) {
    approveSourceDocument(companyId: $companyId, id: $id) {
      id
      status
      journalId
    }
  }
`;
const REJECT = gql`
  mutation RejectSource($companyId: ID!, $id: ID!) {
    rejectSourceDocument(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const CANCEL = gql`
  mutation CancelSource($companyId: ID!, $id: ID!, $accountingDate: String!) {
    cancelSourceDocument(
      companyId: $companyId
      id: $id
      accountingDate: $accountingDate
    ) {
      id
      status
    }
  }
`;
const titles: Record<string, string> = {
  PAYABLE: "Accounts Payable",
  RECEIVABLE: "Accounts Receivable",
  CASH: "Receipt / Payment",
  DEPRECIATION: "Depreciation Batches",
  PAYROLL: "Payroll Posting",
};
export function SourceDocumentsPage({
  type,
}: {
  type: "PAYABLE" | "RECEIVABLE" | "CASH" | "DEPRECIATION" | "PAYROLL";
}) {
  const company = useSessionStore((s) => s.company);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form] = Form.useForm();
  const { data, loading, refetch } = useQuery(LIST, {
    variables: { companyId: company?.id, type },
    skip: !company,
  });
  const [save] = useMutation(SAVE);
  const [submitMutation] = useMutation(SUBMIT);
  const [approve] = useMutation(APPROVE);
  const [reject] = useMutation(REJECT);
  const [cancel] = useMutation(CANCEL);
  const options = (data?.accountsByCompany ?? []).map((a: any) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }));
  const partnerOptions = (data?.partnersByCompany ?? []).map((p: any) => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
  }));
  async function saveDraft(values: any) {
    const amount = String(values.amount);
    await save({
      variables: {
        id: editing?.id,
        input: {
          companyId: company?.id,
          type,
          documentDate: values.documentDate.format("YYYY-MM-DD"),
          accountingDate: values.accountingDate.format("YYYY-MM-DD"),
          description: values.description,
          currency: values.currency,
          partnerId: values.partnerId,
          voucherType: type === "CASH" ? values.voucherType : null,
          paymentMethod: type === "CASH" ? "BANK_TRANSFER" : null,
          lines: [
            {
              accountId: values.debitAccountId,
              description: values.description,
              debit: amount,
              credit: "0",
              partnerId: values.partnerId,
              employeeCode: type === "PAYROLL" ? values.employeeCode : null,
              items: [],
            },
            {
              accountId: values.creditAccountId,
              description: values.description,
              debit: "0",
              credit: amount,
              partnerId: values.partnerId,
              employeeCode: type === "PAYROLL" ? values.employeeCode : null,
              items: [],
            },
          ],
        },
      },
    });
    message.success("Draft saved");
    setOpen(false);
    refetch();
  }
  async function run(kind: string, id: string) {
    try {
      const mutation =
        kind === "submit"
          ? submitMutation
          : kind === "approve"
            ? approve
            : kind === "reject"
              ? reject
              : cancel;
      await mutation({
        variables: {
          companyId: company?.id,
          id,
          accountingDate: dayjs().format("YYYY-MM-DD"),
        },
      });
      message.success(`${kind} completed`);
      refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Action failed");
    }
  }
  return (
    <>
      <PageTitle
        title={titles[type]}
        description="Header, accounting detail and control-item workflow linked to the general journal."
        actions={
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({
                documentDate: dayjs(),
                accountingDate: dayjs(),
                currency: "VND",
                amount: 1000000,
                voucherType: "BANK_PAYMENT",
              });
              setOpen(true);
            }}
          >
            New Document
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.sourceDocuments ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "Document No", dataIndex: "documentNumber" },
            { title: "Date", dataIndex: "documentDate" },
            { title: "Description", dataIndex: "description" },
            { title: "Amount", dataIndex: "totalAmount", align: "right" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag
                  color={
                    v === "POSTED"
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
            {
              title: "Journal",
              dataIndex: "journalId",
              render: (v: string) => (v ? v.slice(0, 8) : "-"),
            },
            {
              title: "Actions",
              render: (_: unknown, r: any) => (
                <Space>
                  {r.status === "DRAFT" && (
                    <Button onClick={() => run("submit", r.id)}>Submit</Button>
                  )}
                  {r.status === "SUBMITTED" && (
                    <>
                      <Button
                        type="primary"
                        onClick={() => run("approve", r.id)}
                      >
                        Approve
                      </Button>
                      <Button onClick={() => run("reject", r.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {r.status === "POSTED" && (
                    <Button danger onClick={() => run("cancel", r.id)}>
                      Reverse
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        width={760}
        title={editing ? "Edit Document" : "New Document"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={saveDraft}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label="Document Date"
              name="documentDate"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="Accounting Date"
              name="accountingDate"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Currency"
              name="currency"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Partner" name="partnerId">
              <Select allowClear showSearch options={partnerOptions} />
            </Form.Item>
            {type === "CASH" && (
              <Form.Item label="Voucher Type" name="voucherType">
                <Select
                  options={[
                    "CASH_RECEIPT",
                    "CASH_PAYMENT",
                    "BANK_RECEIPT",
                    "BANK_PAYMENT",
                  ].map((value) => ({ value }))}
                />
              </Form.Item>
            )}
            <Form.Item
              label="Debit Account"
              name="debitAccountId"
              rules={[{ required: true }]}
            >
              <Select showSearch options={options} />
            </Form.Item>
            <Form.Item
              label="Credit Account"
              name="creditAccountId"
              rules={[{ required: true }]}
            >
              <Select showSearch options={options} />
            </Form.Item>
            <Form.Item
              label="Amount"
              name="amount"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" min={0.01} />
            </Form.Item>
            {type === "PAYROLL" && (
              <Form.Item label="Employee Code" name="employeeCode">
                <Input />
              </Form.Item>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
}
