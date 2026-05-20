import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DataTable, Th, Td, TableSkeleton, EmptyState } from "@/components/app/Table";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/salary/structures")({ component: StructuresPage });

type CompRef = { component_id: string; value?: number };

function StructuresPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<CompRef[]>([]);

  const load = async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("salary_structures").select("*").order("created_at", { ascending: false }),
      supabase.from("salary_components").select("*").order("type").order("name"),
    ]);
    setRows(s ?? []); setComponents(c ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setName(""); setPicked([]); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing(r); setName(r.name);
    setPicked(Array.isArray(r.components) ? r.components : []);
    setOpen(true);
  };

  const onSave = async () => {
    if (!name.trim()) return toast.error("Name is required");
    const payload = { name: name.trim(), components: picked };
    const { error } = editing
      ? await supabase.from("salary_structures").update(payload).eq("id", editing.id)
      : await supabase.from("salary_structures").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Structure updated" : "Structure created");
    setOpen(false); load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this structure?")) return;
    const { error } = await supabase.from("salary_structures").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const addComp = (component_id: string) => {
    if (!component_id || picked.some((p) => p.component_id === component_id)) return;
    const c = components.find((x) => x.id === component_id);
    setPicked([...picked, { component_id, value: Number(c?.default_value ?? 0) }]);
  };

  const componentById = (id: string) => components.find((c) => c.id === id);

  return (
    <div>
      <PageHeader
        title="Salary Structures"
        subtitle="Reusable templates that define how CTC is broken down"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Structure</Button>}
      />

      <div className="card-elev">
        {loading ? <TableSkeleton cols={4} /> : rows.length === 0 ? (
          <EmptyState title="No structures yet" description="Create a reusable salary structure to assign to employees." />
        ) : (
          <DataTable>
            <thead className="bg-muted">
              <tr><Th>Name</Th><Th>Components</Th><Th>Earnings</Th><Th>Deductions</Th><Th>{""}</Th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const comps: CompRef[] = Array.isArray(r.components) ? r.components : [];
                const earn = comps.filter((p) => componentById(p.component_id)?.type === "earning").length;
                const ded = comps.filter((p) => componentById(p.component_id)?.type === "deduction").length;
                return (
                  <tr key={r.id} className="border-t">
                    <Td className="font-medium">{r.name}</Td>
                    <Td>{comps.length}</Td>
                    <Td>{earn}</Td>
                    <Td>{ded}</Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => onDelete(r.id)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Structure" : "New Structure"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Engineer" /></div>

            <div>
              <Label>Add Component</Label>
              <select
                className="h-9 w-full px-3 rounded-md border bg-background text-sm"
                value=""
                onChange={(e) => { addComp(e.target.value); e.currentTarget.value = ""; }}
              >
                <option value="">Select component to add…</option>
                {components.filter((c) => !picked.some((p) => p.component_id === c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
              {picked.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No components added yet.</div>
              ) : picked.map((p, i) => {
                const c = componentById(p.component_id);
                if (!c) return null;
                return (
                  <div key={p.component_id} className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.type} · {c.calc_type === "percentage" ? "% of Basic" : "Fixed"}</div>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32"
                      value={p.value ?? 0}
                      onChange={(e) => {
                        const next = [...picked];
                        next[i] = { ...p, value: Number(e.target.value) };
                        setPicked(next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground w-6">{c.calc_type === "percentage" ? "%" : "₹"}</span>
                    <button onClick={() => setPicked(picked.filter((_, j) => j !== i))} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}