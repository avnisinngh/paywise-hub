import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, Th, Td, EmptyState, TableSkeleton } from "@/components/app/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface LeaveType { id: string; name: string; annual_entitlement: number }

function Editor({ initial, onSaved, trigger }: { initial?: LeaveType; onSaved: () => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [days, setDays] = useState(String(initial?.annual_entitlement ?? 12));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = { name: name.trim(), annual_entitlement: Number(days) || 0 };
    const { error } = initial
      ? await supabase.from("leave_types").update(payload).eq("id", initial.id)
      : await supabase.from("leave_types").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "Leave type updated" : "Leave type created");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Leave Type" : "New Leave Type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Casual Leave" />
          </div>
          <div className="space-y-2">
            <Label>Annual entitlement (days)</Label>
            <Input type="number" min="0" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveTypesPage() {
  const [rows, setRows] = useState<LeaveType[] | null>(null);

  const load = async () => {
    setRows(null);
    const { data, error } = await supabase.from("leave_types").select("*").order("name");
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this leave type? Existing requests will keep their reference.")) return;
    const { error } = await supabase.from("leave_types").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Leave Types"
        subtitle="Configure the categories of leave employees can request"
        actions={
          <Editor
            onSaved={load}
            trigger={<Button><Plus className="h-4 w-4 mr-1.5" /> New Leave Type</Button>}
          />
        }
      />
      <div className="card-elev">
        {rows === null ? (
          <TableSkeleton rows={5} cols={3} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No leave types yet"
            description="Create categories like Casual, Sick, or Earned Leave to enable requests."
          />
        ) : (
          <DataTable>
            <thead className="bg-muted/40">
              <tr>
                <Th>Name</Th>
                <Th>Annual Entitlement</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <Td className="font-medium">{r.name}</Td>
                  <Td>{r.annual_entitlement} days / year</Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Editor
                        initial={r}
                        onSaved={load}
                        trigger={<Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>}
                      />
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/leave/types")({ component: LeaveTypesPage });