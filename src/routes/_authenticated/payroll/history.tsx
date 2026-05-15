import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable, Th, Td, EmptyState, TableSkeleton, StatusBadge } from "@/components/app/Table";
import { formatINR, formatDate, monthName } from "@/lib/format";
import { Plus, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payroll/history")({ component: PayrollHistory });

function PayrollHistory() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("payroll_runs").select("*").order("year", { ascending: false }).order("month", { ascending: false })
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Payroll History" subtitle="All payroll runs"
        actions={<Button asChild><Link to="/payroll/run"><Plus className="h-4 w-4 mr-1" /> Run Payroll</Link></Button>} />
      <div className="card-elev">
        {loading ? <div className="p-4"><TableSkeleton /></div>
          : rows.length === 0 ? <EmptyState title="No payroll runs yet" description="Start your first payroll run to see history here."
              action={<Button asChild><Link to="/payroll/run">Run Payroll</Link></Button>} />
          : (
            <DataTable>
              <thead className="bg-muted/40"><tr><Th>Period</Th><Th>Status</Th><Th>Finalized On</Th><Th className="text-right">Gross</Th><Th className="text-right">Net</Th><Th> </Th></tr></thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-medium">{monthName(r.month)} {r.year}</Td>
                    <Td><StatusBadge status={r.status === "Finalized" ? "active" : "pending"}>{r.status}</StatusBadge></Td>
                    <Td>{formatDate(r.finalized_at)}</Td>
                    <Td className="text-right">{formatINR(r.total_gross)}</Td>
                    <Td className="text-right font-semibold">{formatINR(r.total_net)}</Td>
                    <Td><Button asChild size="sm" variant="ghost"><Link to="/payroll/$id" params={{ id: r.id }}><Eye className="h-4 w-4 mr-1" /> View</Link></Button></Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
      </div>
    </div>
  );
}