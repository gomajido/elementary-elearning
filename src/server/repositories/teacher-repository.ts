import { eq, isNull, and } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { teachers, type MaritalStatus, type EmploymentStatus, type SalarySource } from "@/lib/db/schema";

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
  fingerprintId?: string;

  dateOfBirth?: string;
  placeOfBirth?: string;
  motherName?: string;
  addressDetail?: string;
  dusun?: string;
  rt?: string;
  rw?: string;
  kelurahan?: string;
  postalCode?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  nik?: string;
  npwp?: string;
  taxpayerName?: string;
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  spouseOccupation?: string;

  employmentStatus?: EmploymentStatus;
  niyNigk?: string;
  nigb?: string;
  nip?: string;
  nuptk?: string;
  ptkType?: string;
  isActive?: boolean;
  appointmentDecreeNumber?: string;
  appointmentEffectiveDate?: string;
  appointmentDecreeIssuer?: string;
  cpnsDecreeNumber?: string;
  cpnsEffectiveDate?: string;
  pnsEffectiveDate?: string;
  rankGrade?: string;
  salarySource?: SalarySource;

  assignmentLetterNumber?: string;
  assignmentLetterDate?: string;
  assignmentEffectiveDate?: string;
  isHomeSchool?: boolean;

  isPrincipalLicensed?: boolean;
  vocationalProgramCode?: string;
  specialNeedsTypesHandled?: string;
  specialNeedsSpecialization?: string;
  specialNeedsSkills?: string;
};

export type TeacherUpdate = Partial<Omit<NewTeacher, "userId">>;
