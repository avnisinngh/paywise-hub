import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { EmployeeForm, emptyEmployeeValues, valuesFromEmployee, type EmployeeFormValues } from "@/components/app/EmployeeForm";

export const Route = createFileRoute("/_authenticated/employees/$id/edit")({ component: EditEmployee });

function EditEmployee() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<EmployeeFormValues>(() => emptyEmployeeValues());
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);
  const [ctc, setCtc] = useState(0);
  const [structureId, setStructureId] = useState<string | null>(null);
  const [salaryRowId, setSalaryRowId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: emp, error }, { data: sals }, { data: structs }] = await Promise.all([
        supabase.from("employees").select("*").eq("id", id).maybeSingle(),
        supabase.from("employee_salary").select("id, ctc, structure_id").eq("employee_id", id).order("created_at", { ascending: false }).limit(1),
        supabase.from("salary_structures").select("id, name"),
      ]);
      if (error || !emp) { toast.error("Employee not found"); navigate({ to: "/employees" }); return; }
      setValues(valuesFromEmployee(emp));
      setStructures(structs ?? []);
      const sal = sals?.[0];
      if (sal) { setSalaryRowId(sal.id); setCtc(Number(sal.ctc ?? 0)); setStructureId(sal.structure_id ?? null); }
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!values.emp_id.trim()) { toast.error("Employee ID is required"); return; }
    if (!values.full_name.trim()) { toast.error("Full name is required"); return; }
    setBusy(true);
    const payload: any = { ...values };
    ["dob","date_of_joining","gender","pan","aadhaar","personal_email","phone","father_name",
     "emergency_contact","emergency_contact_name","department","designation","work_location",
     "bank_account","ifsc","bank_name","account_holder_name","skills"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = null;
    });
    const { error } = await supabase.from("employees").update(payload).eq("id", id);
    if (error) { setBusy(false); toast.error(error.message); return; }

    if (ctc > 0) {
      if (salaryRowId) {
        await supabase.from("employee_salary").update({ ctc, structure_id: structureId }).eq("id", salaryRowId);
      } else {
        await supabase.from("employee_salary").insert({ employee_id: id, structure_id: structureId, ctc });
      }
    }
    setBusy(false);
    toast.success("Employee updated");
    navigate({ to: "/employees/$id", params: { id } });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…</div>;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/employees/$id", params: { id } })} className="mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <PageHeader title="Edit Employee" subtitle={values.full_name} />
      <EmployeeForm
        initial={values}
        structures={structures}
        structureId={structureId}
        ctc={ctc}
        onChange={setValues}
        onStructureChange={setStructureId}
        onCtcChange={setCtc}
      />
      <div className="flex justify-end gap-2 pt-5">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/employees/$id", params: { id } })}>Cancel</Button>
        <Button type="button" disabled={busy} onClick={save}>
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
        </Button>
      </div>
    </div>
  );
}