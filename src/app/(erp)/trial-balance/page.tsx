"use client";
import { gql, useLazyQuery } from "@apollo/client";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Space, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";
const TRIAL = gql`
  query Trial($companyId: ID!, $from: String!, $to: String!) {
    trialBalance(companyId: $companyId, fromDate: $from, toDate: $to) {
      accountId
      accountCode
      accountName
      debit
      credit
      balance
    }
  }
`;
export default function TrialBalancePage() {
  const company = useSessionStore((s) => s.company);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [load, { data, loading }] = useLazyQuery(TRIAL);
  function search() {
    if (company)
      load({
        variables: {
          companyId: company.id,
          from: range[0].format("YYYY-MM-DD"),
          to: range[1].format("YYYY-MM-DD"),
        },
      });
  }
  function excel() {
    const rows = data?.trialBalance ?? [];
    const csv = [
      "Account Code,Account Name,Debit,Credit,Balance",
      ...rows.map(
        (r: {
          accountCode: string;
          accountName: string;
          debit: string;
          credit: string;
          balance: string;
        }) =>
          [
            r.accountCode,
            `"${r.accountName.replaceAll('"', '""')}"`,
            r.debit,
            r.credit,
            r.balance,
          ].join(","),
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `trial-balance-${range[0].format("YYYYMMDD")}-${range[1].format("YYYYMMDD")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <>
      <PageTitle
        title="Trial Balance (TT200)"
        description="Choose a period, search, and export the report."
        actions={
          <Button
            icon={<DownloadOutlined />}
            disabled={!data?.trialBalance?.length}
            onClick={excel}
          >
            Excel
          </Button>
        }
      />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
          />
          <Button type="primary" onClick={search}>
            Search
          </Button>
        </Space>
        <Table
          rowKey="accountId"
          loading={loading}
          dataSource={data?.trialBalance ?? []}
          columns={[
            { title: "Account Code", dataIndex: "accountCode" },
            { title: "Account Name", dataIndex: "accountName" },
            { title: "Debit", dataIndex: "debit", align: "right" },
            { title: "Credit", dataIndex: "credit", align: "right" },
            { title: "Balance", dataIndex: "balance", align: "right" },
          ]}
        />
      </Card>
    </>
  );
}
