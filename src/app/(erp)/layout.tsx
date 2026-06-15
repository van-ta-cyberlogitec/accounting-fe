import { AppShell } from "@/components/shell/AppShell";
export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
