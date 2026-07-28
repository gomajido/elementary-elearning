"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { FeeService, FeeError } from "@/server/services/fee-service";
import { FEE_FREQUENCIES, PAYMENT_METHODS } from "@/lib/db/schema";

export type ActionState = { error?: string };

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await FeeService.createFeeStructure(parsed.data);
  revalidatePath("/admin/fees/structures");
  return {};
}

const invoiceSchema = z.object({
  target: z.enum(["student", "class"]),
  studentId: z.string().optional(),
  classId: z.string().optional(),
  academicYearId: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  feeStructureIds: z.array(z.string()).min(1, "Select at least one fee"),
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const structures = await FeeService.listFeeStructures();
  const lineItems = data.feeStructureIds
    .map((id) => structures.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ feeStructureId: s.id, description: s.name, amountCents: s.amountCents }));

  try {
    if (data.target === "student") {
      if (!data.studentId) return { error: "Select a student" };
      await FeeService.generateInvoiceForStudent({
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        lineItems,
      });
    } else {
      if (!data.classId) return { error: "Select a class" };
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await FeeService.recordPayment({ ...parsed.data, recordedByUserId: user.id });
  } catch (err) {
    if (err instanceof FeeError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/admin/fees/invoices/${parsed.data.invoiceId}`);
  return {};
}
