import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable, Th, Td, EmptyState, TableSkeleton } from "@/components/app/Table";
import { formatINR, monthName } from "@/lib/format";
import { BarChart3, Users, Wallet, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [empCount, setEmpCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { count }] = await Promise.all([
        supabase.from("payroll_runs").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "Active"),
      ]);
      setRuns(r ?? []);
      setEmpCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const ytdGross = runs.reduce((s, r) => s + Number(r.total_gross ?? 0), 0);
  const ytdNet = runs.reduce((s, r) => s + Number(r.total_net ?? 0), 0);

  const exportCSV = async () => {
    const { data: entries } = await supabase
      .from("payroll_entries")
      .select("*, employees(emp_id, full_name, department), payroll_runs(month, year)");
    if (!entries?.length) return toast.error("No payroll data to export");
    const headers = ["Period","Emp ID","Name","Department","Working Days","LOP Days","Gross","PF (Emp)","ESI (Emp)","PT","TDS","Net Pay"];
    const rows = entries.map((e: any) => [
      `${monthName(e.payroll_runs?.month)} ${e.payroll_runs?.year}`,
      e.employees?.emp_id, e.employees?.full_name, e.employees?.department ?? "",
      e.working_days, e.lop_days, e.gross_pay, e.pf_employee, e.esi_employee, e.pt, e.tds, e.net_pay,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payroll-register-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success("Exported payroll register");
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Payroll analytics and exports" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <Stat icon={Users} label="Active Employees" value={String(empCount)} />
        <Stat icon={Wallet} label="Payroll Runs" value={String(runs.length)} />
        <Stat icon={BarChart3} label="Total Gross (All Runs)" value={formatINR(ytdGross)} />
        <Stat icon={BarChart3} label="Total Net (All Runs)" value={formatINR(ytdNet)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <ReportCard title="Payroll Register" desc="Export all payroll entries to CSV" action={
          <Button size="sm" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1.5" />Export CSV</Button>
        } />
        <ReportCard title="PF / ESI / PT Registers" desc="Statutory contribution reports per run" action={
          <Link to="/payroll/history"><Button size="sm" variant="outline">View Runs</Button></Link>
        } />
        <ReportCard title="Leave Balance Report" desc="Employee-wise leave balance matrix" action={
          <Link to="/leave/balances"><Button size="sm" variant="outline">Open</Button></Link>
        } />
      </div>

      <div className="card-elev">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-secondary-foreground">Payroll Run History</h3>
            <p className="text-xs text-muted-foreground">Click a run to see detailed breakdown</p>
          </div>
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        </div>
        {loading ? <TableSkeleton /> : runs.length === 0 ? (
          <EmptyState title="No payroll runs yet" description="Reports populate after you run payroll." />
        ) : (
          <DataTable>
            <thead className="bg-muted/40"><tr>
              <Th>Period</Th><Th>Status</Th><Th className="text-right">Gross</Th><Th className="text-right">Net</Th><Th>Finalized</Th>
            </tr></thead>
            <tbody className="divide-y">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-accent/40">
                  <Td><Link to="/payroll/$id" params={{ id: r.id }} className="text-primary hover:underline font-medium">{monthName(r.month)} {r.year}</Link></Td>
                  <Td><span className="text-xs capitalize">{r.status}</span></Td>
                  <Td className="text-right">{formatINR(r.total_gross)}</Td>
                  <Td className="text-right font-medium">{formatINR(r.total_net)}</Td>
                  <Td className="text-xs text-muted-foreground">{r.finalized_at ? new Date(r.finalized_at).toLocaleDateString() : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card-elev p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold text-secondary-foreground mt-0.5">{value}</div></div>
    </div>
  );
}

function ReportCard({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="card-elev p-5 flex flex-col gap-3">
      <div>
        <h4 className="font-semibold text-secondary-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </div>
      <div>{action}</div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });