import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, TableSkeleton } from "@/components/app/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Emp { id: string; full_name: string; emp_id: string }
interface Att { employee_id: string; date: string; status: string }

const STATUSES = [
  { key: "P", label: "Present", cls: "bg-emerald-500 text-white" },
  { key: "A", label: "Absent", cls: "bg-red-500 text-white" },
  { key: "L", label: "Leave", cls: "bg-amber-500 text-white" },
  { key: "H", label: "Holiday", cls: "bg-slate-400 text-white" },
  { key: "W", label: "Weekly Off", cls: "bg-slate-200 text-slate-600" },
] as const;

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function AttendancePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [employees, setEmployees] = useState<Emp[] | null>(null);
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const load = async () => {
    setEmployees(null);
    const start = ymd(year, month, 1);
    const end = ymd(year, month, totalDays);
    const [e, a] = await Promise.all([
      supabase.from("employees").select("id, full_name, emp_id").eq("status", "Active").order("full_name"),
      supabase.from("attendance").select("employee_id, date, status").gte("date", start).lte("date", end),
    ]);
    if (e.error) toast.error(e.error.message);
    setEmployees(e.data ?? []);
    const m = new Map<string, string>();
    for (const row of (a.data ?? []) as Att[]) m.set(`${row.employee_id}:${row.date}`, row.status);
    setAttendance(m);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month]);

  const setCell = async (empId: string, day: number, status: string) => {
    const date = ymd(year, month, day);
    const key = `${empId}:${date}`;
    setSaving(key);
    const { error } = await supabase
      .from("attendance")
      .upsert({ employee_id: empId, date, status }, { onConflict: "employee_id,date" });
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    setAttendance((prev) => new Map(prev).set(key, status));
  };

  const cycleStatus = (curr: string | undefined) => {
    const idx = STATUSES.findIndex((s) => s.key === curr);
    return STATUSES[(idx + 1) % STATUSES.length].key;
  };

  const shift = (delta: number) => {
    let m = month + delta; let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (employees ?? []).filter((e) => !q || e.full_name.toLowerCase().includes(q) || e.emp_id.toLowerCase().includes(q));
  }, [employees, search]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Click a cell to cycle through statuses — saves automatically"
        actions={
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-3 text-sm font-medium w-40 text-center">{monthLabel}</div>
            <Button size="icon" variant="outline" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        }
      />
      <div className="card-elev">
        <div className="flex flex-wrap items-center gap-4 p-3 border-b">
          <Input
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2 text-xs">
            <Label className="text-muted-foreground">Legend:</Label>
            {STATUSES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1">
                <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-semibold", s.cls)}>{s.key}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
        {employees === null ? <TableSkeleton rows={6} cols={10} /> :
          filtered.length === 0 ? (
            <EmptyState title="No active employees" description="Add employees to mark attendance." />
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground sticky left-0 bg-muted/40 z-10 min-w-[180px]">Employee</th>
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const d = i + 1;
                      const dow = new Date(year, month - 1, d).getDay();
                      const weekend = dow === 0 || dow === 6;
                      return (
                        <th key={d} className={cn("px-1.5 py-2 font-medium border-l text-center min-w-[28px]", weekend && "bg-slate-100 text-slate-500")}>
                          {d}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="border-t">
                      <td className="px-3 py-1.5 sticky left-0 bg-card z-10">
                        <div className="font-medium">{emp.full_name}</div>
                        <div className="text-[10px] text-muted-foreground">{emp.emp_id}</div>
                      </td>
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const d = i + 1;
                        const date = ymd(year, month, d);
                        const key = `${emp.id}:${date}`;
                        const status = attendance.get(key);
                        const meta = STATUSES.find((s) => s.key === status);
                        return (
                          <td key={d} className="border-l p-0.5 text-center">
                            <button
                              onClick={() => setCell(emp.id, d, cycleStatus(status))}
                              disabled={saving === key}
                              className={cn(
                                "h-6 w-6 rounded text-[10px] font-semibold transition hover:opacity-80",
                                meta ? meta.cls : "bg-muted text-muted-foreground hover:bg-muted/70",
                                saving === key && "opacity-50",
                              )}
                              title={meta?.label ?? "Unmarked"}
                            >
                              {status ?? "·"}
                            </button>
                          </td>
                        );
                      })}
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

export const Route = createFileRoute("/_authenticated/leave/attendance")({ component: AttendancePage });