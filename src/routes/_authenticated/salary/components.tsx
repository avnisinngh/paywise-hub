import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DataTable, Th, Td, TableSkeleton, EmptyState } from "@/components/app/Table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/salary/components")({ component: ComponentsPage });

function ComponentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("salary_components").select("*").order("type").order("name");
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("salary_components").insert({
      name: String(fd.get("name")),
      type: String(fd.get("type")),
      calc_type: String(fd.get("calc_type")),
      default_value: Number(fd.get("default_value") ?? 0),
      taxable: fd.get("taxable") === "on",
    });
    if (error) return toast.error(error.message);
    toast.success("Component added");
    setOpen(false); load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this component?")) return;
    const { error } = await supabase.from("salary_components").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div>
      <PageHeader
        title="Salary Components"
        subtitle="Earnings and deductions used in salary structures"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Component</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Salary Component</DialogTitle></DialogHeader>
              <form onSubmit={onAdd} className="space-y-3">
                <div><Label>Name</Label><Input name="name" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <select name="type" className="h-9 w-full px-3 rounded-md border bg-background text-sm">
                      <option value="earning">Earning</option><option value="deduction">Deduction</option>
                    </select>
                  </div>
                  <div><Label>Calculation</Label>
                    <select name="calc_type" className="h-9 w-full px-3 rounded-md border bg-background text-sm">
                      <option value="fixed">Fixed</option><option value="percentage">% of Basic</option>
                    </select>
                  </div>
                </div>
                <div><Label>Default Value</Label><Input type="number" step="0.01" name="default_value" defaultValue="0" /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="taxable" className="accent-primary h-4 w-4" defaultChecked /> Taxable</label>
                <DialogFooter><Button type="submit">Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-elev">
        {loading ? <TableSkeleton cols={5} /> : rows.length === 0 ? <EmptyState title="No components" /> : (
          <DataTable>
            <thead className="bg-muted">
              <tr><Th>Name</Th><Th>Type</Th><Th>Calculation</Th><Th>Default</Th><Th>Taxable</Th><Th>{""}</Th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <Td className="font-medium">{r.name}</Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === "earning" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{r.type}</span></Td>
                  <Td>{r.calc_type === "percentage" ? `${r.default_value}% of Basic` : "Fixed"}</Td>
                  <Td>{r.calc_type === "fixed" ? `₹${Number(r.default_value).toLocaleString("en-IN")}` : `${r.default_value}%`}</Td>
                  <Td>{r.taxable ? "Yes" : "No"}</Td>
                  <Td><button onClick={() => onDelete(r.id)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </div>
    </div>
  );
}