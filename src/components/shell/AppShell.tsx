"use client";
import { gql, useQuery } from "@apollo/client";
import {
  AuditOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Select, Typography } from "antd";
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

function getOpenKeys(pathname: string): string[] {
  for (const item of items ?? []) {
    if (!item || !("key" in item)) continue;
    const children = "children" in item ? item.children : undefined;
    for (const child of children ?? []) {
      if (child && "key" in child && pathname.startsWith(String(child.key)))
        return [String(item.key)];
    }
  }
  return [];
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

  const defaultOpenKeys = getOpenKeys(pathname);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
        collapsedWidth={64}
        style={{ overflow: "hidden" }}
      >
        {/* Inner flex-column wrapper — Ant Design Sider renders a plain <aside>
             so we need this div to stack brand / scroll-menu / footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 14L6 10L9 13L13 7L16 10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="4" r="2" fill="white" opacity="0.7" />
              </svg>
            </div>
            {!collapsed && (
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>ERP Accounting</span>
                <span className={styles.brandSub}>General Ledger</span>
              </div>
            )}
          </div>

          {/* Scrollable menu — flex:1 + min-height:0 makes this the scroll zone */}
          <div className={styles.sidebarScroll}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              defaultOpenKeys={defaultOpenKeys}
              items={items}
              onClick={({ key }) => router.push(key)}
              style={{ border: "none", background: "transparent" }}
            />
          </div>

          {/* Collapse toggle at bottom */}
          <div className={styles.sidebarFooter}>
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              {!collapsed && (
                <span className={styles.collapseBtnLabel}>Collapse</span>
              )}
            </button>
          </div>
        </div>
      </Layout.Sider>

      {/* ── Main area: flex column, never scrolls itself ─────────── */}
      <Layout
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100vh",
        }}
      >
        {/* Header — sticky via CSS module */}
        <Layout.Header
          className={styles.header}
          style={{ padding: 0, flexShrink: 0 }}
        >
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                ERP
              </Typography.Text>
              <span className={styles.breadcrumbSeparator}>/</span>
              <Typography.Text className={styles.pageTitle}>
                {currentLabel(pathname)}
              </Typography.Text>
            </div>
          </div>

          <div className={styles.headerRight}>
            <Select
              className={styles.companySelect}
              value={company?.id}
              placeholder="Select company"
              options={(data?.companiesForCurrentUser ?? []).map(
                (item: { id: string; code: string; name: string }) => ({
                  value: item.id,
                  label: `${item.code} – ${item.name}`,
                }),
              )}
              onChange={(id) =>
                setCompany(
                  data.companiesForCurrentUser.find(
                    (item: { id: string }) => item.id === id,
                  ),
                )
              }
              style={{ minWidth: 220 }}
            />
            <Button
              className={styles.signOutBtn}
              icon={<LogoutOutlined />}
              onClick={() => {
                clear();
                router.push("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </Layout.Header>

        {/* Content — the ONLY scroll zone in the right panel */}
        <Layout.Content className={styles.content}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
