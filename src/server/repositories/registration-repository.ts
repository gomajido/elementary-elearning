import { eq, desc, and } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import {
  studentRegistrationApplications,
  studentRegistrationAchievements,
  studentRegistrationNonformalEducations,
  type RegistrationStatus,
} from "@/lib/db/schema";

// The table has ~60 parent-supplied fields (see TSD-01) — deriving the
// insert type from the schema itself avoids hand-duplicating every field
// name a third time across schema/validation/repository.
export type NewRegistrationApplication = Omit<
  typeof studentRegistrationApplications.$inferInsert,
  "id" | "status" | "submittedAt" | "reviewedByUserId" | "reviewedAt" | "rejectionReason" | "promotedStudentId" | "schoolId" | "createdAt" | "updatedAt"
>;
export type NewAchievement = Omit<
  typeof studentRegistrationAchievements.$inferInsert,
  "id" | "applicationId" | "schoolId" | "createdAt"
>;
export type NewNonformalEducation = Omit<
  typeof studentRegistrationNonformalEducations.$inferInsert,
  "id" | "applicationId" | "schoolId" | "createdAt"
>;

export const RegistrationRepository = {
  /** Application + repeating sub-tables, one atomic insert. */
  async create(input: {
    application: NewRegistrationApplication;
    achievements: NewAchievement[];
    nonformalEducations: NewNonformalEducation[];
  }) {
    const db = getDb();
    const applicationId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(studentRegistrationApplications).values({ id: applicationId, ...input.application });
      if (input.achievements.length > 0) {
        await tx
          .insert(studentRegistrationAchievements)
          .values(input.achievements.map((a) => ({ applicationId, ...a })));
      }
      if (input.nonformalEducations.length > 0) {
        await tx
          .insert(studentRegistrationNonformalEducations)
          .values(input.nonformalEducations.map((e) => ({ applicationId, ...e })));
      }
    });

    return applicationId;
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(studentRegistrationApplications).where(eq(studentRegistrationApplications.id, id)).limit(1);
    return row ?? null;
  },

  async listByStatus(status: RegistrationStatus) {
    const db = getDb();
    return db
      .select()
      .from(studentRegistrationApplications)
      .where(eq(studentRegistrationApplications.status, status))
      .orderBy(desc(studentRegistrationApplications.submittedAt));
  },

  /**
   * Only transitions a row that's still "pending" — the `.returning()` row
   * (or its absence) is how the service detects a concurrent-approval race
   * without a separate read-then-write.
   */
  async updateStatus(
    id: string,
    status: RegistrationStatus,
    reviewerUserId: string,
    rejectionReason?: string,
    tx: Queryable = getDb()
  ) {
    const [row] = await tx
      .update(studentRegistrationApplications)
      .set({ status, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), rejectionReason, updatedAt: new Date() })
      .where(and(eq(studentRegistrationApplications.id, id), eq(studentRegistrationApplications.status, "pending")))
      .returning();
    return row ?? null;
  },

  async linkPromotedStudent(id: string, studentId: string, tx: Queryable = getDb()) {
    await tx
      .update(studentRegistrationApplications)
      .set({ promotedStudentId: studentId, updatedAt: new Date() })
      .where(eq(studentRegistrationApplications.id, id));
  },

  async listAchievements(applicationId: string) {
    const db = getDb();
    return db.select().from(studentRegistrationAchievements).where(eq(studentRegistrationAchievements.applicationId, applicationId));
  },

  async listNonformalEducations(applicationId: string) {
    const db = getDb();
    return db
      .select()
      .from(studentRegistrationNonformalEducations)
      .where(eq(studentRegistrationNonformalEducations.applicationId, applicationId));
  },
};
