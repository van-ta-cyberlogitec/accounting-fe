# Accounting Frontend

Next.js ERP Accounting client using Ant Design as the component system, Tailwind for layout, and CSS Modules for scoped overrides.

## Local setup

1. Copy `env/.env.example` to `env/.env.local`.
2. Install with `npm.cmd install` (or Corepack Yarn when available).
3. Start the API, then run `npm.cmd run codegen:local` and `npm.cmd run start:local`.
4. Open `http://localhost:3000` and sign in with a seeded account.

The workspace `manual.pdf` is the UI/validation source: required fields are highlighted, journal entry supports automatic voucher numbering and bilingual descriptions, inquiry screens expose date/voucher/status filters, manager approval is separate, and report screens provide Excel-compatible export.
