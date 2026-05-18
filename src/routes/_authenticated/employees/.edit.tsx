import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { EmployeeForm, valuesFromEmployee, type EmployeeFormValues } from "@/components/app/EmployeeForm";

export const Route = createFileRoute("/_authenticated/employees/$id/edit")({ component: EditEmployee });

function EditEmployee() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState<EmployeeFormValues | null>(null);
  const [ctc, setCtc] = useState(0);
  const [structureId, setStructureId] = useState<string | null>(null);
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);
  const [salaryRowId, setSalaryRowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: e }, { data: s }, { data: str }] = await Promise.all([
        supabase.from("employees").select("*").eq("id", id).maybeSingle(),
        supabase.from("employee_salary").select("*").eq("employee_id", id).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("salary_structures").select("id, name"),
      ]);
      if (e) setValues(valuesFromEmployee(e));
      if (s) { setCtc(Number(s.ctc) || 0); setStructureId(s.structure_id ?? null); setSalaryRowId(s.id); }
      setStructures(str ?? []);
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!values) return;
    if (!values.emp_id.trim()) { toast.error("Employee ID is required"); return; }
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
        await supabase.from("employee_salary").insert({ employee_id: id, ctc, structure_id: structureId });
      }
    }

    setBusy(false);
    toast.success("Employee updated");
    navigate({ to: "/employees/$id", params: { id } });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!values) return <div className="text-center py-20 text-muted-foreground">Employee not found</div>;

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
