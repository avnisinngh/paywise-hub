## Scope reality check

The full spec is ~3–4 weeks of focused work. I'll deliver it in phases — each phase is a working, end-to-end slice you can use, not a mockup. Tell me if you want to reorder.

## Phase 1 (this turn) — Foundation
- Lovable Cloud is now enabled ✅
- Database schema: all 13 tables + RLS + admin role (user_roles pattern), seeded default salary components and leave types
- Auth: admin email/password login (centered card on navy/teal gradient), protected routes, logout
- App shell: navy `#1A2B4A` sidebar with teal `#00897B` active state, DM Sans, white card content area, top bar
- **Dashboard**: 4 KPI tiles, recent payroll runs table, donut + bar charts (recharts), quick actions — wired to real DB
- **Employees**: list with search/filters, Add Employee drawer (all fields), Employee Detail page with tabs (Profile/Salary/Documents/Payslips/Leave/Tax — Profile + Salary functional, others scaffolded)
- **Salary Components** page: list + add/edit modal, pre-loaded Indian defaults
- **Salary Structures** page: create templates, assign components, CTC preview calculator
- INR formatting helper, DD/MM/YYYY dates, toast notifications, loading skeletons, empty states

## Phase 2 — Payroll engine
- Public **self-onboarding** form (6 steps, token-based, no auth, file upload to storage)
- **Payroll Run** wizard (4 steps), payroll history, finalize/lock
- **Payslip generation** with PDF download (jspdf)

## Phase 3 — Leave & Attendance
- Leave types config, leave requests approve/reject, attendance calendar, LOP auto-calc → payroll

## Phase 4 — Tax & Compliance
- PF/ESI/PT registers, TDS basic + advanced (Form 12BB declarations, old vs new regime FY24-25), compliance calendar, Form 16 PDF

## Phase 5 — Reports
- All 9 reports as CSV + PDF, analytics dashboard

## Tech notes
- TanStack Start + React 19 + Tailwind v4 + Supabase (already wired)
- `user_roles` table with `has_role()` security definer for admin gating (avoids RLS recursion)
- Onboarding inserts via a TanStack server route using `supabaseAdmin` (bypasses RLS, validates token)
- Charts: recharts. PDF: jspdf. File upload: Supabase Storage bucket `employee-docs`
- Auth: email/password only (no Google) since this is admin-internal — confirm if you want Google added

## What I need from you
1. **OK to start Phase 1 now?** I'll ship it fully working before touching Phase 2.
2. Auto-confirm email on signup for the first admin? (Otherwise you'd need to verify via email — recommended ON for internal admin tool.)
3. Your company name + a placeholder logo, or use "PayrollPro" as the brand name?

Reply "go" and I'll execute Phase 1 end-to-end.