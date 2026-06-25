"use client";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from "antd";
import { message } from "@/components/providers/AppProviders";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";

const ACCOUNTS = gql`
  query Accounts($companyId: ID!, $search: String) {
    accountsByCompany(companyId: $companyId, search: $search) {
      items {
        id
        code
        name
        parentId
        nature
        isPosting
        validFrom
        validTo
        active
      }
    }
  }
`;
const SAVE = gql`
  mutation SaveAccount($input: AccountInput!, $id: ID) {
    saveAccount(input: $input, id: $id) {
      id
    }
  }
`;
export default function AccountsPage() {
  const company = useSessionStore((s) => s.company);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();
  const { data, refetch, loading } = useQuery(ACCOUNTS, {
    variables: { companyId: company?.id, search: search || null },
    skip: !company,
  });
  const [save] = useMutation(SAVE);
  async function submit(values: Record<string, unknown>) {
    try {
      await save({
        variables: {
          id: editing?.id,
          input: { ...values, companyId: company?.id },
        },
      });
      message.success("Account saved");
      setOpen(false);
      await refetch();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Save failed");
    }
  }
  const columns = [
    { title: "Account Code", dataIndex: "code" },
    { title: "Account Name", dataIndex: "name" },
    { title: "Nature", dataIndex: "nature" },
    {
      title: "Level",
      render: (_: unknown, row: { parentId?: string }) =>
        row.parentId ? "Posting / Child" : "Parent",
    },
    {
      title: "Active",
      dataIndex: "active",
      render: (value: boolean) =>
        value ? (
          <CheckCircleFilled style={{ color: "#52c41a", fontSize: "16px" }} />
        ) : (
          <CloseCircleFilled style={{ color: "#bfbfbf", fontSize: "16px" }} />
        ),
    },
  ];
  return (
    <>
      <PageTitle
        title="Account Code Entry / Inquiry"
        description="Yellow fields are mandatory, following the Accounting manual."
        actions={
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Add New
          </Button>
        }
      />
      <Card>
        <Space className="mb-4">
          <Input.Search
            allowClear
            placeholder="Account code or name"
            onSearch={setSearch}
          />
          <Button onClick={() => refetch()}>Search</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.accountsByCompany?.items ?? []}
          columns={columns}
          onRow={(record) => ({
            onDoubleClick: () => {
              setEditing(record);
              form.setFieldsValue(record);
              setOpen(true);
            },
          })}
        />
      </Card>
      <Modal
        title={editing ? "Update Account" : "Create Account"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{
            nature: "DEBIT",
            isPosting: true,
            validFrom: "2026-01-01",
          }}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              className="required-field"
              label="Account Code"
              name="code"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              className="required-field"
              label="Account Name"
              name="name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Parent Account" name="parentId">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={(data?.accountsByCompany?.items ?? []).map(
                  (a: { id: string; code: string; name: string }) => ({
                    value: a.id,
                    label: `${a.code} - ${a.name}`,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item
              className="required-field"
              label="Balance Nature"
              name="nature"
              rules={[{ required: true }]}
            >
              <Select options={[{ value: "DEBIT" }, { value: "CREDIT" }]} />
            </Form.Item>
            <Form.Item
              className="required-field"
              label="Valid From"
              name="validFrom"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Valid To" name="validTo">
              <Input type="date" />
            </Form.Item>
            <Form.Item
              label="Posting Account"
              name="isPosting"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
