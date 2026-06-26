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
} from "antd";
import { message } from "@/components/providers/AppProviders";
import { CheckCircleFilled, CloseCircleFilled, PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
import { EditableTable, useEditableTable } from "@/components/editable-table";

const configs = {
  partners: {
    title: "Business Partners",
    description: "Customers and suppliers used by AP, AR and settlement.",
    queryKey: "partnersByCompany",
    query: gql`
      query Partners($companyId: ID!, $search: String) {
        partnersByCompany(companyId: $companyId, search: $search) {
          items {
            id
            code
            name
            type
            taxCode
            email
            paymentTerms
            active
          }
        }
      }
    `,
    mutation: gql`
      mutation SavePartner($input: MasterInput!, $id: ID) {
        savePartner(input: $input, id: $id) {
          id
        }
      }
    `,
    fields: ["code", "name", "type", "taxCode", "email", "paymentTerms"],
  },
  "pl-units": {
    title: "Profit / Loss Units",
    description: "Analysis dimensions for journals and management reporting.",
    queryKey: "profitCentersByCompany",
    query: gql`
      query ProfitCenters($companyId: ID!, $search: String) {
        profitCentersByCompany(companyId: $companyId, search: $search) {
          id
          code
          name
          parentId
          active
        }
      }
    `,
    mutation: gql`
      mutation SaveProfitCenter($input: MasterInput!, $id: ID) {
        saveProfitCenter(input: $input, id: $id) {
          id
        }
      }
    `,
    fields: ["code", "name"],
  },
  "business-places": {
    title: "Business Places",
    description: "Company tax and operational locations.",
    queryKey: "businessPlacesByCompany",
    query: gql`
      query BusinessPlaces($companyId: ID!, $search: String) {
        businessPlacesByCompany(companyId: $companyId, search: $search) {
          id
          code
          name
          taxCode
          address
          active
        }
      }
    `,
    mutation: gql`
      mutation SaveBusinessPlace($input: MasterInput!, $id: ID) {
        saveBusinessPlace(input: $input, id: $id) {
          id
        }
      }
    `,
    fields: ["code", "name", "taxCode", "address"],
  },
  "exchange-rates": {
    title: "Exchange Rates",
    description: "Daily company-scoped currency conversion rates.",
    queryKey: "exchangeRatesByCompany",
    query: gql`
      query ExchangeRates($companyId: ID!) {
        exchangeRatesByCompany(companyId: $companyId) {
          items {
            id
            currency
            rateDate
            rate
          }
        }
      }
    `,
    mutation: gql`
      mutation SaveExchangeRate($input: ExchangeRateInput!, $id: ID) {
        saveExchangeRate(input: $input, id: $id) {
          id
        }
      }
    `,
    fields: ["currency", "rateDate", "rate"],
  },
  "bank-accounts": {
    title: "Bank and Deposit Accounts",
    description: "Settlement accounts linked to the chart of accounts.",
    queryKey: "bankAccountsByCompany",
    query: gql`
      query BankAccounts($companyId: ID!, $search: String) {
        bankAccountsByCompany(companyId: $companyId, search: $search) {
          items {
            id
            code
            name
            bankName
            accountNumber
            currency
            active
          }
        }
      }
    `,
    mutation: gql`
      mutation SaveBankAccount($input: BankAccountInput!, $id: ID) {
        saveBankAccount(input: $input, id: $id) {
          id
        }
      }
    `,
    fields: ["code", "name", "bankName", "accountNumber", "currency"],
  },
} as const;
type Kind = keyof typeof configs;
const labels: Record<string, string> = {
  code: "Code",
  name: "Name",
  type: "Partner Type",
  taxCode: "Tax Code",
  email: "Email",
  paymentTerms: "Payment Terms",
  address: "Address",
  currency: "Currency",
  rateDate: "Rate Date",
  rate: "Rate",
  bankName: "Bank Name",
  accountNumber: "Account Number",
};

export function MasterDataPage({ kind }: { kind: Kind }) {
  const config = configs[kind];
  const company = useSessionStore((s) => s.company);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();
  const { data, loading, refetch } = useQuery(config.query, {
    variables: { companyId: company?.id, search: search || null },
    skip: !company,
  });
  const [save] = useMutation(config.mutation);
  const rows = ((data?.[config.queryKey] as any)?.items ?? data?.[config.queryKey] ?? []) as (Record<string, unknown> & { id: string })[];

  const [tempRow, setTempRow] = useState<any | null>(null);
  const displayRows = tempRow ? [tempRow, ...rows] : rows;

  const editableHook = useEditableTable();

  useEffect(() => {
    if (tempRow && !editableHook.editingKeys.includes("__new__")) {
      setTempRow(null);
    }
  }, [editableHook.editingKeys, tempRow]);

  function cleanInput(values: Record<string, any>) {
    const input: Record<string, any> = {
      companyId: company?.id,
    };
    if (kind !== "exchange-rates") {
      input.active = values.active ?? true;
    }
    config.fields.forEach((field) => {
      if (field in values) {
        input[field] = values[field];
      }
    });
    return input;
  }

  async function handleInlineSave(id: string | number, values: Record<string, unknown>) {
    try {
      const isNew = id === "__new__";
      await save({
        variables: {
          id: isNew ? undefined : id,
          input: cleanInput({
            ...values,
            active: values.active ?? true,
          }),
        },
      });
      message.success("Saved");
      if (isNew) {
        setTempRow(null);
      }
      await refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function handleDelete(id: string | number) {
    try {
      const record = rows.find((r) => r.id === id);
      if (!record) return;
      await save({
        variables: {
          id: id,
          input: {
            ...cleanInput(record),
            active: false,
          },
        },
      });
      message.success("Deactivated");
      await refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function submit(values: Record<string, unknown>) {
    try {
      await save({
        variables: {
          id: editing?.id,
          input: cleanInput(values),
        },
      });
      message.success("Saved");
      setOpen(false);
      await refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Save failed");
    }
  }

  const handleAddNew = () => {
    if (kind === "pl-units") {
      const newRow = { id: "__new__", code: "", name: "", active: true };
      setTempRow(newRow);
      editableHook.startEdit(newRow);
    } else {
      setEditing(null);
      form.resetFields();
      form.setFieldsValue({
        active: true,
        type: "BOTH",
        currency: "VND",
      });
      setOpen(true);
    }
  };

  const extraFloatingActions = [
    {
      key: "add-new",
      label: "Add New",
      icon: <PlusOutlined />,
      type: "primary" as const,
      onClick: handleAddNew,
    },
  ];

  const editableColumns = [
    ...config.fields.map((field) => ({
      title: labels[field] ?? field,
      dataIndex: field,
      editable: true,
      inputType: (field === "rateDate" ? "date" : field === "rate" ? "number" : field === "type" ? "select" : "text") as any,
      required: [
        "code",
        "name",
        "currency",
        "rateDate",
        "rate",
        "bankName",
        "accountNumber",
      ].includes(field),
      inputProps: field === "type" ? {
        options: ["CUSTOMER", "SUPPLIER", "BOTH"].map((value) => ({
          value,
          label: value,
        })),
      } : undefined,
    })),
    ...(kind === "exchange-rates"
      ? []
      : [
          {
            title: "Active",
            dataIndex: "active",
            editable: true,
            inputType: "switch" as const,
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
        ]),
  ];

  return (
    <>
      <PageTitle
        title={config.title}
        description={config.description}
        actions={
          <Button
            type="primary"
            onClick={handleAddNew}
          >
            Add New
          </Button>
        }
      />
      <Card>
        <Space className="mb-4">
          <Input.Search
            allowClear
            placeholder="Code or name"
            onSearch={setSearch}
          />
          <Button onClick={() => refetch()}>Search</Button>
        </Space>
        <EditableTable
          rowKey="id"
          loading={loading}
          dataSource={displayRows}
          pagination={{ pageSize: 10 }}
          editableHook={editableHook}
          onSave={handleInlineSave}
          columns={editableColumns}
          extraFloatingActions={extraFloatingActions}
          showDelete={kind === "pl-units"}
          onDelete={handleDelete}
        />
      </Card>
      <Modal
        title={editing ? "Update" : "Create"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          {config.fields.map((field) => (
            <Form.Item
              key={field}
              label={labels[field] ?? field}
              name={field}
              rules={[
                {
                  required: [
                    "code",
                    "name",
                    "currency",
                    "rateDate",
                    "rate",
                    "bankName",
                    "accountNumber",
                  ].includes(field),
                },
              ]}
            >
              {field === "type" ? (
                <Select
                  options={["CUSTOMER", "SUPPLIER", "BOTH"].map((value) => ({
                    value,
                  }))}
                />
              ) : (
                <Input type={field === "rateDate" ? "date" : "text"} />
              )}
            </Form.Item>
          ))}
          {kind !== "exchange-rates" && (
            <Form.Item label="Active" name="active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
