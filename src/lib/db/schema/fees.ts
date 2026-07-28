import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

import { id, schoolId, timestamps } from "./_shared";
import { students } from "./people";
import { academicYears } from "./academics";
import { users } from "./users";

export const FEE_FREQUENCIES = ["termly", "annual", "one_time", "monthly"] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

// Fee catalog — what can be charged. amountCents to avoid float rounding.
export const feeStructures = sqliteTable("fee_structures", {
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
});

export const INVOICE_STATUSES = ["unpaid", "partial", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// Charges issued to a student for a period. `status`/balance are always
// derived from summing `payments` — never a mutable stored field, to avoid
// drift (see RFC 0001 "Payments").
export const invoices = sqliteTable("invoices", {
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
});

export const invoiceLineItems = sqliteTable("invoice_line_items", {
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
export const payments = sqliteTable("payments", {
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
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});
