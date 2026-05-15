import { monthName } from "./format";

export interface Component { id: string; name: string; type: string; calc_type: string; default_value: number; taxable: boolean }

export interface CalcInput {
  ctc: number;
  workingDays: number;
  lopDays: number;
  pf_applicable: boolean;
  esi_applicable: boolean;
  pt_applicable: boolean;
}

export interface CalcOutput {
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  pf_employee: number; pf_employer: number;
  esi_employee: number; esi_employer: number;
  pt: number; tds: number;
  components_snapshot: Record<string, number>;
}

// Standard Indian payroll calc:
// Basic = 50% of monthly gross. HRA = 40% of basic. Special = remainder.
// PF = 12% of basic capped at ₹15,000/mo each side.
// ESI = 0.75% emp / 3.25% empr if gross ≤ ₹21,000.
// PT (Karnataka slab default): ₹0 ≤15k, ₹200 >15k.
// LOP proration on gross.
export function calcPayroll(i: CalcInput): CalcOutput {
  const monthlyCTC = i.ctc / 12;
  const lopFactor = i.workingDays > 0 ? Math.max(0, (i.workingDays - i.lopDays)) / i.workingDays : 1;

  const basic = round(monthlyCTC * 0.5 * lopFactor);
  const hra = round(basic * 0.4);
  const special = round(monthlyCTC * lopFactor - basic - hra);

  const earnings = [
    { name: "Basic", amount: basic },
    { name: "HRA", amount: hra },
    { name: "Special Allowance", amount: Math.max(0, special) },
  ];
  const grossPay = earnings.reduce((s, e) => s + e.amount, 0);

  const pfBase = Math.min(basic, 15000);
  const pf_employee = i.pf_applicable ? round(pfBase * 0.12) : 0;
  const pf_employer = i.pf_applicable ? round(pfBase * 0.12) : 0;

  const esi_employee = i.esi_applicable && grossPay <= 21000 ? round(grossPay * 0.0075) : 0;
  const esi_employer = i.esi_applicable && grossPay <= 21000 ? round(grossPay * 0.0325) : 0;

  const pt = i.pt_applicable ? (grossPay > 15000 ? 200 : 0) : 0;
  const tds = 0; // wired in Phase 4

  const deductions = [
    { name: "PF (Employee)", amount: pf_employee },
    { name: "ESI (Employee)", amount: esi_employee },
    { name: "Professional Tax", amount: pt },
    { name: "TDS", amount: tds },
  ].filter((d) => d.amount > 0);

  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const netPay = grossPay - totalDeductions;

  return {
    earnings, deductions, grossPay, totalDeductions, netPay,
    pf_employee, pf_employer, esi_employee, esi_employer, pt, tds,
    components_snapshot: { basic, hra, special: Math.max(0, special) },
  };
}

function round(n: number) { return Math.round(n); }

export function periodLabel(month: number, year: number) { return `${monthName(month)} ${year}`; }