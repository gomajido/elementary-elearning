import { getDb } from "@/lib/db";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { UserRepository } from "@/server/repositories/user-repository";
import { GuardianRepository } from "@/server/repositories/student-repository";

export class GuardianPortalError extends Error {}

export const GuardianService = {
  listGuardiansWithStudents: () => GuardianRepository.listWithStudents(),

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
      throw new GuardianPortalError("Not authorized to view this student");
    }
  },

  /**
   * Grants portal access to an existing guardian record (created during
   * student registration, no login yet). Atomic user-insert + guardian-link
   * update in one transaction.
   */
  async grantPortalAccess(guardianId: string, email: string) {
    const guardian = await GuardianRepository.findById(guardianId);
    if (!guardian) throw new GuardianPortalError("Guardian not found");
    if (guardian.userId) throw new GuardianPortalError("This guardian already has portal access");

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new GuardianPortalError("A user with this email already exists");

    const db = getDb();
    const userId = crypto.randomUUID();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await db.transaction(async (tx) => {
      await UserRepository.create({ id: userId, email, passwordHash, role: "parent", mustChangePassword: true }, tx);
      await GuardianRepository.linkUser(guardianId, userId, tx);
    });

    return { tempPassword };
  },
};
