import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Layers, CalendarDays, FileText, Receipt,
  BarChart3, Settings, LogOut, Wallet, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface NavChild { label: string; to: string }
interface NavItem { label: string; to?: string; icon: React.ComponentType<{ className?: string }>; children?: NavChild[] }

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", icon: Users, children: [
    { label: "All Employees", to: "/employees" },
    { label: "Add Employee", to: "/employees/new" },
  ]},
  { label: "Salary", icon: Layers, children: [
    { label: "Components", to: "/salary/components" },
    { label: "Structures", to: "/salary/structures" },
  ]},
  { label: "Payroll", icon: Wallet, children: [
    { label: "Run Payroll", to: "/payroll/run" },
    { label: "Payroll History", to: "/payroll/history" },
  ]},
  { label: "Leave & Attendance", icon: CalendarDays, children: [
    { label: "Leave Types", to: "/leave/types" },
    { label: "Leave Requests", to: "/leave/requests" },
    { label: "Attendance", to: "/leave/attendance" },
    { label: "Leave Balances", to: "/leave/balances" },
  ]},
  { label: "Tax & Compliance", icon: Receipt, children: [
    { label: "PF", to: "/tax/pf" },
    { label: "ESI", to: "/tax/esi" },
    { label: "Professional Tax", to: "/tax/pt" },
    { label: "TDS & Declarations", to: "/tax/tds" },
    { label: "Compliance Calendar", to: "/tax/calendar" },
  ]},
  { label: "Reports", to: "/reports", icon: BarChart3 },
];

export function AppSidebar({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV.forEach((n) => { if (n.children?.some((c) => path.startsWith(c.to))) init[n.label] = true; });
    return init;
  });

  const isActive = (to: string) => path === to || (to !== "/dashboard" && path.startsWith(to));

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold leading-tight">PayrollPro</div>
          <div className="text-[11px] text-sidebar-foreground/60">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.children) {
            const isOpen = !!open[item.label];
            return (
              <div key={item.label}>
                <button
                  onClick={() => setOpen((o) => ({ ...o, [item.label]: !o[item.label] }))}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {isOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.to}
                        to={c.to}
                        onClick={onNav}
                        className={cn(
                          "block px-3 py-1.5 text-[13px] rounded-md transition-colors",
                          isActive(c.to)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to!}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.to!)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/90 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-sidebar-border space-y-0.5">
          <Link to="/settings" onClick={onNav} className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
            isActive("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/90 hover:bg-white/5",
          )}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {(user?.email ?? "A")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.email ?? "Admin"}</div>
            <div className="text-[10px] text-sidebar-foreground/60">Administrator</div>
          </div>
          <button onClick={() => signOut()} title="Logout" className="p-1.5 rounded hover:bg-white/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}