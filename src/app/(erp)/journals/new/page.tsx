"use client";
import dynamic from "next/dynamic";
import { PageTitle } from "@/components/PageTitle";
const JournalEditor = dynamic(
  () =>
    import("@/features/journals/JournalEditor").then(
      (module) => module.JournalEditor,
    ),
  { ssr: false },
);
export default function NewJournalPage() {
  return (
    <>
      <PageTitle
        title="Slip Entry"
        description="Automatic voucher numbering, bilingual descriptions, and balanced debit/credit lines."
      />
      <JournalEditor />
    </>
  );
}
