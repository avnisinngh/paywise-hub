import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { session, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    if (mode === "signup") toast.success("Account created. Signing you in…");
    else toast.success("Welcome back");
  };

  return (
    <div className="min-h-screen brand-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md card-elev p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">PayrollPro</h1>
          <p className="text-sm text-muted-foreground mt-1">Payroll Manager for Indian Businesses</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "signin" ? "Sign In" : "Create Admin Account"}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>No account yet? <button className="text-primary font-medium" onClick={() => setMode("signup")}>Create one</button></>
          ) : (
            <>Already registered? <button className="text-primary font-medium" onClick={() => setMode("signin")}>Sign in</button></>
          )}
        </div>
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground text-center mt-3">First account is automatically granted admin access.</p>
        )}
      </div>
    </div>
  );
}