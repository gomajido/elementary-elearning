import { eq, isNull, and } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { teachers } from "@/lib/db/schema";

export const TeacherRepository = {
  async list() {
    const db = getDb();
    return db
      .select()
      .from(teachers)
      .where(isNull(teachers.deletedAt))
      .orderBy(teachers.lastName, teachers.firstName);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.id, id), isNull(teachers.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByUserId(userId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.userId, userId), isNull(teachers.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByEmployeeNumber(employeeNumber: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.employeeNumber, employeeNumber), isNull(teachers.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(input: NewTeacher, tx: Queryable = getDb()) {
    const [row] = await tx.insert(teachers).values(input).returning();
    return row;
  },

  async update(id: string, input: TeacherUpdate, tx: Queryable = getDb()) {
    const [row] = await tx.update(teachers).set({ ...input, updatedAt: new Date() }).where(eq(teachers.id, id)).returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(teachers).set({ deletedAt: new Date() }).where(eq(teachers.id, id));
  },
};

export type NewTeacher = {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  phone?: string;
  hireDate?: string;
};

export type TeacherUpdate = Partial<Omit<NewTeacher, "userId">>;
