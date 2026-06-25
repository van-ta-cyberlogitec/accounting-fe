"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Apollo records are normalized by the form boundary. */
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { message } from "@/components/providers/AppProviders";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const QUERY = gql`
  query FixedAssets($companyId: ID!) {
    fixedAssets(companyId: $companyId) {
      items {
        id
        assetCode
        name
        acquisitionDate
        cost
        residualValue
        usefulLifeMonths
        accumulatedDepreciation
        status
        assetAccountId
        depreciationAccountId
        accumulatedAccountId
        profitCenterId
      }
    }
    accountsByCompany(companyId: $companyId) {
      items {
        id
        code
        name
      }
    }
    profitCentersByCompany(companyId: $companyId) {
      id
      code
      name
    }
  }
`;
const SAVE = gql`
  mutation SaveAsset($input: FixedAssetInput!, $id: ID) {
    saveFixedAsset(input: $input, id: $id) {
      id
    }
  }
`;
export default function FixedAssetsPage() {
  const company = useSessionStore((s) => s.company);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const { data, loading, refetch } = useQuery(QUERY, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [save] = useMutation(SAVE);
  const accounts = (data?.accountsByCompany?.items ?? []).map((a: any) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }));
  async function submit(values: any) {
    await save({
      variables: {
        id: editing?.id,
        input: {
          ...values,
          companyId: company?.id,
          cost: String(values.cost),
          residualValue: String(values.residualValue),
        },
      },
    });
    message.success("Asset saved");
    setOpen(false);
    refetch();
  }
  return (
    <>
      <PageTitle
        title="Fixed Assets"
        description="Asset register, useful life and depreciation account mapping."
        actions={
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({
                acquisitionDate: "2026-06-01",
                cost: 12000000,
                residualValue: 0,
                usefulLifeMonths: 36,
              });
              setOpen(true);
            }}
          >
            Add Asset
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data?.fixedAssets?.items ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "Asset Code", dataIndex: "assetCode" },
            { title: "Name", dataIndex: "name" },
            { title: "Acquired", dataIndex: "acquisitionDate" },
            { title: "Cost", dataIndex: "cost", align: "right" },
            {
              title: "Accumulated",
              dataIndex: "accumulatedDepreciation",
              align: "right",
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => <Tag>{v}</Tag>,
            },
          ]}
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
        width={700}
        title="Fixed Asset"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label="Asset Code"
              name="assetCode"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Acquisition Date"
              name="acquisitionDate"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Cost" name="cost" rules={[{ required: true }]}>
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="Residual Value" name="residualValue">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="Useful Life (Months)" name="usefulLifeMonths">
              <InputNumber className="w-full" />
            </Form.Item>
            {[
              ["Asset Account", "assetAccountId"],
              ["Depreciation Expense", "depreciationAccountId"],
              ["Accumulated Depreciation", "accumulatedAccountId"],
            ].map(([label, name]) => (
              <Form.Item
                key={name}
                label={label}
                name={name}
                rules={[{ required: true }]}
              >
                <Select showSearch options={accounts} />
              </Form.Item>
            ))}
          </div>
        </Form>
      </Modal>
    </>
  );
}
