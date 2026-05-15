import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/salary/structures")({ component: () => (
  <div>
    <PageHeader title="Salary Structures" subtitle="Reusable templates that define how CTC is broken down" />
    <div className="card-elev p-10 text-center text-muted-foreground text-sm">Structure builder ships in Phase 2 alongside payroll runs. Default components are already loaded.</div>
  </div>
) });