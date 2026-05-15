import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/app/Sidebar";
import { Loader2, Menu } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full"><AppSidebar onNav={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 bg-white border-b px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">PayrollPro</span>
        </div>
        <div className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}