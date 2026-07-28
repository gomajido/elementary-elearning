import { eq, isNull, and } from "drizzle-orm";

import { getDb } from "@/lib/db";
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

  async create(input: NewTeacher) {
    const [row] = await TeacherRepository.insertStatement(input);
    return row;
  },

  /** Unexecuted insert statement for `db.batch([...])` composition. */
  insertStatement(input: NewTeacher) {
    const db = getDb();
    return db.insert(teachers).values(input).returning();
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
