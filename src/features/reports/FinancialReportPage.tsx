"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- report rows vary by selected GraphQL report. */
import { gql, useQuery } from "@apollo/client";
import { Button, Card, DatePicker, Space, Table } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useSessionStore } from "@/stores/session-store";

const DIMENSION = gql`
  query DimensionReport(
    $companyId: ID!
    $dimension: ReportDimension!
    $from: String!
    $to: String!
  ) {
    dimensionBalance(
      companyId: $companyId
      dimension: $dimension
      fromDate: $from
      toDate: $to
    ) {
      dimensionKey
      debit
      credit
      balance
    }
  }
`;

const TRIAL = gql`
  query FinancialTrial($companyId: ID!, $from: String!, $to: String!) {
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

const REFERENCES = gql`
  query References($companyId: ID!) {
    journalReferences(companyId: $companyId) {
      sourceId
      sourceType
      documentNumber
      description
      journalId
      journalNumber
      status
    }
  }
`;

const labels: Record<string, string> = {
  PROFIT_CENTER: "Profit / Loss by Unit",
  PARTNER: "Partner Balances",
  BANK: "Bank Balances",
  EMPLOYEE: "Employee Balances",
  PNL: "Profit and Loss",
  VAT: "VAT Report",
  REFERENCES: "Journal References",
};

export function FinancialReportPage({
  report,
}: {
  report:
    | "PROFIT_CENTER"
    | "PARTNER"
    | "BANK"
    | "EMPLOYEE"
    | "PNL"
    | "VAT"
    | "REFERENCES";
}) {
  const company = useSessionStore((s) => s.company);
  const [range, setRange] = useState<[any, any]>([
    dayjs().startOf("year"),
    dayjs().endOf("year"),
  ]);

  const variables = {
    companyId: company?.id,
    dimension: report,
    from: range[0].format("YYYY-MM-DD"),
    to: range[1].format("YYYY-MM-DD"),
  };

  const query =
    report === "REFERENCES"
      ? REFERENCES
      : ["PNL", "VAT"].includes(report)
        ? TRIAL
        : DIMENSION;

  const { data, loading } = useQuery(query, { variables, skip: !company });

  let rows =
    report === "REFERENCES"
      ? (data?.journalReferences ?? [])
      : ["PNL", "VAT"].includes(report)
        ? (data?.trialBalance ?? [])
        : (data?.dimensionBalance ?? []);

  if (report === "PNL")
    rows = rows.filter((r: any) => /^[5-8]/.test(r.accountCode));
  if (report === "VAT")
    rows = rows.filter((r: any) => /^(133|333)/.test(r.accountCode));

  const columns =
    report === "REFERENCES"
      ? [
          { title: "Source", dataIndex: "sourceType" },
          { title: "Document No", dataIndex: "documentNumber" },
          { title: "Description", dataIndex: "description" },
          { title: "Journal No", dataIndex: "journalNumber" },
          { title: "Status", dataIndex: "status" },
        ]
      : ["PNL", "VAT"].includes(report)
        ? [
            { title: "Account", dataIndex: "accountCode" },
            { title: "Account Name", dataIndex: "accountName" },
            { title: "Debit", dataIndex: "debit", align: "right" as const },
            { title: "Credit", dataIndex: "credit", align: "right" as const },
            { title: "Balance", dataIndex: "balance", align: "right" as const },
          ]
        : [
            { title: "Dimension", dataIndex: "dimensionKey" },
            { title: "Debit", dataIndex: "debit", align: "right" as const },
            { title: "Credit", dataIndex: "credit", align: "right" as const },
            { title: "Balance", dataIndex: "balance", align: "right" as const },
          ];

  return (
    <>
      <PageTitle
        title={labels[report]}
        description="Posted-journal reporting with company and date scoping."
      />
      <Card>
        {report !== "REFERENCES" && (
          <Space style={{ marginBottom: 16 }}>
            <DatePicker.RangePicker
              value={range}
              onChange={(value) => value && setRange(value as any)}
            />
            <Button type="primary" onClick={() => {}}>
              Search
            </Button>
          </Space>
        )}
        <Table
          rowKey={
            report === "REFERENCES"
              ? "sourceId"
              : report === "PNL" || report === "VAT"
                ? "accountId"
                : "dimensionKey"
          }
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </>
  );
}
