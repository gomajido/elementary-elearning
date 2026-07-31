import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";
import { students, guardians } from "./people";
import { academicYears } from "./academics";
import { users } from "./users";

export const FEE_FREQUENCIES = ["termly", "annual", "one_time", "monthly"] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

// Fee catalog — what can be charged. amountCents to avoid float rounding.
export const feeStructures = pgTable("fee_structures", {
  id: id(),
  name: text("name").notNull(), // e.g. "Tuition Term 1"
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  gradeLevel: integer("grade_level"), // nullable — some fees apply to one grade only
  amountCents: integer("amount_cents").notNull(),
  frequency: text("frequency").notNull().$type<FeeFrequency>(),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const INVOICE_STATUSES = ["unpaid", "partial", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// Charges issued to a student for a period. `status`/balance are always
// derived from summing `payments` — never a mutable stored field, to avoid
// drift (see RFC 0001 "Payments").
export const invoices = pgTable("invoices", {
  id: id(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g. INV-2026-0001
  issueDate: text("issue_date").notNull(), // YYYY-MM-DD
  dueDate: text("due_date").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id),
  feeStructureId: text("fee_structure_id").references(() => feeStructures.id), // nullable for ad-hoc charges
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

export const PAYMENT_METHODS = ["bank_transfer", "cash", "cheque", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Append-only ledger — the source of truth for invoice balance/status.
export const payments = pgTable("payments", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id), // denormalized for ledger queries without a join
  amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull().$type<PaymentMethod>(),
  referenceNumber: text("reference_number"), // bank transfer ref, nullable
  paidAt: text("paid_at").notNull(), // YYYY-MM-DD
  recordedByUserId: text("recorded_by_user_id")
    .notNull()
    .references(() => users.id), // the admin who entered it
  receiptNumber: text("receipt_number").notNull().unique(),
  notes: text("notes"),
  // Admin-entered payments are presumed confirmed at entry (default true).
  // Parent-submitted claims (see FeeService.submitPaymentClaim) always start
  // false — admin must check the actual bank statement/proof and flip this
  // before it counts toward the invoice balance (see summarizeInvoice).
  isVerified: boolean("is_verified").notNull().default(true),
  // Set only for parent-submitted claims — photo/PDF of the transfer receipt.
  proofStorageKey: text("proof_storage_key"),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
  ...softDelete,
});

export const REMINDER_CHANNELS = ["whatsapp", "email"] as const;
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

export const REMINDER_STATUSES = ["sent", "failed"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

// Audit log of payment-reminder sends — lets the admin UI show "last
// reminded" per invoice and avoid blind re-sends. Append-only, no update.
export const invoiceReminders = pgTable("invoice_reminders", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id),
  guardianId: text("guardian_id")
    .notNull()
    .references(() => guardians.id),
  channel: text("channel").notNull().$type<ReminderChannel>(),
  status: text("status").notNull().$type<ReminderStatus>(),
  errorMessage: text("error_message"),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});
