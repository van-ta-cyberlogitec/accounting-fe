"use client";
import { gql, useQuery } from "@apollo/client";
import {
  AuditOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Select, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import styles from "./AppShell.module.css";

const COMPANIES = gql`
  query Companies {
    companiesForCurrentUser {
      id
      code
      name
      baseCurrency
    }
  }
`;

const items: MenuProps["items"] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  {
    key: "setup",
    icon: <ShopOutlined />,
    label: "Setup",
    children: [
      { key: "/companies", label: "Companies" },
      { key: "/business-places", label: "Business Places" },
      { key: "/accounts", label: "Chart of Accounts" },
      { key: "/partners", label: "Partners" },
      { key: "/pl-units", label: "P/L Units" },
      { key: "/exchange-rates", label: "Exchange Rates" },
      { key: "/bank-accounts", label: "Bank Accounts" },
      { key: "/periods", label: "Fiscal Periods" },
    ],
  },
  {
    key: "transactions",
    icon: <BookOutlined />,
    label: "Transactions",
    children: [
      { key: "/journals", label: "General Journal" },
      { key: "/approvals", label: "Slip Approve" },
      { key: "/payables", label: "Accounts Payable" },
      { key: "/receivables", label: "Accounts Receivable" },
      { key: "/e-invoices", label: "E-Invoices" },
      { key: "/cash-vouchers", label: "Receipt / Payment" },
    ],
  },
  {
    key: "periodic",
    icon: <CalendarOutlined />,
    label: "Periodic",
    children: [
      { key: "/fixed-assets", label: "Fixed Assets" },
      { key: "/depreciation", label: "Depreciation" },
      { key: "/payroll", label: "Payroll Posting" },
      { key: "/closing", label: "Month-End Closing" },
    ],
  },
  {
    key: "reports",
    icon: <AuditOutlined />,
    label: "Reports",
    children: [
      { key: "/trial-balance", label: "Trial Balance" },
      { key: "/reports/profit-loss", label: "Profit & Loss" },
      { key: "/reports/pl-unit", label: "P/L Unit Balance" },
      { key: "/reports/partner", label: "Partner Balance" },
      { key: "/reports/bank", label: "Bank Balance" },
      { key: "/reports/employee", label: "Employee Balance" },
      { key: "/reports/vat", label: "VAT" },
      { key: "/reports/journal-reference", label: "Journal Reference" },
    ],
  },
  {
    key: "administration",
    icon: <TeamOutlined />,
    label: "Administration",
    children: [
      { key: "/admin", label: "Users & Roles" },
      { key: "/audit", label: "Audit Log" },
    ],
  },
];

function currentLabel(pathname: string): string {
  for (const item of items ?? []) {
    if (!item || !("key" in item)) continue;
    const children = "children" in item ? item.children : undefined;
    for (const child of children ?? []) {
      if (
        child &&
        "key" in child &&
        "label" in child &&
        pathname.startsWith(String(child.key))
      )
        return String(child.label);
    }
    if ("label" in item && pathname.startsWith(String(item.key)))
      return String(item.label);
  }
  return "Accounting";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, company, setCompany, clear } = useSessionStore();
  const { data } = useQuery(COMPANIES, { skip: !accessToken });

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);
  useEffect(() => {
    if (!company && data?.companiesForCurrentUser?.[0])
      setCompany(data.companiesForCurrentUser[0]);
  }, [company, data, setCompany]);

  return (
    <Layout className="h-screen max-h-screen overflow-hidden">
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
      >
        <div className={styles.brand}>
          {collapsed ? "ERP" : "ERP Accounting"}
        </div>
        <div className="overflow-auto h-screen scrollable-element">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={items}
            onClick={({ key }) => router.push(key)}
          />
        </div>
      </Layout.Sider>
      <Layout>
        <Layout.Header className="flex items-center justify-between bg-white px-5 shadow-sm">
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Typography.Text strong>{currentLabel(pathname)}</Typography.Text>
          </Space>
          <Space>
            <Select
              className="min-w-60"
              value={company?.id}
              placeholder="Select company"
              options={(data?.companiesForCurrentUser ?? []).map(
                (item: { id: string; code: string; name: string }) => ({
                  value: item.id,
                  label: `${item.code} - ${item.name}`,
                }),
              )}
              onChange={(id) =>
                setCompany(
                  data.companiesForCurrentUser.find(
                    (item: { id: string }) => item.id === id,
                  ),
                )
              }
            />
            <Button
              onClick={() => {
                clear();
                router.push("/login");
              }}
            >
              Sign out
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content className={styles.content}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
