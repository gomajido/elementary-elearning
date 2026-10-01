import Papa from "papaparse";

import { getDb } from "@/lib/db";
import {
  RegistrationRepository,
  type NewRegistrationApplication,
  type NewAchievement,
  type NewNonformalEducation,
} from "@/server/repositories/registration-repository";
import { StudentService, type GuardianInput } from "@/server/services/student-service";
import { StudentRepository } from "@/server/repositories/student-repository";

export class RegistrationError extends Error {}

// Only the fields buildDapodikExportRow actually reads — narrower than the
// full table row so it stays easy to unit test and doesn't couple this pure
// function to every column `studentRegistrationApplications` happens to have.
type ExportApplicationFields = {
  nisn: string;
  nik: string;
  placeOfBirth: string;
  religion: string;
  specialNeeds: string;
  addressDetail: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  fatherName: string;
  fatherOccupation: string;
  fatherEducationLevel: string;
  fatherMonthlyIncome: string;
  motherName: string;
  motherOccupation: string;
  motherEducationLevel: string;
  motherMonthlyIncome: string;
  guardianName: string | null;
  heightCm: number;
  weightKg: number;
};

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Pure — used for both the approval-form pre-fill and the export mapping. */
export function buildDapodikExportRow(
  student: { admissionNumber: string; firstName: string; lastName: string; dateOfBirth: string; gender: string },
  application: ExportApplicationFields | null
): Record<string, string> {
  const a = application;
  return {
    "No. Induk": student.admissionNumber,
    "Nama Lengkap": `${student.firstName} ${student.lastName}`.trim(),
    "Jenis Kelamin": student.gender,
    "Tanggal Lahir": student.dateOfBirth,
    NISN: a?.nisn ?? "",
    NIK: a?.nik ?? "",
    "Tempat Lahir": a?.placeOfBirth ?? "",
    Agama: a?.religion ?? "",
    "Berkebutuhan Khusus": a?.specialNeeds ?? "",
    Alamat: a?.addressDetail ?? "",
    RT: a?.rt ?? "",
    RW: a?.rw ?? "",
    "Kelurahan/Desa": a?.kelurahan ?? "",
    Kecamatan: a?.kecamatan ?? "",
    "Kabupaten/Kota": a?.kabupaten ?? "",
    Provinsi: a?.provinsi ?? "",
    "Nama Ayah": a?.fatherName ?? "",
    "Pekerjaan Ayah": a?.fatherOccupation ?? "",
    "Pendidikan Ayah": a?.fatherEducationLevel ?? "",
    "Penghasilan Ayah": a?.fatherMonthlyIncome ?? "",
    "Nama Ibu": a?.motherName ?? "",
    "Pekerjaan Ibu": a?.motherOccupation ?? "",
    "Pendidikan Ibu": a?.motherEducationLevel ?? "",
    "Penghasilan Ibu": a?.motherMonthlyIncome ?? "",
    "Nama Wali": a?.guardianName ?? "",
    "Tinggi Badan (cm)": a?.heightCm != null ? String(a.heightCm) : "",
    "Berat Badan (kg)": a?.weightKg != null ? String(a.weightKg) : "",
  };
}

export const RegistrationService = {
  /** No auth check — called from the one public action in the app. */
  async submitApplication(input: {
    application: NewRegistrationApplication;
    achievements: NewAchievement[];
    nonformalEducations: NewNonformalEducation[];
  }) {
    const applicationId = await RegistrationRepository.create(input);
    return { applicationId };
  },

  listPending: () => RegistrationRepository.listByStatus("pending"),

  /**
   * Approves a pending application: creates the real student record (with
   * guardians derived from the application's father/mother data — the
   * Dapodik form doesn't ask "who is the primary contact", so the father is
   * the default primary/billing contact, mother secondary, both reachable
   * via the household phone/email already collected) and links it back to
   * the application, all in one transaction with the status flip.
   */
  async approveApplication(
    applicationId: string,
    reviewerUserId: string,
    placement: {
      classId: string;
      academicYearId: string;
      admissionNumber: string;
      enrollmentDate: string;
      firstName: string;
      lastName: string;
    }
  ) {
    const application = await RegistrationRepository.findById(applicationId);
    if (!application) throw new RegistrationError("Pendaftaran tidak ditemukan");
    if (application.status !== "pending") throw new RegistrationError("Pendaftaran sudah diproses sebelumnya");

    const db = getDb();
    return db.transaction(async (tx) => {
      const updated = await RegistrationRepository.updateStatus(applicationId, "approved", reviewerUserId, undefined, tx);
      if (!updated) throw new RegistrationError("Pendaftaran sudah diproses sebelumnya");

      const contactPhone = application.mobilePhone ?? application.homePhone ?? undefined;
      const father = splitFullName(application.fatherName);
      const mother = splitFullName(application.motherName);
      const guardians: GuardianInput[] = [
        {
          firstName: father.firstName,
          lastName: father.lastName,
          relationshipType: "father",
          phone: contactPhone,
          email: application.personalEmail ?? undefined,
          isPrimaryContact: true,
          isBillingContact: true,
        },
        {
          firstName: mother.firstName,
          lastName: mother.lastName,
          relationshipType: "mother",
          phone: contactPhone,
          email: application.personalEmail ?? undefined,
          isPrimaryContact: false,
          isBillingContact: false,
        },
      ];

      const student = await StudentService.registerStudent(
        {
          admissionNumber: placement.admissionNumber,
          firstName: placement.firstName,
          lastName: placement.lastName,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          classId: placement.classId,
          academicYearId: placement.academicYearId,
          enrollmentDate: placement.enrollmentDate,
          registrationApplicationId: applicationId,
          guardians,
        },
        tx
      );
      if (!student) throw new RegistrationError("Gagal membuat data siswa");

      await RegistrationRepository.linkPromotedStudent(applicationId, student.id, tx);
      return { studentId: student.id };
    });
  },

  async rejectApplication(applicationId: string, reviewerUserId: string, reason: string) {
    const updated = await RegistrationRepository.updateStatus(applicationId, "rejected", reviewerUserId, reason);
    if (!updated) throw new RegistrationError("Pendaftaran sudah diproses sebelumnya");
  },

  async exportStudentsCsv() {
    const rows = await StudentRepository.listWithDetails();
    const csvRows = rows.map((row) => buildDapodikExportRow(row.student, row.registrationApplication));
    return Papa.unparse(csvRows);
  },
};
