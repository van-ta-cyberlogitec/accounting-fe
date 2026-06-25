"use client";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import { message } from "@/components/providers/AppProviders";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { journalTotals } from "./journal-totals";

const ACCOUNTS = gql`
  query JournalAccounts($companyId: ID!) {
    accountsByCompany(companyId: $companyId) {
      items {
        id
        code
        name
        isPosting
        active
      }
    }
  }
`;
const SAVE = gql`
  mutation SaveJournal($input: JournalInput!, $id: ID) {
    saveJournalDraft(input: $input, id: $id) {
      id
      journalNumber
      status
    }
  }
`;
const SUBMIT = gql`
  mutation SubmitJournal($companyId: ID!, $id: ID!) {
    submitJournal(companyId: $companyId, id: $id) {
      id
      status
    }
  }
`;
interface Line {
  key: string;
  accountId?: string;
  description?: string;
  transactionCurrency: string;
  exchangeRate: string;
  debitTransaction: string;
  creditTransaction: string;
}
const blank = (currency: string): Line => ({
  key: crypto.randomUUID(),
  transactionCurrency: currency,
  exchangeRate: "1",
  debitTransaction: "0",
  creditTransaction: "0",
});
export function JournalEditor() {
  const company = useSessionStore((s) => s.company);
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<Line[]>(() => [
    blank("VND"),
    blank("VND"),
  ]);
  const [journalId, setJournalId] = useState<string>();
  const { data } = useQuery(ACCOUNTS, {
    variables: { companyId: company?.id },
    skip: !company,
  });
  const [save, { loading }] = useMutation(SAVE);
  const [submit] = useMutation(SUBMIT);
  const totals = useMemo(() => journalTotals(lines), [lines]);
  function update(key: string, field: keyof Line, value: string) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
  }
  async function saveDraft() {
    if (!company) return null;
    try {
      const result = await save({
        variables: {
          id: journalId,
          input: {
            companyId: company.id,
            accountingDate: date,
            description: localDescription
              ? `${description} / ${localDescription}`
              : description,
            baseCurrency: company.baseCurrency,
            lines: lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              transactionCurrency: line.transactionCurrency,
              exchangeRate: line.exchangeRate,
              debitTransaction: line.debitTransaction,
              creditTransaction: line.creditTransaction,
            })),
          },
        },
      });
      const savedId = result.data.saveJournalDraft.id;
      setJournalId(savedId);
      message.success(`Saved ${result.data.saveJournalDraft.journalNumber}`);
      return savedId;
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Unable to save");
      return null;
    }
  }
  async function confirm() {
    const id = await saveDraft();
    if (id && company) {
      await submit({ variables: { companyId: company.id, id } });
      message.success("Slip confirmed and sent for approval");
      router.push("/journals");
    }
  }
  const accountOptions = (data?.accountsByCompany?.items ?? [])
    .filter(
      (a: { isPosting: boolean; active: boolean }) => a.isPosting && a.active,
    )
    .map((a: { id: string; code: string; name: string }) => ({
      value: a.id,
      label: `${a.code} - ${a.name}`,
    }));
  const columns = [
    {
      title: "Account (double-click/search in legacy UI)",
      dataIndex: "accountId",
      width: 260,
      render: (_: unknown, r: Line) => (
        <Select
          showSearch
          optionFilterProp="label"
          className="w-full"
          value={r.accountId}
          options={accountOptions}
          onChange={(v) => update(r.key, "accountId", v)}
        />
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (_: unknown, r: Line) => (
        <Input
          value={r.description}
          onChange={(e) => update(r.key, "description", e.target.value)}
        />
      ),
    },
    {
      title: "Currency",
      width: 90,
      render: (_: unknown, r: Line) => (
        <Input
          value={r.transactionCurrency}
          onChange={(e) =>
            update(r.key, "transactionCurrency", e.target.value.toUpperCase())
          }
        />
      ),
    },
    {
      title: "Rate",
      width: 110,
      render: (_: unknown, r: Line) => (
        <InputNumber
          stringMode
          value={r.exchangeRate}
          onChange={(v) => update(r.key, "exchangeRate", String(v ?? 0))}
        />
      ),
    },
    {
      title: "Debit",
      width: 140,
      render: (_: unknown, r: Line) => (
        <InputNumber
          stringMode
          min="0"
          value={r.debitTransaction}
          onChange={(v) => update(r.key, "debitTransaction", String(v ?? 0))}
        />
      ),
    },
    {
      title: "Credit",
      width: 140,
      render: (_: unknown, r: Line) => (
        <InputNumber
          stringMode
          min="0"
          value={r.creditTransaction}
          onChange={(v) => update(r.key, "creditTransaction", String(v ?? 0))}
        />
      ),
    },
    {
      title: "",
      width: 48,
      render: (_: unknown, r: Line) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          disabled={lines.length <= 2}
          onClick={() => setLines((v) => v.filter((x) => x.key !== r.key))}
        />
      ),
    },
  ];
  return (
    <>
      <Card className="mb-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Typography.Text strong>Accounting Date *</Typography.Text>
            <Input
              className="mt-1 bg-yellow-50"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Typography.Text strong>Description *</Typography.Text>
            <Input
              className="mt-1 bg-yellow-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Typography.Text strong>Local Description</Typography.Text>
            <Input
              className="mt-1"
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
            />
          </div>
        </div>
      </Card>
      <Card>
        <Table
          pagination={false}
          rowKey="key"
          dataSource={lines}
          columns={columns}
        />
        <Button
          className="mt-3"
          icon={<PlusOutlined />}
          onClick={() =>
            setLines((v) => [...v, blank(company?.baseCurrency ?? "VND")])
          }
        >
          Add Line
        </Button>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Space size="large">
            <Typography.Text>
              Debit: <strong>{totals.debit}</strong>
            </Typography.Text>
            <Typography.Text>
              Credit: <strong>{totals.credit}</strong>
            </Typography.Text>
            <Typography.Text type={totals.balanced ? "success" : "danger"}>
              {totals.balanced ? "Balanced" : "Not balanced"}
            </Typography.Text>
          </Space>
          <Space>
            <Button onClick={() => router.push("/journals")}>Cancel</Button>
            <Button loading={loading} onClick={saveDraft}>
              Save
            </Button>
            <Button
              type="primary"
              disabled={
                !totals.balanced ||
                !description ||
                lines.some((l) => !l.accountId)
              }
              onClick={confirm}
            >
              Confirm
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
