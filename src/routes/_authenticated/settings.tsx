import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ORG_KEY = "payrollpro.org";

interface Org { name: string; pan: string; tan: string; pf_code: string; esi_code: string; address: string }
const EMPTY: Org = { name: "", pan: "", tan: "", pf_code: "", esi_code: "", address: "" };

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [org, setOrg] = useState<Org>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [counts, setCounts] = useState({ emp: 0, runs: 0, leaves: 0 });

  useEffect(() => {
    try { const raw = localStorage.getItem(ORG_KEY); if (raw) setOrg({ ...EMPTY, ...JSON.parse(raw) }); } catch {}
    (async () => {
      const [{ count: e }, { count: r }, { count: l }] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("payroll_runs").select("id", { count: "exact", head: true }),
        supabase.from("leave_requests").select("id", { count: "exact", head: true }),
      ]);
      setCounts({ emp: e ?? 0, runs: r ?? 0, leaves: l ?? 0 });
    })();
  }, []);

  const saveOrg = () => {
    setSaving(true);
    try { localStorage.setItem(ORG_KEY, JSON.stringify(org)); toast.success("Organization details saved"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwd.length < 6) return toast.error("Password must be at least 6 characters");
    setPwdBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPwdBusy(false);
    if (error) return toast.error(error.message);
    setPwd("");
    toast.success("Password updated");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your organization, account, and preferences" />

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Defaults</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4">
          <div className="card-elev p-6 max-w-2xl">
            <h3 className="font-semibold text-secondary-foreground mb-4">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company Name"><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} placeholder="Acme Pvt Ltd" /></Field>
              <Field label="PAN"><Input value={org.pan} onChange={(e) => setOrg({ ...org, pan: e.target.value.toUpperCase() })} placeholder="AAAAA0000A" /></Field>
              <Field label="TAN"><Input value={org.tan} onChange={(e) => setOrg({ ...org, tan: e.target.value.toUpperCase() })} placeholder="AAAA00000A" /></Field>
              <Field label="PF Establishment Code"><Input value={org.pf_code} onChange={(e) => setOrg({ ...org, pf_code: e.target.value })} /></Field>
              <Field label="ESI Code"><Input value={org.esi_code} onChange={(e) => setOrg({ ...org, esi_code: e.target.value })} /></Field>
              <Field label="Registered Address" className="md:col-span-2"><Input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} /></Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={saveOrg} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <div className="card-elev p-6 max-w-xl space-y-5">
            <div>
              <h3 className="font-semibold text-secondary-foreground mb-1">Signed in as</h3>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
            <div className="border-t pt-5">
              <h3 className="font-semibold text-secondary-foreground mb-3">Change Password</h3>
              <div className="flex items-end gap-2">
                <Field label="New Password" className="flex-1"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Min 6 characters" /></Field>
                <Button onClick={changePassword} disabled={pwdBusy || !pwd}>{pwdBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update</Button>
              </div>
            </div>
            <div className="border-t pt-5">
              <Button variant="outline" onClick={() => signOut()}>Sign out of this device</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <div className="card-elev p-6 max-w-2xl">
            <h3 className="font-semibold text-secondary-foreground mb-4">Statutory Defaults</h3>
            <div className="space-y-3 text-sm">
              <Info label="PF Rate" value="12% on Basic (capped at ₹15,000)" />
              <Info label="ESI Rate" value="0.75% employee · 3.25% employer (applicable if gross ≤ ₹21,000)" />
              <Info label="Professional Tax" value="₹200/month if gross > ₹15,000 (Karnataka slab)" />
              <Info label="Default Working Days" value="30" />
              <Info label="Salary Split" value="Basic 50% · HRA 40% of Basic · Special Allowance balance" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">These values are used by the payroll engine. Per-employee overrides are available on the employee profile.</p>
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="card-elev p-6 max-w-2xl">
            <h3 className="font-semibold text-secondary-foreground mb-4">System</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Info label="Employees" value={String(counts.emp)} />
              <Info label="Payroll Runs" value={String(counts.runs)} />
              <Info label="Leave Requests" value={String(counts.leaves)} />
            </div>
            <div className="mt-5 text-xs text-muted-foreground border-t pt-4">
              PayrollPro v1.0 · Built for small Indian businesses · Compliant with PF, ESI, PT, and TDS.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><label className="text-xs text-muted-foreground">{label}</label>{children}</div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b last:border-0 pb-2"><span className="text-muted-foreground">{label}</span><span className="text-secondary-foreground font-medium text-right">{value}</span></div>;
}

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });