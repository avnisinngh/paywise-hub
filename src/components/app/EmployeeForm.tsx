import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

export type ExperienceItem = { company: string; designation: string; from: string; to: string; description: string };
export type QualificationItem = { name: string; institution: string; year: string };

export type EmployeeFormValues = {
  emp_id: string;
  full_name: string;
  father_name: string;
  dob: string;
  gender: string;
  pan: string;
  aadhaar: string;
  personal_email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact: string;
  department: string;
  designation: string;
  date_of_joining: string;
  employment_type: string;
  work_location: string;
  bank_account: string;
  ifsc: string;
  bank_name: string;
  account_holder_name: string;
  pf_applicable: boolean;
  esi_applicable: boolean;
  pt_applicable: boolean;
  skills: string;
  previous_experience: ExperienceItem[];
  academic_qualifications: QualificationItem[];
  professional_qualifications: QualificationItem[];
};

export function emptyEmployeeValues(empId = ""): EmployeeFormValues {
  return {
    emp_id: empId, full_name: "", father_name: "", dob: "", gender: "", pan: "", aadhaar: "",
    personal_email: "", phone: "", emergency_contact_name: "", emergency_contact: "",
    department: "", designation: "", date_of_joining: "", employment_type: "Full-time", work_location: "",
    bank_account: "", ifsc: "", bank_name: "", account_holder_name: "",
    pf_applicable: true, esi_applicable: false, pt_applicable: true,
    skills: "", previous_experience: [], academic_qualifications: [], professional_qualifications: [],
  };
}

export function valuesFromEmployee(e: any): EmployeeFormValues {
  const base = emptyEmployeeValues();
  const merged: any = { ...base };
  for (const k of Object.keys(base)) {
    const v = e?.[k];
    if (v === null || v === undefined) continue;
    merged[k] = v;
  }
  merged.previous_experience = Array.isArray(e?.previous_experience) ? e.previous_experience : [];
  merged.academic_qualifications = Array.isArray(e?.academic_qualifications) ? e.academic_qualifications : [];
  merged.professional_qualifications = Array.isArray(e?.professional_qualifications) ? e.professional_qualifications : [];
  return merged as EmployeeFormValues;
}

