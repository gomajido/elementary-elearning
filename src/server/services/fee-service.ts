import { FeeStructureRepository, InvoiceRepository, PaymentRepository, type NewInvoiceLineItem } from "@/server/repositories/fee-repository";
import { StudentRepository } from "@/server/repositories/student-repository";
import { AcademicYearRepository } from "@/server/repositories/academic-repository";

export class FeeError extends Error {}

/** Balance/status are always derived from summing payments — see RFC 0001 "Payments". */
export function summarizeInvoice(totalAmountCents: number, paymentAmounts: number[]) {
  const paidCents = paymentAmounts.reduce((sum, a) => sum + a, 0);
  const balanceCents = totalAmountCents - paidCents;
  const status: "paid" | "partial" | "unpaid" = balanceCents <= 0 ? "paid" : paidCents > 0 ? "partial" : "unpaid";
  return { paidCents, balanceCents, status };
}

function generateInvoiceNumber(academicYearName: string) {
  const suffix = Date.now().toString(36).toUpperCase();
  return `INV-${academicYearName.replace(/\//g, "-")}-${suffix}`;
}

function generateReceiptNumber() {
  const suffix = Date.now().toString(36).toUpperCase();
  return `RCT-${suffix}`;
}

export const FeeService = {
  listFeeStructures: () => FeeStructureRepository.list(),
  createFeeStructure: (input: Parameters<typeof FeeStructureRepository.create>[0]) =>
    FeeStructureRepository.create(input),

  async generateInvoiceForStudent(input: {
    studentId: string;
    academicYearId: string;
    issueDate: string;
    dueDate: string;
    lineItems: NewInvoiceLineItem[];
  }) {
    if (input.lineItems.length === 0) throw new FeeError("Invoice needs at least one line item");
    const year = await AcademicYearRepository.findById(input.academicYearId);
    if (!year) throw new FeeError("Academic year not found");
    return InvoiceRepository.createWithLineItems({
      studentId: input.studentId,
      academicYearId: input.academicYearId,
      invoiceNumber: generateInvoiceNumber(year.name),
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lineItems: input.lineItems,
    });
  },

  /** One invoice per active student in the class, each its own atomic write. */
  async generateInvoicesForClass(input: {
    classId: string;
    academicYearId: string;
    issueDate: string;
    dueDate: string;
    lineItems: NewInvoiceLineItem[];
  }) {
    if (input.lineItems.length === 0) throw new FeeError("Invoice needs at least one line item");
    const year = await AcademicYearRepository.findById(input.academicYearId);
    if (!year) throw new FeeError("Academic year not found");
    const classStudents = await StudentRepository.listByClass(input.classId);
    const created = [];
    for (const student of classStudents) {
      created.push(
        await InvoiceRepository.createWithLineItems({
          studentId: student.id,
          academicYearId: input.academicYearId,
          invoiceNumber: generateInvoiceNumber(year.name),
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          lineItems: input.lineItems,
        })
      );
    }
    return created;
  },

  async recordPayment(input: {
    invoiceId: string;
    amountCents: number;
    method: "bank_transfer" | "cash" | "cheque" | "other";
    referenceNumber?: string;
    paidAt: string;
    recordedByUserId: string;
    notes?: string;
  }) {
    const invoice = await InvoiceRepository.findById(input.invoiceId);
    if (!invoice) throw new FeeError("Invoice not found");
    if (input.amountCents <= 0) throw new FeeError("Payment amount must be positive");

    return PaymentRepository.create({
      invoiceId: input.invoiceId,
      studentId: invoice.studentId,
      amountCents: input.amountCents,
      method: input.method,
      referenceNumber: input.referenceNumber,
      paidAt: input.paidAt,
      recordedByUserId: input.recordedByUserId,
      receiptNumber: generateReceiptNumber(),
      notes: input.notes,
    });
  },

  async invoicesForStudent(studentId: string) {
    const rows = await InvoiceRepository.listWithPaymentsByStudent(studentId);
    const byId = new Map<string, { invoice: (typeof rows)[number]["invoice"]; payments: number[] }>();
    for (const row of rows) {
      const entry = byId.get(row.invoice.id) ?? { invoice: row.invoice, payments: [] };
      if (row.payment) entry.payments.push(row.payment.amountCents);
      byId.set(row.invoice.id, entry);
    }
    return Array.from(byId.values()).map(({ invoice, payments }) => ({
      invoice,
      ...summarizeInvoice(invoice.totalAmountCents, payments),
    }));
  },

  async allInvoicesWithSummary() {
    const rows = await InvoiceRepository.listAllWithPaymentsAndStudent();
    const byId = new Map<
      string,
      { invoice: (typeof rows)[number]["invoice"]; student: (typeof rows)[number]["student"]; payments: number[] }
    >();
    for (const row of rows) {
      const entry = byId.get(row.invoice.id) ?? { invoice: row.invoice, student: row.student, payments: [] };
      if (row.payment) entry.payments.push(row.payment.amountCents);
      byId.set(row.invoice.id, entry);
    }
    return Array.from(byId.values()).map(({ invoice, student, payments }) => ({
      invoice,
      student,
      ...summarizeInvoice(invoice.totalAmountCents, payments),
    }));
  },

  async outstandingBalanceReport() {
    const all = await FeeService.allInvoicesWithSummary();
    return all.filter((row) => row.balanceCents > 0);
  },

  async invoiceDetail(invoiceId: string) {
    const invoice = await InvoiceRepository.findById(invoiceId);
    if (!invoice) return null;
    const lineItems = await InvoiceRepository.listLineItems(invoiceId);
    const rows = await InvoiceRepository.listWithPaymentsByStudent(invoice.studentId);
    const paymentRows = rows.filter((r) => r.invoice.id === invoiceId && r.payment);
    const invoicePayments = paymentRows.map((r) => r.payment!);
    const summary = summarizeInvoice(
      invoice.totalAmountCents,
      invoicePayments.map((p) => p.amountCents)
    );
    return { invoice, lineItems, payments: invoicePayments, ...summary };
  },
};
