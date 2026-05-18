import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Link2, Copy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createOnboardingToken } from "@/lib/onboarding.functions";
import { EmployeeForm, emptyEmployeeValues, type EmployeeFormValues } from "@/components/app/EmployeeForm";

export const Route = createFileRoute("/_authenticated/employees/new")({ component: NewEmployee });

function NewEmployee() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<EmployeeFormValues>(() => emptyEmployeeValues("EMP-" + Math.floor(1000 + Math.random() * 9000)));
  const [ctc, setCtc] = useState(0);
  const [structureId, setStructureId] = useState<string | null>(null);
  const [onbLink, setOnbLink] = useState<string | null>(null);
  const createToken = useServerFn(createOnboardingToken);

  useEffect(() => {
    supabase.from("salary_structures").select("id, name").then(({ data }) => setStructures(data ?? []));
  }, []);

  const submit = async (mode: "save" | "forward") => {
    if (!values.emp_id.trim()) { toast.error("Employee ID is required"); return; }
    if (!values.full_name.trim()) { toast.error("Full name is required"); return; }

    setBusy(true);
    const payload: any = { ...values };
    // Convert empty strings to null for optional fields
    ["dob","date_of_joining","gender","pan","aadhaar","personal_email","phone","father_name",
     "emergency_contact","emergency_contact_name","department","designation","work_location",
     "bank_account","ifsc","bank_name","account_holder_name","skills"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = null;
    });

    const { data: emp, error } = await supabase.from("employees").insert(payload).select().single();
    if (error || !emp) { setBusy(false); toast.error(error?.message ?? "Failed to create employee"); return; }

    if (ctc > 0) {
      await supabase.from("employee_salary").insert({ employee_id: emp.id, structure_id: structureId, ctc });
    }

    if (mode === "forward") {
      try {
        const { token } = await createToken({ data: { employee_id: emp.id } });
        const url = `${window.location.origin}/onboard/${token}`;
        setOnbLink(url);
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.success("Employee created — onboarding link copied to clipboard");
      } catch (err: any) { toast.error(err.message ?? "Created employee but failed to generate link"); }
      setBusy(false);
      return;
    }

    toast.success(`Employee ${emp.full_name} added`);
    setBusy(false);
    navigate({ to: "/employees/$id", params: { id: emp.id } });
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/employees" })} className="mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <PageHeader title="Add Employee" subtitle="Create a new employee record" />

      {onbLink && (
        <div className="card-elev p-4 mb-5 bg-primary/5 border-primary/20">
          <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Onboarding link (share with employee)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border rounded px-2 py-1.5 truncate">{onbLink}</code>
            <Button type="button" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(onbLink); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Send this link to the employee so they can fill the rest of their details themselves.</p>
        </div>
      )}

      <EmployeeForm
        initial={values}
        structures={structures}
        structureId={structureId}
        ctc={ctc}
        onChange={setValues}
        onStructureChange={setStructureId}
        onCtcChange={setCtc}
      />

      <div className="flex flex-wrap justify-end gap-2 pt-5">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/employees" })}>Cancel</Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => submit("forward")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-1" />}
          Save & Forward Onboarding Link
        </Button>
        <Button type="button" disabled={busy} onClick={() => submit("save")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Employee
        </Button>
      </div>
    </div>
  );
}
