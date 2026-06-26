"use client";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { message } from "@/components/providers/AppProviders";
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
  query ApprovalJournals($companyId: ID!, $filters: JournalFilterInput) {
    journalsByCompany(companyId: $companyId, filters: $filters) {
      items {
        id
        journalNumber
        accountingDate
        description
        status
      }
      pagination {
        totalCount
      }
    }
  }
`;
const POST = gql`
  mutation Post($companyId: ID!, $id: ID!, $key: String!) {
    postJournal(companyId: $companyId, id: $id, idempotencyKey: $key) {
      id
      status
    }
  }
`;
const REJECT = gql`
  mutation Reject($companyId: ID!, $id: ID!) {
    rejectJournal(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
const REVERSE = gql`
  mutation Reverse($companyId: ID!, $id: ID!, $date: String!) {
    reverseJournal(companyId: $companyId, id: $id, accountingDate: $date) {
      id
      journalNumber
    }
  }
`;
export default function ApprovalsPage() {
  const company = useSessionStore((s) => s.company);
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

  const { data, loading, refetch } = useQuery(JOURNALS, {
    variables: { companyId: company?.id, filters: appliedFilters },
    skip: !company,
  });

  const [post] = useMutation(POST);
  const [reject] = useMutation(REJECT);
  const [reverse] = useMutation(REVERSE);
  const [reason, setReason] = useState("");

  async function run(kind: string, id: string) {
    if (!company) return;
    if (kind === "post")
      await post({
        variables: { companyId: company.id, id, key: crypto.randomUUID() },
      });
    if (kind === "reject")
      await reject({ variables: { companyId: company.id, id } });
    if (kind === "reverse")
      await reverse({
        variables: {
          companyId: company.id,
          id,
          date: new Date().toISOString().slice(0, 10),
        },
      });
    message.success(
      kind === "reverse"
        ? `Approved slip cancelled by linked reversal. Reason: ${reason}`
        : `Journal ${kind}ed`,
    );
    setReason("");
    refetch();
  }

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
        title="Slip Approve / Cancel"
        description="Managers approve confirmed slips. Cancelling an approved slip creates an auditable reversal."
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
            options={["SUBMITTED", "POSTED"].map((value) => ({
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
          dataSource={data?.journalsByCompany?.items ?? []}
          pagination={{
            pageSize: appliedFilters.limit || 10,
            current:
              Math.floor(
                (appliedFilters.offset || 0) / (appliedFilters.limit || 10),
              ) + 1,
            total: data?.journalsByCompany?.pagination?.totalCount,
            onChange: (page, pageSize) => {
              console.log("page", page, "pageSize", pageSize);
              setAppliedFilters((prev) => ({
                ...prev,
                offset: (page - 1) * pageSize,
                limit: pageSize,
              }));
            },
          }}
          columns={[
            { title: "Voucher No", dataIndex: "journalNumber" },
            { title: "Date", dataIndex: "accountingDate" },
            { title: "Description", dataIndex: "description" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: "Actions",
              render: (_: unknown, r: { id: string; status: string }) => (
                <Space>
                  {r.status === "SUBMITTED" && (
                    <>
                      <Button type="primary" onClick={() => run("post", r.id)}>
                        Approve
                      </Button>
                      <Button onClick={() => run("reject", r.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {r.status === "POSTED" && (
                    <Button
                      danger
                      onClick={() =>
                        Modal.confirm({
                          title: "Cancel approved slip",
                          content: (
                            <Input.TextArea
                              placeholder="Cancellation reason"
                              onChange={(e) => setReason(e.target.value)}
                            />
                          ),
                          okText: "Create reversal",
                          okButtonProps: { danger: true },
                          onOk: () => run("reverse", r.id),
                        })
                      }
                    >
                      Cancel / Reverse
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
