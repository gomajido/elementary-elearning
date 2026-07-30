import { getDb } from "@/lib/db";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { generateUsername } from "@/lib/auth/username";
import { UserRepository } from "@/server/repositories/user-repository";
import { GuardianRepository, type GuardianUpdate } from "@/server/repositories/student-repository";

export class GuardianPortalError extends Error {}

export const GuardianService = {
  listGuardiansWithStudents: () => GuardianRepository.listWithStudents(),
  updateGuardian: (id: string, input: GuardianUpdate) => GuardianRepository.update(id, input),
  deleteGuardian: (id: string) => GuardianRepository.softDelete(id),

  async childrenForGuardianUser(userId: string) {
    const guardian = await GuardianRepository.findByUserId(userId);
    if (!guardian) return { guardian: null, children: [] };
    const rows = await GuardianRepository.listChildrenForGuardian(guardian.id);
    return { guardian, children: rows.map((r) => r.student) };
  },

  /** Verifies studentId is actually one of this guardian's linked children — the RBAC boundary for the parent portal. */
  async assertGuardianOwnsStudent(userId: string, studentId: string) {
    const { children } = await GuardianService.childrenForGuardianUser(userId);
    if (!children.some((c) => c.id === studentId)) {
      throw new GuardianPortalError("Tidak berwenang melihat siswa ini");
    }
  },

  /**
   * Grants portal access to an existing guardian record (created during
   * student registration, no login yet). Atomic user-insert + guardian-link
   * update in one transaction.
   *
   * `email` is optional — many guardians don't have one. When omitted, a
   * unique system-generated username becomes their login identifier instead.
   */
  async grantPortalAccess(guardianId: string, email?: string) {
    const guardian = await GuardianRepository.findById(guardianId);
    if (!guardian) throw new GuardianPortalError("Wali tidak ditemukan");
    if (guardian.userId) throw new GuardianPortalError("Wali ini sudah memiliki akses portal");

    let username: string | undefined;
    if (email) {
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) throw new GuardianPortalError("Pengguna dengan email ini sudah ada");
    } else {
      username = generateUsername(guardian.firstName, guardian.lastName);
      while (await UserRepository.findByUsername(username)) {
        username = generateUsername(guardian.firstName, guardian.lastName);
      }
    }

    const db = getDb();
    const userId = crypto.randomUUID();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await db.transaction(async (tx) => {
      await UserRepository.create(
        { id: userId, email: email || null, username, passwordHash, roles: ["parent"], mustChangePassword: true },
        tx
      );
      await GuardianRepository.linkUser(guardianId, userId, tx);
    });

    return { tempPassword, username };
  },
};
