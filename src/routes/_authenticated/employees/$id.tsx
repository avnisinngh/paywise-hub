import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Mail, Phone, Building2, Briefcase, Calendar, Link2, Copy, Download, FileText } from "lucide-react";
import { formatDate, formatINR } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createOnboardingToken } from "@/lib/onboarding.functions";
import { generatePayslipPDF } from "@/lib/payslip-pdf";
import { monthName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/employees/$id")({ component: EmployeeDetail });

function EmployeeDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<any>(null);
  const [salary, setSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [onbLink, setOnbLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const createToken = useServerFn(createOnboardingToken);

  useEffect(() => {
    (async () => {
      const [{ data: e }, { data: s }, { data: p }] = await Promise.all([
        supabase.from("employees").select("*").eq("id", id).maybeSingle(),
        supabase.from("employee_salary").select("*, salary_structures(name)").eq("employee_id", id).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("payslips").select("*, payroll_runs(month, year, finalized_at)").eq("employee_id", id),
      ]);
      setEmp(e); setSalary(s); setPayslips(p ?? []); setLoading(false);
    })();
  }, [id]);

  const generateLink = async () => {
    setBusy(true);
    try {
      const { token } = await createToken({ data: { employee_id: id } });
      const url = `${window.location.origin}/onboard/${token}`;
      setOnbLink(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Onboarding link generated and copied");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const downloadPayslip = (slip: any) => {
    generatePayslipPDF({
      ...slip.payslip_data,
      employee: { ...slip.payslip_data.employee, pan: emp.pan, bank_account: emp.bank_account, ifsc: emp.ifsc },
    });
  };

  const toggleStatus = async () => {
    const next = emp.status === "Active" ? "Inactive" : "Active";
    const { error } = await supabase.from("employees").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    setEmp({ ...emp, status: next });
    toast.success(`Marked ${next}`);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!emp) return <div className="text-center py-20 text-muted-foreground">Employee not found</div>;

  const monthlyCTC = (salary?.ctc ?? 0) / 12;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/employees" })} className="mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Employees</Button>

      <div className="card-elev p-6 mb-5">
        <div className="flex flex-wrap items-start gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
              {emp.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-foreground">{emp.full_name}</h2>
              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="font-mono">{emp.emp_id}</span>
                {emp.designation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{emp.designation}</span>}
                {emp.department && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{emp.department}</span>}
              </div>
              <div className="mt-2"><StatusBadge status={emp.status === "Active" ? "active" : "inactive"}>{emp.status}</StatusBadge></div>
            </div>
          </div>
          <div className="flex gap-2">
            {!emp.onboarded_at && (
              <Button variant="outline" onClick={generateLink} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
                Send Onboarding Link
              </Button>
            )}
            <Button variant="outline" onClick={toggleStatus}>Mark {emp.status === "Active" ? "Inactive" : "Active"}</Button>
          </div>
        </div>
      </div>

      {onbLink && (
        <div className="card-elev p-4 mb-5 bg-primary/5 border-primary/20">
          <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Onboarding link (share with employee)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border rounded px-2 py-1.5 truncate">{onbLink}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(onbLink); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Personal">
              <Row label="Date of Birth" value={formatDate(emp.dob)} />
              <Row label="Gender" value={emp.gender ?? "—"} />
              <Row label="Father's Name" value={emp.father_name ?? "—"} />
              <Row label="PAN" value={emp.pan ?? "—"} />
              <Row label="Aadhaar" value={emp.aadhaar ?? "—"} />
              <Row label="Email" value={emp.personal_email ?? "—"} icon={<Mail className="h-3 w-3" />} />
              <Row label="Phone" value={emp.phone ?? "—"} icon={<Phone className="h-3 w-3" />} />
              <Row label="Emergency Contact" value={emp.emergency_contact_name || emp.emergency_contact ? `${emp.emergency_contact_name ?? ""}${emp.emergency_contact_name && emp.emergency_contact ? " · " : ""}${emp.emergency_contact ?? ""}` : "—"} />
            </Panel>
            <Panel title="Employment">
              <Row label="Date of Joining" value={formatDate(emp.date_of_joining)} icon={<Calendar className="h-3 w-3" />} />
              <Row label="Employment Type" value={emp.employment_type} />
              <Row label="Work Location" value={emp.work_location ?? "—"} />
              <Row label="PF Applicable" value={emp.pf_applicable ? "Yes" : "No"} />
              <Row label="ESI Applicable" value={emp.esi_applicable ? "Yes" : "No"} />
              <Row label="PT Applicable" value={emp.pt_applicable ? "Yes" : "No"} />
            </Panel>
            <Panel title="Bank">
              <Row label="Account Holder" value={emp.account_holder_name ?? "—"} />
              <Row label="Account Number" value={emp.bank_account ? "••••" + String(emp.bank_account).slice(-4) : "—"} />
              <Row label="IFSC" value={emp.ifsc ?? "—"} />
              <Row label="Bank" value={emp.bank_name ?? "—"} />
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <div className="card-elev p-6">
            {salary ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Stat label="CTC (Annual)" value={formatINR(salary.ctc)} />
                  <Stat label="Gross Monthly" value={formatINR(monthlyCTC)} />
                  <Stat label="Structure" value={salary.salary_structures?.name ?? "—"} />
                </div>
                <p className="text-xs text-muted-foreground">Effective from {formatDate(salary.effective_from)}. Detailed monthly breakdown is generated during payroll runs.</p>
              </>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">No salary structure assigned yet.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="card-elev p-5">
            {!emp.documents || emp.documents.length === 0
              ? <div className="py-10 text-center text-muted-foreground text-sm">No documents uploaded yet. {emp.onboarded_at ? "" : "Send the onboarding link to collect them."}</div>
              : <div className="space-y-2">{emp.documents.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border rounded-md px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{d.label}</span></div>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      const { data } = await supabase.storage.from("employee-docs").createSignedUrl(d.path, 60);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }}><Download className="h-4 w-4" /></Button>
                  </div>
                ))}</div>}
          </div>
        </TabsContent>
        <TabsContent value="payslips" className="mt-4">
          <div className="card-elev p-5">
            {payslips.length === 0
              ? <div className="py-10 text-center text-muted-foreground text-sm">No payslips yet. They appear here after payroll is finalized.</div>
              : <div className="space-y-2">
                  {payslips.sort((a, b) => (b.payroll_runs?.year - a.payroll_runs?.year) || (b.payroll_runs?.month - a.payroll_runs?.month)).map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded-md px-3 py-2.5">
                      <div className="text-sm"><div className="font-medium">{monthName(s.payroll_runs?.month)} {s.payroll_runs?.year}</div>
                        <div className="text-xs text-muted-foreground">Net Pay: {formatINR(s.payslip_data?.netPay ?? 0)}</div></div>
                      <Button size="sm" variant="ghost" onClick={() => downloadPayslip(s)}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                    </div>
                  ))}
                </div>}
          </div>
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <div className="card-elev p-10 text-center text-muted-foreground text-sm">Leave history coming in next phase.</div>
        </TabsContent>
        <TabsContent value="tax" className="mt-4">
          <div className="card-elev p-10 text-center text-muted-foreground text-sm">Tax declarations coming in next phase.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elev p-5">
      <h4 className="font-semibold text-secondary-foreground mb-3">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
function Row({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-secondary-foreground flex items-center gap-1.5">{icon}{value}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-secondary-foreground mt-1">{value}</div>
    </div>
  );
}