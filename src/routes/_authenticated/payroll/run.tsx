import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Th, Td, EmptyState, TableSkeleton } from "@/components/app/Table";
import { calcPayroll, periodLabel } from "@/lib/payroll";
import { formatINR, monthName } from "@/lib/format";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payroll/run")({ component: RunPayroll });

const STEPS = ["Period", "Employees", "Preview", "Finalize"] as const;

function RunPayroll() {
  const navigate = useNavigate();
  const today = new Date();
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [workingDays, setWorkingDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [lop, setLop] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step !== 1 || employees.length) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, emp_id, full_name, designation, department, status, pf_applicable, esi_applicable, pt_applicable, employee_salary(ctc, effective_from)")
        .eq("status", "Active");
      const list = (data ?? []).map((e: any) => ({
        ...e,
        ctc: (e.employee_salary ?? []).sort((a: any, b: any) => +new Date(b.effective_from) - +new Date(a.effective_from))[0]?.ctc ?? 0,
      }));
      setEmployees(list);
      const inc: Record<string, boolean> = {};
      list.forEach((e) => { inc[e.id] = e.ctc > 0; });
      setIncluded(inc);
      setLoading(false);
    })();
  }, [step]);

  const computed = useMemo(() => employees.filter((e) => included[e.id]).map((e) => ({
    emp: e,
    calc: calcPayroll({
      ctc: e.ctc, workingDays, lopDays: lop[e.id] ?? 0,
      pf_applicable: !!e.pf_applicable, esi_applicable: !!e.esi_applicable, pt_applicable: !!e.pt_applicable,
    }),
  })), [employees, included, lop, workingDays]);

  const totals = computed.reduce((acc, r) => ({ gross: acc.gross + r.calc.grossPay, net: acc.net + r.calc.netPay }), { gross: 0, net: 0 });

  const finalize = async () => {
    setBusy(true);
    const { data: existing } = await supabase.from("payroll_runs").select("id").eq("month", month).eq("year", year).maybeSingle();
    if (existing) { setBusy(false); return toast.error(`Payroll for ${periodLabel(month, year)} already exists`); }

    const { data: run, error } = await supabase.from("payroll_runs").insert({
      month, year, status: "Finalized", total_gross: totals.gross, total_net: totals.net, finalized_at: new Date().toISOString(),
    }).select().single();
    if (error || !run) { setBusy(false); return toast.error(error?.message ?? "Failed"); }

    const entries = computed.map((r) => ({
      run_id: run.id, employee_id: r.emp.id,
      working_days: workingDays, lop_days: lop[r.emp.id] ?? 0,
      gross_pay: r.calc.grossPay, net_pay: r.calc.netPay,
      pf_employee: r.calc.pf_employee, pf_employer: r.calc.pf_employer,
      esi_employee: r.calc.esi_employee, esi_employer: r.calc.esi_employer,
      pt: r.calc.pt, tds: r.calc.tds, other_deductions: 0,
      components_snapshot: r.calc.components_snapshot,
    }));
    const { error: e2 } = await supabase.from("payroll_entries").insert(entries);
    if (e2) { setBusy(false); return toast.error(e2.message); }

    const slips = computed.map((r) => ({
      run_id: run.id, employee_id: r.emp.id,
      payslip_data: {
        employee: { full_name: r.emp.full_name, emp_id: r.emp.emp_id, designation: r.emp.designation, department: r.emp.department },
        period: { month, year }, workingDays, lopDays: lop[r.emp.id] ?? 0,
        earnings: r.calc.earnings, deductions: r.calc.deductions,
        grossPay: r.calc.grossPay, totalDeductions: r.calc.totalDeductions, netPay: r.calc.netPay,
      },
    }));
    await supabase.from("payslips").insert(slips);

    setBusy(false);
    toast.success(`Payroll for ${periodLabel(month, year)} finalized`);
    navigate({ to: "/payroll/history" });
  };

  return (
    <div>
      <PageHeader title="Run Payroll" subtitle="Calculate and finalize payroll for the month" />

      <div className="card-elev p-1.5 mb-5 inline-flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-2 ${i === step ? "bg-primary text-primary-foreground" : i < step ? "text-primary" : "text-muted-foreground"}`}>
            {i < step ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-5 w-5 rounded-full border flex items-center justify-center text-xs">{i + 1}</span>}
            {s}
          </div>
        ))}
      </div>

      <div className="card-elev p-6">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div className="space-y-1.5"><label className="text-sm">Month</label>
              <select className="h-10 border rounded-md px-3 w-full text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
              </select></div>
            <div className="space-y-1.5"><label className="text-sm">Year</label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><label className="text-sm">Working Days</label>
              <Input type="number" value={workingDays} onChange={(e) => setWorkingDays(Number(e.target.value))} /></div>
          </div>
        )}

        {step === 1 && (
          loading ? <TableSkeleton /> : employees.length === 0 ? (
            <EmptyState title="No active employees" description="Add employees with a CTC before running payroll." />
          ) : (
            <DataTable>
              <thead className="bg-muted/40"><tr><Th>Include</Th><Th>Employee</Th><Th>CTC (Annual)</Th><Th>LOP Days</Th></tr></thead>
              <tbody className="divide-y">
                {employees.map((e) => (
                  <tr key={e.id}>
                    <Td><input type="checkbox" checked={!!included[e.id]} onChange={(ev) => setIncluded({ ...included, [e.id]: ev.target.checked })} /></Td>
                    <Td><div className="font-medium">{e.full_name}</div><div className="text-xs text-muted-foreground font-mono">{e.emp_id}{e.ctc === 0 && " · No CTC"}</div></Td>
                    <Td>{formatINR(e.ctc)}</Td>
                    <Td><Input type="number" min={0} max={workingDays} className="h-8 w-20" value={lop[e.id] ?? 0} onChange={(ev) => setLop({ ...lop, [e.id]: Number(ev.target.value) })} /></Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )
        )}

        {step === 2 && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Stat label="Employees" value={String(computed.length)} />
              <Stat label="Gross Payable" value={formatINR(totals.gross)} />
              <Stat label="Net Payable" value={formatINR(totals.net)} />
            </div>
            <DataTable>
              <thead className="bg-muted/40"><tr><Th>Employee</Th><Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th><Th className="text-right">Net Pay</Th></tr></thead>
              <tbody className="divide-y">
                {computed.map((r) => (
                  <tr key={r.emp.id}>
                    <Td><div className="font-medium">{r.emp.full_name}</div><div className="text-xs text-muted-foreground font-mono">{r.emp.emp_id}</div></Td>
                    <Td className="text-right">{formatINR(r.calc.grossPay)}</Td>
                    <Td className="text-right text-destructive">{formatINR(r.calc.totalDeductions)}</Td>
                    <Td className="text-right font-semibold">{formatINR(r.calc.netPay)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Ready to finalize</h3>
            <p className="text-sm text-muted-foreground mt-1">Finalizing payroll for <strong>{periodLabel(month, year)}</strong> across <strong>{computed.length}</strong> employees.</p>
            <p className="text-sm mt-2">Total Net Payable: <strong className="text-primary">{formatINR(totals.net)}</strong></p>
            <p className="text-xs text-muted-foreground mt-3">This action will create payslips and cannot be undone for the same month.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
          {step < 3
            ? <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && computed.length === 0}>Continue <ChevronRight className="h-4 w-4 ml-1" /></Button>
            : <Button onClick={finalize} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Finalize Payroll</Button>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border rounded-lg p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div><div className="text-xl font-semibold mt-1">{value}</div></div>;
}