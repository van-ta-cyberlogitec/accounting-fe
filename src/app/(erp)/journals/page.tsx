"use client";
import { gql, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const JOURNALS = gql`
  query Journals($companyId: ID!) {
    journalsByCompany(companyId: $companyId) {
      id
      journalNumber
      accountingDate
      description
      status
      baseCurrency
      lines {
        id
        debitBase
        creditBase
      }
    }
  }
`;
export default function JournalsPage() {
  const company = useSessionStore((s) => s.company);
  const router = useRouter();
  const [voucher, setVoucher] = useState("");
  const [status, setStatus] = useState<string>();
  const { data, loading, refetch } = useQuery(JOURNALS, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const rows = (data?.journalsByCompany ?? []).filter(
    (r: { journalNumber: string; status: string }) =>
      (!voucher || r.journalNumber.includes(voucher)) &&
      (!status || r.status === status),
  );
  return (
    <>
      <PageTitle
        title="Slip Inquiry"
        description="Search by time, partner, voucher number, sequence, and status."
        actions={
          <Button type="primary" onClick={() => router.push("/journals/new")}>
            Add New
          </Button>
        }
      />
      <Card>
        <Space wrap className="mb-4">
          <DatePicker.RangePicker />
          <Input placeholder="Partner" />
          <Input
            placeholder="Voucher no / Seq"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Status"
            className="w-36"
            options={["DRAFT", "SUBMITTED", "POSTED"].map((value) => ({
              value,
            }))}
            onChange={setStatus}
          />
          <Button onClick={() => refetch()}>Search</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={[
            { title: "Voucher No", dataIndex: "journalNumber" },
            { title: "Date", dataIndex: "accountingDate" },
            { title: "Description", dataIndex: "description" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag
                  color={
                    v === "POSTED"
                      ? "green"
                      : v === "SUBMITTED"
                        ? "blue"
                        : "default"
                  }
                >
                  {v}
                </Tag>
              ),
            },
            { title: "Currency", dataIndex: "baseCurrency" },
          ]}
        />
      </Card>
    </>
  );
}
