import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable, Th, Td } from "@/components/app/Table";
import { formatINR, monthName, formatDate } from "@/lib/format";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { generatePayslipPDF } from "@/lib/payslip-pdf";

export const Route = createFileRoute("/_authenticated/payroll/$id")({ component: PayrollDetail });

function PayrollDetail() {
  const { id } = Route.useParams();
  const [run, setRun] = useState<any>(null);
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from("payroll_runs").select("*").eq("id", id).maybeSingle(),
        supabase.from("payslips").select("*, employees(full_name, emp_id, designation, department, pan, bank_account, ifsc)").eq("run_id", id),
      ]);
      setRun(r); setSlips(s ?? []); setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!run) return <div className="text-center py-20 text-muted-foreground">Payroll run not found</div>;

  const downloadOne = (slip: any) => {
    const e = slip.employees ?? {};
    generatePayslipPDF({
      ...slip.payslip_data,
      employee: { ...slip.payslip_data.employee, pan: e.pan, bank_account: e.bank_account, ifsc: e.ifsc },
    });
  };

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2"><Link to="/payroll/history"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
      <PageHeader title={`${monthName(run.month)} ${run.year} Payroll`} subtitle={`Finalized ${formatDate(run.finalized_at)} · ${slips.length} payslips`} />
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card label="Status" value={run.status} />
        <Card label="Gross" value={formatINR(run.total_gross)} />
        <Card label="Net" value={formatINR(run.total_net)} />
      </div>
      <div className="card-elev">
        <DataTable>
          <thead className="bg-muted/40"><tr><Th>Employee</Th><Th className="text-right">Gross</Th><Th className="text-right">Net Pay</Th><Th> </Th></tr></thead>
          <tbody className="divide-y">
            {slips.map((s) => (
              <tr key={s.id}>
                <Td><div className="font-medium">{s.employees?.full_name}</div><div className="text-xs text-muted-foreground font-mono">{s.employees?.emp_id}</div></Td>
                <Td className="text-right">{formatINR(s.payslip_data?.grossPay ?? 0)}</Td>
                <Td className="text-right font-semibold">{formatINR(s.payslip_data?.netPay ?? 0)}</Td>
                <Td><Button size="sm" variant="ghost" onClick={() => downloadOne(s)}><Download className="h-4 w-4 mr-1" /> Payslip</Button></Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="card-elev p-4"><div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div><div className="text-lg font-semibold mt-1">{value}</div></div>;
}