export function EmployeeForm({
  initial, structures, structureId, ctc, showSalary = true,
  onChange, onStructureChange, onCtcChange,
}: {
  initial: EmployeeFormValues;
  structures?: { id: string; name: string }[];
  structureId?: string | null;
  ctc?: number;
  showSalary?: boolean;
  onChange: (v: EmployeeFormValues) => void;
  onStructureChange?: (id: string | null) => void;
  onCtcChange?: (n: number) => void;
}) {
  const [v, setV] = useState<EmployeeFormValues>(initial);
  useEffect(() => { setV(initial); }, [initial]);

  const set = <K extends keyof EmployeeFormValues>(k: K, val: EmployeeFormValues[K]) => {
    const next = { ...v, [k]: val };
    setV(next);
    onChange(next);
  };

  const truncate3 = <T,>(arr: T[]) => arr.slice(0, 3);

  return (
    <div className="space-y-5">
      <Section title="Personal Information">
        <FText label="Full Name" value={v.full_name} onChange={(x) => set("full_name", x)} required />
        <FText label="Father's Name" value={v.father_name} onChange={(x) => set("father_name", x)} />
        <FText label="Date of Birth" type="date" value={v.dob ?? ""} onChange={(x) => set("dob", x)} />
        <FSelect label="Gender" value={v.gender} onChange={(x) => set("gender", x)} options={["Male","Female","Other"]} />
        <FText label="PAN Number" value={v.pan} onChange={(x) => set("pan", x)} placeholder="ABCDE1234F" />
        <FText label="Aadhaar Number" value={v.aadhaar} onChange={(x) => set("aadhaar", x)} />
        <FText label="Personal Email" type="email" value={v.personal_email} onChange={(x) => set("personal_email", x)} />
        <FText label="Phone" value={v.phone} onChange={(x) => set("phone", x)} />
        <FText label="Emergency Contact Name" value={v.emergency_contact_name} onChange={(x) => set("emergency_contact_name", x)} />
        <FText label="Emergency Contact Phone" value={v.emergency_contact} onChange={(x) => set("emergency_contact", x)} />
      </Section>

      <Section title="Employment Details">
        <div>
          <Label>Employee ID</Label>
          <Input value={v.emp_id} onChange={(e) => set("emp_id", e.target.value)} className="font-mono" required />
        </div>
        <FText label="Department" value={v.department} onChange={(x) => set("department", x)} />
        <FText label="Designation" value={v.designation} onChange={(x) => set("designation", x)} />
        <FText label="Date of Joining" type="date" value={v.date_of_joining ?? ""} onChange={(x) => set("date_of_joining", x)} />
        <FSelect label="Employment Type" value={v.employment_type} onChange={(x) => set("employment_type", x)} options={["Full-time","Part-time","Contract"]} />
        <FText label="Work Location" value={v.work_location} onChange={(x) => set("work_location", x)} />
      </Section>

      {showSalary && (
        <Section title="Salary">
          <div>
            <Label>CTC (₹ per annum)</Label>
            <Input type="number" step="0.01" value={ctc ?? 0} onChange={(e) => onCtcChange?.(Number(e.target.value))} />
          </div>
          <div>
            <Label>Salary Structure Template</Label>
            <select value={structureId ?? ""} onChange={(e) => onStructureChange?.(e.target.value || null)} className="h-9 w-full px-3 rounded-md border bg-background text-sm">
              <option value="">— None —</option>
              {structures?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </Section>
      )}

      <Section title="Bank Details">
        <FText label="Account Holder Name" value={v.account_holder_name} onChange={(x) => set("account_holder_name", x)} />
        <FText label="Account Number" value={v.bank_account} onChange={(x) => set("bank_account", x)} />
        <FText label="IFSC Code" value={v.ifsc} onChange={(x) => set("ifsc", x)} placeholder="HDFC0001234" />
        <FText label="Bank Name" value={v.bank_name} onChange={(x) => set("bank_name", x)} />
      </Section>

      <Section title="Statutory Compliance">
        <Toggle label="PF applicable" checked={v.pf_applicable} onChange={(c) => set("pf_applicable", c)} />
        <Toggle label="ESI applicable" checked={v.esi_applicable} onChange={(c) => set("esi_applicable", c)} />
        <Toggle label="Professional Tax applicable" checked={v.pt_applicable} onChange={(c) => set("pt_applicable", c)} />
      </Section>

      <div className="card-elev p-5">
        <h3 className="font-semibold text-secondary-foreground mb-1">Skills</h3>
        <p className="text-xs text-muted-foreground mb-3">Comma-separated list of skills (e.g. React, Node, SQL).</p>
        <Textarea rows={3} value={v.skills ?? ""} onChange={(e) => set("skills", e.target.value)} />
      </div>

      <RepeaterSection
        title="Previous Experience"
        subtitle="Up to 3 most recent employers."
        items={v.previous_experience}
        max={3}
        empty={{ company: "", designation: "", from: "", to: "", description: "" }}
        onChange={(items) => set("previous_experience", truncate3(items))}
        render={(item, upd) => (
          <>
            <FText label="Company" value={item.company} onChange={(x) => upd({ ...item, company: x })} />
            <FText label="Designation" value={item.designation} onChange={(x) => upd({ ...item, designation: x })} />
            <FText label="From" type="month" value={item.from} onChange={(x) => upd({ ...item, from: x })} />
            <FText label="To" type="month" value={item.to} onChange={(x) => upd({ ...item, to: x })} />
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Description</Label>
              <Textarea rows={2} value={item.description} onChange={(e) => upd({ ...item, description: e.target.value })} />
            </div>
          </>
        )}
      />

      <RepeaterSection
        title="Academic Qualifications"
        subtitle="Degrees / education history."
        items={v.academic_qualifications}
        empty={{ name: "", institution: "", year: "" }}
        onChange={(items) => set("academic_qualifications", items)}
        render={(item, upd) => (
          <>
            <FText label="Qualification" value={item.name} onChange={(x) => upd({ ...item, name: x })} placeholder="B.Tech, MBA…" />
            <FText label="Institution / Board" value={item.institution} onChange={(x) => upd({ ...item, institution: x })} />
            <FText label="Year" value={item.year} onChange={(x) => upd({ ...item, year: x })} />
          </>
        )}
      />

      <RepeaterSection
        title="Professional Qualifications"
        subtitle="Certifications, licenses, courses."
        items={v.professional_qualifications}
        empty={{ name: "", institution: "", year: "" }}
        onChange={(items) => set("professional_qualifications", items)}
        render={(item, upd) => (
          <>
            <FText label="Certification" value={item.name} onChange={(x) => upd({ ...item, name: x })} placeholder="PMP, AWS SAA…" />
            <FText label="Issuing Body" value={item.institution} onChange={(x) => upd({ ...item, institution: x })} />
            <FText label="Year" value={item.year} onChange={(x) => upd({ ...item, year: x })} />
          </>
        )}
      />
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
function FText({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <div><Label>{label}</Label><Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} /></div>;
}
function FSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9 w-full px-3 rounded-md border bg-background text-sm">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

function RepeaterSection<T>({
  title, subtitle, items, empty, onChange, render, max,
}: {
  title: string; subtitle?: string; items: T[]; empty: T; max?: number;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  const add = () => { if (max && items.length >= max) return; onChange([...items, { ...empty }]); };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: T) => onChange(items.map((x, i) => i === idx ? next : x));

  return (
    <div className="card-elev p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-secondary-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!!max && items.length >= max}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No entries yet.</p>}
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="border rounded-md p-4 relative bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {render(item, (next) => update(idx, next))}
            </div>
            <Button type="button" size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => remove(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
