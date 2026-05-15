import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate, monthName } from "@/lib/format";
import { Users, Wallet, Clock, CalendarCheck, Plus, Play, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

interface Stats {
  employees: number;
  monthAmount: number;
  pendingRuns: number;
  nextPayDate: string;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ employees: 0, monthAmount: 0, pendingRuns: 0, nextPayDate: "—" });
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [emp, runs] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("payroll_runs").select("*").order("year", { ascending: false }).order("month", { ascending: false }).limit(6),
      ]);
      const allRuns = runs.data ?? [];
      const now = new Date();
      const thisMonthRun = allRuns.find((r: any) => r.month === now.getMonth() + 1 && r.year === now.getFullYear());
      const pending = allRuns.filter((r: any) => r.status === "draft").length;
      const nextPay = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      setStats({
        employees: emp.count ?? 0,
        monthAmount: Number(thisMonthRun?.total_net ?? 0),
        pendingRuns: pending,
        nextPayDate: formatDate(nextPay),
      });
      setRecent(allRuns.slice(0, 3));
      setTrend(allRuns.slice().reverse().map((r: any) => ({ name: `${monthName(r.month).slice(0,3)} ${String(r.year).slice(2)}`, amount: Number(r.total_net) })));
      setLoading(false);
    })();
  }, []);

  const donutData = [
    { name: "Basic", value: 40, color: "oklch(0.58 0.10 190)" },
    { name: "HRA", value: 20, color: "oklch(0.65 0.13 200)" },
    { name: "Allowances", value: 25, color: "oklch(0.72 0.10 80)" },
    { name: "Deductions", value: 15, color: "oklch(0.55 0.18 25)" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of payroll and workforce"
        actions={
          <>
            <Button asChild variant="outline"><Link to="/employees/new"><Plus className="h-4 w-4 mr-1" /> Add Employee</Link></Button>
            <Button asChild><Link to="/payroll/run"><Play className="h-4 w-4 mr-1" /> Run Payroll</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon={Users} label="Total Employees" value={String(stats.employees)} tone="primary" loading={loading} />
        <StatTile icon={Wallet} label="This Month's Payroll" value={formatINR(stats.monthAmount)} tone="success" loading={loading} />
        <StatTile icon={Clock} label="Pending Runs" value={String(stats.pendingRuns)} tone="warning" loading={loading} />
        <StatTile icon={CalendarCheck} label="Next Pay Date" value={stats.nextPayDate} tone="primary" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-elev p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-foreground">Payroll Trend</h3>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          {trend.length === 0 ? (
            <EmptyChart label="No payroll runs yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <XAxis dataKey="name" stroke="oklch(0.50 0.02 255)" fontSize={12} />
                  <YAxis stroke="oklch(0.50 0.02 255)" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} cursor={{ fill: "oklch(0.95 0.03 190 / 0.4)" }} />
                  <Bar dataKey="amount" fill="oklch(0.58 0.10 190)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card-elev p-5">
          <h3 className="font-semibold text-secondary-foreground mb-4">Salary Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elev p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-foreground">Recent Payroll Runs</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/payroll/history">View all</Link></Button>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payroll runs yet.</p>
            <Button asChild className="mt-3" size="sm"><Link to="/payroll/run">Run your first payroll</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zebra text-left">
                <tr>
                  <Th>Period</Th><Th>Status</Th><Th className="text-right">Gross</Th><Th className="text-right">Net</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-accent/40">
                    <Td>{monthName(r.month)} {r.year}</Td>
                    <Td><StatusBadge status={r.status === "finalized" ? "active" : "pending"}>{r.status}</StatusBadge></Td>
                    <Td className="text-right">{formatINR(r.total_gross)}</Td>
                    <Td className="text-right font-medium">{formatINR(r.total_net)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone, loading }: { icon: any; label: string; value: string; tone: "primary"|"success"|"warning"; loading?: boolean }) {
  const toneClass = { primary: "bg-accent text-primary", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700" }[tone];
  return (
    <div className="card-elev p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      {loading ? <div className="h-7 w-24 bg-muted rounded animate-pulse" /> : <div className="text-2xl font-semibold text-secondary-foreground">{value}</div>}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}
export function StatusBadge({ status, children }: { status: "active"|"inactive"|"pending"|"failed"; children: React.ReactNode }) {
  const cls = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  }[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls} capitalize`}>{children}</span>;
}