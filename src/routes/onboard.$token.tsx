import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { validateOnboardingToken, submitOnboarding, uploadOnboardingDoc } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboard/$token")({ component: OnboardPage });

const STEPS = ["Personal", "Address", "Bank", "Statutory", "Documents", "Review"];

function OnboardPage() {
  const { token } = Route.useParams();
  const validate = useServerFn(validateOnboardingToken);
  const submit = useServerFn(submitOnboarding);
  const upload = useServerFn(uploadOnboardingDoc);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emp, setEmp] = useState<any>(null);
  const [form, setForm] = useState<any>({ documents: [] });

  useEffect(() => {
    validate({ data: { token } })
      .then((r) => { setEmp(r.employee); setForm((f: any) => ({ ...f, full_name: r.employee?.full_name ?? "", personal_email: r.employee?.personal_email ?? "" })); })
      .catch((e) => setError(e.message ?? "Invalid link"))
      .finally(() => setLoading(false));
  }, [token]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const onUploadFile = async (label: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    setBusy(true);
    try {
      const res = await upload({ data: { token, label, filename: file.name, contentBase64: b64, contentType: file.type || "application/octet-stream" } });
      setForm((f: any) => ({ ...f, documents: [...(f.documents ?? []), res] }));
      toast.success(`${label} uploaded`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const onSubmit = async () => {
    setBusy(true);
    try {
      await submit({ data: { token, ...form, dob: form.dob || null } });
      setDone(true);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (loading) return <FullScreenCenter><Loader2 className="h-8 w-8 animate-spin text-primary" /></FullScreenCenter>;
  if (error) return <FullScreenCenter><div className="text-center"><div className="text-2xl mb-2">🔒</div><h1 className="font-semibold text-lg">Link unavailable</h1><p className="text-sm text-muted-foreground mt-1">{error}</p></div></FullScreenCenter>;
  if (done) return (
    <FullScreenCenter>
      <div className="text-center max-w-md">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
        <h1 className="text-2xl font-semibold">All set, {form.full_name?.split(" ")[0] ?? "there"}!</h1>
        <p className="text-sm text-muted-foreground mt-2">Your onboarding details have been submitted to HR. You'll hear back shortly.</p>
      </div>
    </FullScreenCenter>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><Wallet className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="font-semibold">Welcome, {emp?.full_name}</div>
            <div className="text-xs text-sidebar-foreground/60">Complete your onboarding · {emp?.emp_id}</div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center gap-1.5 mb-5 text-xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1.5">
              <div className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            </div>
          ))}
        </div>
        <div className="text-sm font-medium text-secondary-foreground mb-3">Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>

        <div className="card-elev p-6 space-y-4">
          {step === 0 && (
            <Grid>
              <Field label="Full Name" required><Input value={form.full_name ?? ""} onChange={(e) => update("full_name", e.target.value)} /></Field>
              <Field label="Father's Name"><Input value={form.father_name ?? ""} onChange={(e) => update("father_name", e.target.value)} /></Field>
              <Field label="Date of Birth"><Input type="date" value={form.dob ?? ""} onChange={(e) => update("dob", e.target.value)} /></Field>
              <Field label="Gender"><select className="h-10 border rounded-md px-3 w-full text-sm" value={form.gender ?? ""} onChange={(e) => update("gender", e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
              <Field label="Personal Email"><Input type="email" value={form.personal_email ?? ""} onChange={(e) => update("personal_email", e.target.value)} /></Field>
              <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} /></Field>
            </Grid>
          )}
          {step === 1 && (
            <Grid>
              <Field label="Address" full><Textarea rows={3} value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} /></Field>
              <Field label="Emergency Contact Name"><Input value={form.emergency_contact_name ?? ""} onChange={(e) => update("emergency_contact_name", e.target.value)} /></Field>
              <Field label="Emergency Contact Phone"><Input value={form.emergency_contact ?? ""} onChange={(e) => update("emergency_contact", e.target.value)} /></Field>
            </Grid>
          )}
          {step === 2 && (
            <Grid>
              <Field label="Account Holder Name"><Input value={form.account_holder_name ?? ""} onChange={(e) => update("account_holder_name", e.target.value)} /></Field>
              <Field label="Bank Name"><Input value={form.bank_name ?? ""} onChange={(e) => update("bank_name", e.target.value)} /></Field>
              <Field label="Account Number"><Input value={form.bank_account ?? ""} onChange={(e) => update("bank_account", e.target.value)} /></Field>
              <Field label="IFSC"><Input value={form.ifsc ?? ""} onChange={(e) => update("ifsc", e.target.value)} /></Field>
            </Grid>
          )}
          {step === 3 && (
            <Grid>
              <Field label="PAN"><Input maxLength={10} value={form.pan ?? ""} onChange={(e) => update("pan", e.target.value.toUpperCase())} /></Field>
              <Field label="Aadhaar (12 digits)"><Input maxLength={12} value={form.aadhaar ?? ""} onChange={(e) => update("aadhaar", e.target.value.replace(/\D/g, ""))} /></Field>
            </Grid>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Upload scans (PDF/JPG/PNG, max 5 MB each).</p>
              {["PAN Card", "Aadhaar Card", "Bank Proof", "Offer Letter"].map((label) => (
                <DocRow key={label} label={label} existing={form.documents?.find((d: any) => d.label === label)} onSelect={(f) => onUploadFile(label, f)} busy={busy} />
              ))}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3 text-sm">
              <ReviewRow k="Name" v={form.full_name} />
              <ReviewRow k="DOB" v={form.dob} />
              <ReviewRow k="Email" v={form.personal_email} />
              <ReviewRow k="Phone" v={form.phone} />
              <ReviewRow k="Address" v={form.address} />
              <ReviewRow k="Bank A/C" v={form.bank_account} />
              <ReviewRow k="IFSC" v={form.ifsc} />
              <ReviewRow k="PAN" v={form.pan} />
              <ReviewRow k="Aadhaar" v={form.aadhaar} />
              <ReviewRow k="Documents" v={`${form.documents?.length ?? 0} uploaded`} />
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < STEPS.length - 1
              ? <Button onClick={() => setStep((s) => s + 1)} disabled={busy || (step === 0 && !form.full_name)}>Continue</Button>
              : <Button onClick={onSubmit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FullScreenCenter({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6">{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, children, required, full }: { label: string; children: React.ReactNode; required?: boolean; full?: boolean }) {
  return <div className={full ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}><Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>{children}</div>;
}
function ReviewRow({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between py-1.5 border-b last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "—"}</span></div>;
}
function DocRow({ label, existing, onSelect, busy }: { label: string; existing?: any; onSelect: (f: File) => void; busy: boolean }) {
  return (
    <div className="flex items-center justify-between border rounded-md px-3 py-2.5">
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        {existing && <div className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</div>}
      </div>
      <label className="cursor-pointer">
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); e.currentTarget.value = ""; }} />
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-md hover:bg-accent"><Upload className="h-3.5 w-3.5" /> {existing ? "Replace" : "Upload"}</span>
      </label>
    </div>
  );
}