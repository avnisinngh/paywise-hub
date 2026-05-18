import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TokenInput = z.object({ token: z.string().min(10).max(128) });

export const validateOnboardingToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("onboarding_tokens")
      .select("id, token, used, employee_id, employees(id, full_name, emp_id, personal_email)")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid or expired link");
    if (row.used) throw new Error("This onboarding link has already been used");
    return { ok: true, employee: row.employees };
  });

const SubmitInput = z.object({
  token: z.string().min(10).max(128),
  full_name: z.string().min(1).max(120),
  dob: z.string().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  father_name: z.string().max(120).nullable().optional(),
  pan: z.string().max(20).nullable().optional(),
  aadhaar: z.string().max(20).nullable().optional(),
  personal_email: z.string().email().max(160).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  emergency_contact_name: z.string().max(120).nullable().optional(),
  emergency_contact: z.string().max(120).nullable().optional(),
  bank_account: z.string().max(40).nullable().optional(),
  ifsc: z.string().max(20).nullable().optional(),
  bank_name: z.string().max(80).nullable().optional(),
  account_holder_name: z.string().max(120).nullable().optional(),
  documents: z.array(z.object({ label: z.string().max(60), path: z.string().max(300) })).max(10).default([]),
});

export const submitOnboarding = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { data: tk } = await supabaseAdmin
      .from("onboarding_tokens")
      .select("id, used, employee_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!tk) throw new Error("Invalid token");
    if (tk.used) throw new Error("Already submitted");
    if (!tk.employee_id) throw new Error("Token not linked to an employee");

    const { token, ...rest } = data;
    void token;
    const { error: upErr } = await supabaseAdmin
      .from("employees")
      .update({ ...rest, onboarded_at: new Date().toISOString() })
      .eq("id", tk.employee_id);
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin.from("onboarding_tokens").update({ used: true }).eq("id", tk.id);
    return { ok: true };
  });

export const uploadOnboardingDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    token: z.string().min(10).max(128),
    label: z.string().min(1).max(60),
    filename: z.string().min(1).max(120),
    contentBase64: z.string().min(1),
    contentType: z.string().max(120).default("application/octet-stream"),
  }).parse(d))
  .handler(async ({ data }) => {
    const { data: tk } = await supabaseAdmin
      .from("onboarding_tokens").select("id, used, employee_id").eq("token", data.token).maybeSingle();
    if (!tk || tk.used || !tk.employee_id) throw new Error("Invalid token");
    const buf = Buffer.from(data.contentBase64, "base64");
    if (buf.byteLength > 5 * 1024 * 1024) throw new Error("File too large (max 5 MB)");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${tk.employee_id}/${Date.now()}-${safe}`;
    const { error } = await supabaseAdmin.storage.from("employee-docs")
      .upload(path, buf, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path, label: data.label };
  });

export const createOnboardingToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ employee_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const { error } = await supabaseAdmin.from("onboarding_tokens").insert({
      employee_id: data.employee_id,
      token,
    });
    if (error) throw new Error(error.message);
    return { token };
  });