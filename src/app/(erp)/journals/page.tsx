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
const PARTNERS = gql`
  query ListPartners($companyId: ID!) {
    partnersByCompany(companyId: $companyId) {
      items {
        id
        code
        name
      }
    }
  }
`;
const JOURNALS = gql`
  query Journals($companyId: ID!, $filters: JournalFilterInput) {
    journalsByCompany(companyId: $companyId, filters: $filters) {
      items {
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
      pagination {
        totalCount
      }
    }
  }
`;
export default function JournalsPage() {
  const company = useSessionStore((s) => s.company);
  const router = useRouter();
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [partnerId, setPartnerId] = useState<string>();
  const [voucher, setVoucher] = useState("");
  const [status, setStatus] = useState<string>();
  const [limit, setLimit] = useState<number>();
  const [appliedFilters, setAppliedFilters] = useState<{
    startDate?: string;
    endDate?: string;
    partnerId?: string;
    journalNumber?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }>({});

  const { data: partnersData } = useQuery(PARTNERS, {
    variables: { companyId: company?.id },
    skip: !company,
  });

  const { data, loading } = useQuery(JOURNALS, {
    variables: { companyId: company?.id, filters: appliedFilters },
    skip: !company,
  });

  const rows = data?.journalsByCompany?.items ?? [];

  const handleSearch = () => {
    setAppliedFilters({
      startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
      partnerId: partnerId || undefined,
      journalNumber: voucher || undefined,
      status: status || undefined,
      limit: limit || undefined,
      offset: 0,
    });
  };

  const partnerOptions = (partnersData?.partnersByCompany?.items ?? []).map(
    (p: any) => ({
      value: p.id,
      label: `${p.code} - ${p.name}`,
    }),
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
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(val) => setDateRange(val as any)}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Partner"
            className="w-48"
            options={partnerOptions}
            value={partnerId}
            onChange={setPartnerId}
          />
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
            value={status}
            onChange={setStatus}
          />
          <Select
            allowClear
            placeholder="Limit"
            className="w-28"
            options={[10, 20, 50, 100].map((val) => ({
              value: val,
              label: `${val} items`,
            }))}
            value={limit}
            onChange={setLimit}
          />
          <Button onClick={handleSearch}>Search</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{
            pageSize: appliedFilters.limit || 10,
            current: Math.floor((appliedFilters.offset || 0) / (appliedFilters.limit || 10)) + 1,
            total: data?.journalsByCompany?.pagination?.totalCount,
            onChange: (page, pageSize) => {
              setAppliedFilters((prev) => ({
                ...prev,
                offset: (page - 1) * pageSize,
                limit: pageSize,
              }));
            },
          }}
          // onRow={(record) => ({
          //   onClick: () => router.push(`/journals/${record.id}`),
          // })}
          scroll={{ x: true }}
          // size="small"
          bordered
          // style={{ cursor: "pointer" }}
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
