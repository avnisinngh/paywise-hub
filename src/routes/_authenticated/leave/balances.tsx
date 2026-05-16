import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, Th, Td, EmptyState, TableSkeleton } from "@/components/app/Table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Emp { id: string; full_name: string; emp_id: string; status: string }
interface LType { id: string; name: string; annual_entitlement: number }
interface Req { employee_id: string; leave_type_id: string; days: number; status: string }

function LeaveBalancesPage() {
  const [employees, setEmployees] = useState<Emp[] | null>(null);
  const [types, setTypes] = useState<LType[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [e, t, r] = await Promise.all([
        supabase.from("employees").select("id, full_name, emp_id, status").order("full_name"),
        supabase.from("leave_types").select("id, name, annual_entitlement").order("name"),
        supabase.from("leave_requests").select("employee_id, leave_type_id, days, status").eq("status", "Approved"),
      ]);
      if (e.error) toast.error(e.error.message);
      setEmployees(e.data ?? []);
      setTypes(t.data ?? []);
      setRequests(r.data ?? []);
    })();
  }, []);

  const usedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of requests) {
      const k = `${r.employee_id}:${r.leave_type_id}`;
      m.set(k, (m.get(k) ?? 0) + Number(r.days));
    }
    return m;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (employees ?? []).filter((e) => !q || e.full_name.toLowerCase().includes(q) || e.emp_id.toLowerCase().includes(q));
  }, [employees, search]);

  return (
    <div>
      <PageHeader
        title="Leave Balances"
        subtitle="Annual entitlement minus approved leaves for the current period"
      />
      <div className="card-elev">
        <div className="p-3 border-b">
          <Input
            placeholder="Search employee by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {employees === null ? <TableSkeleton rows={6} cols={(types.length || 3) + 1} /> :
          types.length === 0 ? (
            <EmptyState title="No leave types configured" description="Add leave types first to see balances." />
          ) : filtered.length === 0 ? (
            <EmptyState title="No employees" />
          ) : (
            <DataTable>
              <thead className="bg-muted/40">
                <tr>
                  <Th>Employee</Th>
                  {types.map((t) => <Th key={t.id}>{t.name}</Th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-t">
                    <Td>
                      <div className="font-medium">{emp.full_name}</div>
                      <div className="text-xs text-muted-foreground">{emp.emp_id}</div>
                    </Td>
                    {types.map((t) => {
                      const used = usedMap.get(`${emp.id}:${t.id}`) ?? 0;
                      const bal = Math.max(0, t.annual_entitlement - used);
                      return (
                        <Td key={t.id}>
                          <div className="text-sm font-medium">{bal} <span className="text-xs text-muted-foreground font-normal">/ {t.annual_entitlement}</span></div>
                          <div className="text-[11px] text-muted-foreground">{used} used</div>
                        </Td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/leave/balances")({ component: LeaveBalancesPage });