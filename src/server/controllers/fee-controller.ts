"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { FeeService, FeeError } from "@/server/services/fee-service";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { presignUpload } from "@/lib/storage/client";
import { FEE_FREQUENCIES, PAYMENT_METHODS } from "@/lib/db/schema";

export type ActionState = { error?: string; success?: boolean };

const feeStructureSchema = z.object({
  name: z.string().min(1),
  academicYearId: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  frequency: z.enum(FEE_FREQUENCIES),
  gradeLevel: z.coerce.number().int().min(0).max(12).optional(),
});

export async function createFeeStructureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = feeStructureSchema.safeParse({
    name: formData.get("name"),
    academicYearId: formData.get("academicYearId"),
    amountCents: Number(formData.get("amount")) * 100,
    frequency: formData.get("frequency"),
    gradeLevel: formData.get("gradeLevel") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  await FeeService.createFeeStructure(parsed.data);
  revalidatePath("/admin/fees/structures");
  return {};
}

const updateFeeStructureSchema = feeStructureSchema.extend({ feeStructureId: z.string().min(1) });

export async function updateFeeStructureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = updateFeeStructureSchema.safeParse({
    feeStructureId: formData.get("feeStructureId"),
    name: formData.get("name"),
    academicYearId: formData.get("academicYearId"),
    amountCents: Number(formData.get("amount")) * 100,
    frequency: formData.get("frequency"),
    gradeLevel: formData.get("gradeLevel") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { feeStructureId, ...input } = parsed.data;

  await FeeService.updateFeeStructure(feeStructureId, input);
  revalidatePath("/admin/fees/structures");
  return { success: true };
}

export async function deleteFeeStructureAction(feeStructureId: string) {
  await requireRole(["admin"]);
  await FeeService.deleteFeeStructure(feeStructureId);
  revalidatePath("/admin/fees/structures");
}

export async function deleteInvoiceAction(invoiceId: string) {
  await requireRole(["admin"]);
  await FeeService.deleteInvoice(invoiceId);
  revalidatePath("/admin/fees/invoices");
  revalidatePath("/admin/fees");
}

export async function deletePaymentAction(paymentId: string, invoiceId: string) {
  await requireRole(["admin"]);
  await FeeService.deletePayment(paymentId);
  revalidatePath(`/admin/fees/invoices/${invoiceId}`);
  revalidatePath("/admin/fees");
}

const invoiceSchema = z.object({
  target: z.enum(["student", "class"]),
  studentId: z.string().optional(),
  classId: z.string().optional(),
  academicYearId: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  feeStructureIds: z.array(z.string()).min(1, "Pilih minimal satu biaya"),
});

export async function generateInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = invoiceSchema.safeParse({
    target: formData.get("target"),
    studentId: formData.get("studentId") || undefined,
    classId: formData.get("classId") || undefined,
    academicYearId: formData.get("academicYearId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    feeStructureIds: formData.getAll("feeStructureIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const data = parsed.data;

  const structures = await FeeService.listFeeStructures();
  const lineItems = data.feeStructureIds
    .map((id) => structures.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ feeStructureId: s.id, description: s.name, amountCents: s.amountCents }));

  try {
    if (data.target === "student") {
      if (!data.studentId) return { error: "Pilih siswa" };
      await FeeService.generateInvoiceForStudent({
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        lineItems,
      });
    } else {
      if (!data.classId) return { error: "Pilih kelas" };
      await FeeService.generateInvoicesForClass({
        classId: data.classId,
        academicYearId: data.academicYearId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        lineItems,
      });
    }
  } catch (err) {
    if (err instanceof FeeError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/fees/invoices");
  return {};
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string().optional(),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
});

export async function recordPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["admin"]);
  const parsed = paymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountCents: Number(formData.get("amount")) * 100,
    method: formData.get("method"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const isVerified = formData.get("isVerified") === "on";

  try {
    await FeeService.recordPayment({ ...parsed.data, recordedByUserId: user.id, isVerified });
  } catch (err) {
    if (err instanceof FeeError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/admin/fees/invoices/${parsed.data.invoiceId}`);
  return {};
}

const updatePaymentSchema = z.object({
  paymentId: z.string().min(1),
  invoiceId: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string().optional(),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
});

export async function updatePaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = updatePaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    invoiceId: formData.get("invoiceId"),
    amountCents: Number(formData.get("amount")) * 100,
    method: formData.get("method"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const isVerified = formData.get("isVerified") === "on";
  const { paymentId, invoiceId, ...input } = parsed.data;

  await FeeService.updatePayment(paymentId, { ...input, isVerified });
  revalidatePath(`/admin/fees/invoices/${invoiceId}`);
  return { success: true };
}

const PROOF_MAX_CONTENT_TYPES = /^(image\/|application\/pdf$)/;

/** Parent uploading proof of a bank transfer — presigns the S3 PUT, same primitive photo-upload-field.tsx uses. */
export async function requestPaymentProofUploadAction(invoiceId: string, contentType: string) {
  const user = await requireRole(["parent"]);
  const invoice = await FeeService.findInvoiceById(invoiceId);
  if (!invoice) throw new Error("Tagihan tidak ditemukan");
  await GuardianService.assertGuardianOwnsStudent(user.id, invoice.studentId);
  if (!PROOF_MAX_CONTENT_TYPES.test(contentType)) throw new Error("File harus berupa gambar atau PDF");

  const key = `payments/proof/${crypto.randomUUID()}`;
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
}

export type SubmitProofState = { error?: string; success?: boolean };

const proofSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string().optional(),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
  proofStorageKey: z.string().min(1, "Unggah bukti transfer terlebih dahulu"),
});

export async function submitPaymentProofAction(
  _prev: SubmitProofState,
  formData: FormData
): Promise<SubmitProofState> {
  const user = await requireRole(["parent"]);
  const parsed = proofSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountCents: Number(formData.get("amount")) * 100,
    method: formData.get("method"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
    proofStorageKey: formData.get("proofStorageKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const invoice = await FeeService.findInvoiceById(parsed.data.invoiceId);
  if (!invoice) return { error: "Tagihan tidak ditemukan" };

  try {
    await GuardianService.assertGuardianOwnsStudent(user.id, invoice.studentId);
    await FeeService.submitPaymentClaim({ ...parsed.data, submittedByUserId: user.id });
  } catch (err) {
    if (err instanceof GuardianPortalError) return { error: err.message };
    if (err instanceof FeeError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/admin/fees/invoices/${parsed.data.invoiceId}`);
  revalidatePath(`/parent/children/${invoice.studentId}`);
  return { success: true };
}
