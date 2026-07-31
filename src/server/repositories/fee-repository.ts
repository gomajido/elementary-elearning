import { eq, desc, isNull, and, inArray } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import {
  feeStructures,
  invoices,
  invoiceLineItems,
  payments,
  students,
  invoiceReminders,
  type ReminderChannel,
  type ReminderStatus,
} from "@/lib/db/schema";

export const FeeStructureRepository = {
  async list() {
    const db = getDb();
    return db.select().from(feeStructures).where(isNull(feeStructures.deletedAt)).orderBy(feeStructures.name);
  },

  async create(input: {
    name: string;
    academicYearId: string;
    amountCents: number;
    frequency: "termly" | "annual" | "one_time" | "monthly";
    gradeLevel?: number;
  }) {
    const db = getDb();
    const [row] = await db.insert(feeStructures).values(input).returning();
    return row;
  },

  async update(
    id: string,
    input: Partial<{
      name: string;
      academicYearId: string;
      amountCents: number;
      frequency: "termly" | "annual" | "one_time" | "monthly";
      gradeLevel: number | null;
    }>,
    tx: Queryable = getDb(),
  ) {
    const [row] = await tx
      .update(feeStructures)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(feeStructures.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(feeStructures).set({ deletedAt: new Date() }).where(eq(feeStructures.id, id));
  },
};

export type NewInvoiceLineItem = { feeStructureId?: string; description: string; amountCents: number };

export const InvoiceRepository = {
  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), isNull(invoices.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(invoices).set({ deletedAt: new Date() }).where(eq(invoices.id, id));
  },

  async listLineItems(invoiceId: string) {
    const db = getDb();
    return db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  },

  /** Invoice + its line items, in one atomic transaction. */
  async createWithLineItems(input: {
    studentId: string;
    academicYearId: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    lineItems: NewInvoiceLineItem[];
  }) {
    const db = getDb();
    const invoiceId = crypto.randomUUID();
    const totalAmountCents = input.lineItems.reduce((sum, li) => sum + li.amountCents, 0);

    await db.transaction(async (tx) => {
      await tx.insert(invoices).values({
        id: invoiceId,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        invoiceNumber: input.invoiceNumber,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        totalAmountCents,
      });
      await tx.insert(invoiceLineItems).values(
        input.lineItems.map((li) => ({
          invoiceId,
          feeStructureId: li.feeStructureId,
          description: li.description,
          amountCents: li.amountCents,
        }))
      );
    });

    return InvoiceRepository.findById(invoiceId);
  },

  /** All invoices with every payment row (multiple rows per invoice) — aggregate balance in the service layer. */
  async listWithPaymentsByStudent(studentId: string) {
    const db = getDb();
    return db
      .select({ invoice: invoices, payment: payments })
      .from(invoices)
      .leftJoin(payments, and(eq(payments.invoiceId, invoices.id), isNull(payments.deletedAt)))
      .where(and(eq(invoices.studentId, studentId), isNull(invoices.deletedAt)))
      .orderBy(desc(invoices.issueDate));
  },

  /** School-wide, for the outstanding-balance report — one query, aggregate in JS. */
  async listAllWithPaymentsAndStudent() {
    const db = getDb();
    return db
      .select({ invoice: invoices, payment: payments, student: students })
      .from(invoices)
      .leftJoin(payments, and(eq(payments.invoiceId, invoices.id), isNull(payments.deletedAt)))
      .innerJoin(students, eq(students.id, invoices.studentId))
      .where(isNull(invoices.deletedAt))
      .orderBy(desc(invoices.issueDate));
  },
};

export const PaymentRepository = {
  async create(input: {
    invoiceId: string;
    studentId: string;
    amountCents: number;
    method: "bank_transfer" | "cash" | "cheque" | "other";
    referenceNumber?: string;
    paidAt: string;
    recordedByUserId: string;
    receiptNumber: string;
    notes?: string;
    isVerified?: boolean;
    proofStorageKey?: string;
  }) {
    const db = getDb();
    const [row] = await db.insert(payments).values(input).returning();
    return row;
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByReceiptNumber(receiptNumber: string) {
    const db = getDb();
    const [row] = await db.select().from(payments).where(eq(payments.receiptNumber, receiptNumber)).limit(1);
    return row ?? null;
  },

  async update(
    id: string,
    input: Partial<{
      amountCents: number;
      method: "bank_transfer" | "cash" | "cheque" | "other";
      referenceNumber: string;
      paidAt: string;
      notes: string;
      isVerified: boolean;
    }>,
    tx: Queryable = getDb(),
  ) {
    const [row] = await tx.update(payments).set(input).where(eq(payments.id, id)).returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(payments).set({ deletedAt: new Date() }).where(eq(payments.id, id));
  },
};

export const InvoiceReminderRepository = {
  async create(input: { invoiceId: string; guardianId: string; channel: ReminderChannel; status: ReminderStatus; errorMessage?: string }) {
    const db = getDb();
    const [row] = await db.insert(invoiceReminders).values(input).returning();
    return row;
  },

  /** Most recent reminder per invoice, aggregated in JS — small table, no need for a window-function query. */
  async listLatestByInvoiceIds(invoiceIds: string[]) {
    if (invoiceIds.length === 0) return new Map<string, typeof invoiceReminders.$inferSelect>();
    const db = getDb();
    const rows = await db
      .select()
      .from(invoiceReminders)
      .where(inArray(invoiceReminders.invoiceId, invoiceIds))
      .orderBy(desc(invoiceReminders.createdAt));

    const latestByInvoiceId = new Map<string, typeof invoiceReminders.$inferSelect>();
    for (const row of rows) {
      if (!latestByInvoiceId.has(row.invoiceId)) latestByInvoiceId.set(row.invoiceId, row);
    }
    return latestByInvoiceId;
  },
};
