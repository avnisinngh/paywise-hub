import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, Th, Td, EmptyState, TableSkeleton, StatusBadge } from "@/components/app/Table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import { formatDate } from "@/lib/format";

interface Row {
  id: string; status: string; from_date: string; to_date: string;
  days: number; reason: string | null;
  employee_id: string; leave_type_id: string;
}
interface EmpRef { id: string; full_name: string; emp_id: string }
interface TypeRef { id: string; name: string }

function daysBetween(a: string, b: string) {
  const d1 = new Date(a); const d2 = new Date(b);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

function NewRequest({ employees, types, onCreated }: { employees: EmpRef[]; types: TypeRef[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const days = from && to ? daysBetween(from, to) : 0;

  const submit = async () => {
    if (!empId || !typeId || !from || !to) { toast.error("Fill all required fields"); return; }
    if (new Date(to) < new Date(from)) { toast.error("End date before start date"); return; }
    setSaving(true);
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: empId, leave_type_id: typeId, from_date: from, to_date: to,
      days, reason: reason || null, status: "Pending",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Leave request created");
    setOpen(false);
    setEmpId(""); setTypeId(""); setFrom(""); setTo(""); setReason("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1.5" /> New Request</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-2 col-span-2">
            <Label>Employee</Label>
            <Select value={empId} onValueChange={setEmpId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.emp_id} — {e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Leave type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">Duration: <span className="font-medium text-foreground">{days} day(s)</span></div>
          <div className="space-y-2 col-span-2">
            <Label>Reason</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveRequestsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [employees, setEmployees] = useState<EmpRef[]>([]);
  const [types, setTypes] = useState<TypeRef[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setRows(null);
    const [r, e, t] = await Promise.all([
      supabase.from("leave_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, full_name, emp_id").order("full_name"),
      supabase.from("leave_types").select("id, name").order("name"),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows(r.data ?? []);
    setEmployees(e.data ?? []);
    setTypes(t.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const typeMap = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t.name])), [types]);
  const filtered = useMemo(() => (rows ?? []).filter((r) => filter === "all" || r.status === filter), [rows, filter]);

  const setStatus = async (id: string, status: "Approved" | "Rejected") => {
    const { error } = await supabase.from("leave_requests").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Request ${status.toLowerCase()}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        subtitle="Review, approve or reject employee leave requests"
        actions={<NewRequest employees={employees} types={types} onCreated={load} />}
      />
      <div className="card-elev">
        <div className="flex items-center gap-2 p-3 border-b">
          <Label className="text-xs text-muted-foreground">Status:</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {rows === null ? <TableSkeleton rows={6} cols={6} /> :
          filtered.length === 0 ? (
            <EmptyState title="No leave requests" description="New requests will show here." />
          ) : (
            <DataTable>
              <thead className="bg-muted/40">
                <tr>
                  <Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Status</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const emp = empMap[r.employee_id];
                  const status = r.status === "Approved" ? "active" : r.status === "Rejected" ? "failed" : "pending";
                  return (
                    <tr key={r.id} className="border-t">
                      <Td>{emp ? `${emp.emp_id} — ${emp.full_name}` : "—"}</Td>
                      <Td>{typeMap[r.leave_type_id] ?? "—"}</Td>
                      <Td>{formatDate(r.from_date)}</Td>
                      <Td>{formatDate(r.to_date)}</Td>
                      <Td>{r.days}</Td>
                      <Td><StatusBadge status={status as "active"|"failed"|"pending"}>{r.status}</StatusBadge></Td>
                      <Td className="text-right">
                        {r.status === "Pending" ? (
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "Approved")}>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "Rejected")}>
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/leave/requests")({ component: LeaveRequestsPage });