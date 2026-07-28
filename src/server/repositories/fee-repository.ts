import { eq, desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { feeStructures, invoices, invoiceLineItems, payments, students } from "@/lib/db/schema";
import type { BatchItem } from "drizzle-orm/batch";

export const FeeStructureRepository = {
  async list() {
    const db = getDb();
    return db.select().from(feeStructures).orderBy(feeStructures.name);
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
};

export type NewInvoiceLineItem = { feeStructureId?: string; description: string; amountCents: number };

export const InvoiceRepository = {
  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return row ?? null;
  },

  async listLineItems(invoiceId: string) {
    const db = getDb();
    return db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  },

  /** Invoice + its line items + all payments, in one atomic `db.batch()` write. */
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

    const statements: BatchItem<"sqlite">[] = [
      db
        .insert(invoices)
        .values({
          id: invoiceId,
          studentId: input.studentId,
          academicYearId: input.academicYearId,
          invoiceNumber: input.invoiceNumber,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          totalAmountCents,
        })
        .returning(),
      ...input.lineItems.map((li) =>
        db
          .insert(invoiceLineItems)
          .values({
            invoiceId,
            feeStructureId: li.feeStructureId,
            description: li.description,
            amountCents: li.amountCents,
          })
          .returning()
      ),
    ];

    await db.batch(statements as unknown as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    return InvoiceRepository.findById(invoiceId);
  },

  /** All invoices with every payment row (multiple rows per invoice) — aggregate balance in the service layer. */
  async listWithPaymentsByStudent(studentId: string) {
    const db = getDb();
    return db
      .select({ invoice: invoices, payment: payments })
      .from(invoices)
      .leftJoin(payments, eq(payments.invoiceId, invoices.id))
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoices.issueDate));
  },

  /** School-wide, for the outstanding-balance report — one query, aggregate in JS. */
  async listAllWithPaymentsAndStudent() {
    const db = getDb();
    return db
      .select({ invoice: invoices, payment: payments, student: students })
      .from(invoices)
      .leftJoin(payments, eq(payments.invoiceId, invoices.id))
      .innerJoin(students, eq(students.id, invoices.studentId))
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
  }) {
    const db = getDb();
    const [row] = await db.insert(payments).values(input).returning();
    return row;
  },

  async findByReceiptNumber(receiptNumber: string) {
    const db = getDb();
    const [row] = await db.select().from(payments).where(eq(payments.receiptNumber, receiptNumber)).limit(1);
    return row ?? null;
  },
};
