import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees/new")({ component: NewEmployee });

function NewEmployee() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [empId, setEmpId] = useState("");

  useEffect(() => {
    supabase.from("salary_structures").select("id, name").then(({ data }) => setStructures(data ?? []));
    setEmpId("EMP-" + Math.floor(1000 + Math.random() * 9000));
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) ?? "").toString().trim() || null;
    const ctc = Number(fd.get("ctc") ?? 0);
    const structureId = get("structure_id");

    setBusy(true);
    const { data: emp, error } = await supabase.from("employees").insert({
      emp_id: empId,
      full_name: get("full_name") ?? "",
      dob: get("dob"),
      gender: get("gender"),
      pan: get("pan"),
      aadhaar: get("aadhaar"),
      personal_email: get("personal_email"),
      phone: get("phone"),
      department: get("department"),
      designation: get("designation"),
      date_of_joining: get("date_of_joining"),
      employment_type: get("employment_type") ?? "Full-time",
      work_location: get("work_location"),
      bank_account: get("bank_account"),
      ifsc: get("ifsc"),
      bank_name: get("bank_name"),
      account_holder_name: get("account_holder_name"),
      pf_applicable: fd.get("pf_applicable") === "on",
      esi_applicable: fd.get("esi_applicable") === "on",
      pt_applicable: fd.get("pt_applicable") === "on",
    }).select().single();

    if (error || !emp) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to create employee");
      return;
    }

    if (ctc > 0) {
      await supabase.from("employee_salary").insert({
        employee_id: emp.id,
        structure_id: structureId,
        ctc,
      });
    }

    toast.success(`Employee ${emp.full_name} added`);
    setBusy(false);
    navigate({ to: "/employees/$id", params: { id: emp.id } });
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/employees" })} className="mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <PageHeader title="Add Employee" subtitle="Create a new employee record" />

      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Personal Information">
          <Field label="Full Name" name="full_name" required />
          <Field label="Date of Birth" name="dob" type="date" />
          <SelectField label="Gender" name="gender" options={["Male","Female","Other"]} />
          <Field label="PAN Number" name="pan" placeholder="ABCDE1234F" />
          <Field label="Aadhaar Number" name="aadhaar" />
          <Field label="Personal Email" name="personal_email" type="email" />
          <Field label="Phone" name="phone" />
        </Section>

        <Section title="Employment Details">
          <div>
            <Label>Employee ID</Label>
            <Input value={empId} readOnly className="bg-muted font-mono" />
          </div>
          <Field label="Department" name="department" />
          <Field label="Designation" name="designation" />
          <Field label="Date of Joining" name="date_of_joining" type="date" />
          <SelectField label="Employment Type" name="employment_type" options={["Full-time","Part-time","Contract"]} />
          <Field label="Work Location" name="work_location" />
        </Section>

        <Section title="Salary">
          <Field label="CTC (₹ per annum)" name="ctc" type="number" step="0.01" />
          <div>
            <Label>Salary Structure Template</Label>
            <select name="structure_id" className="h-9 w-full px-3 rounded-md border bg-background text-sm">
              <option value="">— None —</option>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Bank Details">
          <Field label="Account Holder Name" name="account_holder_name" />
          <Field label="Account Number" name="bank_account" />
          <Field label="IFSC Code" name="ifsc" placeholder="HDFC0001234" />
          <Field label="Bank Name" name="bank_name" />
        </Section>

        <Section title="Statutory Compliance">
          <Toggle label="PF applicable" name="pf_applicable" defaultChecked />
          <Toggle label="ESI applicable" name="esi_applicable" />
          <Toggle label="Professional Tax applicable" name="pt_applicable" defaultChecked />
        </Section>

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/employees" })}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Employee
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elev p-5">
      <h3 className="font-semibold text-secondary-foreground mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, name, ...rest } = props;
  return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...rest} /></div>;
}
function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select name={name} className="h-9 w-full px-3 rounded-md border bg-background text-sm">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}