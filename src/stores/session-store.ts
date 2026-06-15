import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Company {
  id: string;
  code: string;
  name: string;
  baseCurrency: string;
}
interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  company: Company | null;
  setSession(accessToken: string, refreshToken: string): void;
  setCompany(company: Company): void;
  clear(): void;
}
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      company: null,
      setSession: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setCompany: (company) => set({ company }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, company: null }),
    }),
    { name: "accounting-session" },
  ),
);
