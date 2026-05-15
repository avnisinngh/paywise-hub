import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatINR, monthName } from "./format";

export interface PayslipData {
  employee: { full_name: string; emp_id: string; designation?: string; department?: string; pan?: string; bank_account?: string; ifsc?: string };
  period: { month: number; year: number };
  workingDays: number;
  lopDays: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  company?: { name: string };
}

export function generatePayslipPDF(d: PayslipData) {
  const doc = new jsPDF();
  const company = d.company?.name ?? "PayrollPro";

  doc.setFillColor(26, 43, 74);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.text(company, 14, 13);
  doc.setFontSize(9); doc.text(`Payslip · ${monthName(d.period.month)} ${d.period.year}`, 14, 21);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  let y = 38;
  const left = 14, right = 110;
  const row = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(110); doc.text(label, x, yy);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(20); doc.text(value, x, yy + 4.5);
  };
  row("Employee", d.employee.full_name, left, y);
  row("Employee ID", d.employee.emp_id, right, y);
  y += 12;
  row("Designation", d.employee.designation ?? "—", left, y);
  row("Department", d.employee.department ?? "—", right, y);
  y += 12;
  row("PAN", d.employee.pan ?? "—", left, y);
  row("Bank A/C", d.employee.bank_account ? `${d.employee.bank_account} / ${d.employee.ifsc ?? ""}` : "—", right, y);
  y += 12;
  row("Working Days", String(d.workingDays), left, y);
  row("Loss of Pay Days", String(d.lopDays), right, y);
  y += 14;

  const maxRows = Math.max(d.earnings.length, d.deductions.length);
  const body: any[] = [];
  for (let i = 0; i < maxRows; i++) {
    body.push([
      d.earnings[i]?.name ?? "", d.earnings[i] ? formatINR(d.earnings[i].amount) : "",
      d.deductions[i]?.name ?? "", d.deductions[i] ? formatINR(d.deductions[i].amount) : "",
    ]);
  }
  body.push([{ content: "Gross Earnings", styles: { fontStyle: "bold" } }, { content: formatINR(d.grossPay), styles: { fontStyle: "bold" } },
             { content: "Total Deductions", styles: { fontStyle: "bold" } }, { content: formatINR(d.totalDeductions), styles: { fontStyle: "bold" } }]);

  autoTable(doc, {
    startY: y,
    head: [["Earnings", "Amount", "Deductions", "Amount"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [0, 137, 123], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
  });

  const endY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, endY, 182, 14, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Net Pay", 18, endY + 9);
  doc.text(formatINR(d.netPay), 192, endY + 9, { align: "right" });

  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
  doc.text("This is a system-generated payslip and does not require a signature.", 105, 285, { align: "center" });

  doc.save(`payslip-${d.employee.emp_id}-${d.period.year}-${String(d.period.month).padStart(2, "0")}.pdf`);
}