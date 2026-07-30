import { hashPassword, verifyPassword, generateTempPassword } from "@/lib/auth/password";
import { generateSessionToken, hashToken } from "@/lib/auth/token";
import { UserRepository } from "@/server/repositories/user-repository";
import { SessionRepository } from "@/server/repositories/session-repository";

export class AuthError extends Error {}

export const AuthService = {
  /**
   * Verifies credentials and opens a new session. `identifier` may be an
   * email, a NIP (teacher employeeNumber, mirrored into users.username at
   * registration), or a system-generated username (students/guardians
   * without email) — see UserRepository.findByIdentifier. Throws AuthError
   * on failure.
   */
  async login(identifier: string, password: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await UserRepository.findByIdentifier(identifier);
    if (!user || !user.isActive) throw new AuthError("Email/NIP/username atau kata sandi salah");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new AuthError("Email/NIP/username atau kata sandi salah");

    const token = generateSessionToken();
    const tokenHash = await hashToken(token);
    await SessionRepository.create(user.id, tokenHash, meta);
    await UserRepository.updateLastLoginAt(user.id);
    // Lazy pruning (no cron trigger wired up for MVP — see RFC 0001 auth design).
    await SessionRepository.deleteExpired();

    return { token, user };
  },

  async logout(token: string) {
    const tokenHash = await hashToken(token);
    await SessionRepository.deleteByTokenHash(tokenHash);
  },

  /** Authoritative per-request session check — see RFC 0001 "Auth Design". */
  async getUserForToken(token: string) {
    const tokenHash = await hashToken(token);
    const row = await SessionRepository.findByTokenHashWithUser(tokenHash);
    if (!row) return null;
    if (row.session.expiresAt.getTime() < Date.now()) return null;
    if (!row.user.isActive) return null;
    return row.user;
  },

  async adminExists() {
    return (await UserRepository.countByRole("admin")) > 0;
  },

  /**
   * One-time setup: creates the school's first admin account. Refuses once
   * any admin already exists — no public self-registration (RFC 0001).
   */
  async bootstrapAdmin(email: string, password: string) {
    const existingAdmins = await UserRepository.countByRole("admin");
    if (existingAdmins > 0) throw new AuthError("Akun admin sudah ada");

    const passwordHash = await hashPassword(password);
    return UserRepository.create({ email, passwordHash, roles: ["admin"] });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AuthError("Tidak ditemukan");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AuthError("Kata sandi saat ini salah");

    const passwordHash = await hashPassword(newPassword);
    await UserRepository.updatePassword(userId, passwordHash);
  },

  /**
   * Admin managing another (or their own) account's email/username — no
   * password check, since the caller's admin role is the authority
   * boundary (enforced by requireRole at the controller), not knowledge of
   * that account's password. See account-controller.ts.
   */
  async adminUpdateIdentity(targetUserId: string, input: { email: string | null; username: string | null }) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) throw new AuthError("Akun tidak ditemukan");

    if (!input.email && !input.username) {
      throw new AuthError("Email atau username harus diisi salah satu");
    }

    if (input.email && input.email !== user.email) {
      const existing = await UserRepository.findByEmail(input.email);
      if (existing && existing.id !== targetUserId) throw new AuthError("Email sudah digunakan");
    }

    if (input.username && input.username !== user.username) {
      const existing = await UserRepository.findByUsername(input.username);
      if (existing && existing.id !== targetUserId) throw new AuthError("Username sudah digunakan");
    }

    await UserRepository.updateIdentity(targetUserId, input);
  },

  /** Admin-forced password reset — generates a new temp password, same provisioning pattern as teacher/student/guardian creation. */
  async adminResetPassword(targetUserId: string) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) throw new AuthError("Akun tidak ditemukan");

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await UserRepository.resetPassword(targetUserId, passwordHash);

    return { tempPassword };
  },

  /**
   * Grants admin access on top of an account's existing primary role (e.g.
   * a teacher becomes ["teacher", "admin"]) — primary role and its linked
   * profile record (teachers/students/guardians) are untouched. Gated at
   * the controller by requireBaseRole(["admin"]), not requireRole, so only
   * a *real* admin (roles[0] === "admin") can grant further access.
   */
  async grantAdmin(targetUserId: string) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) throw new AuthError("Akun tidak ditemukan");
    if (user.roles[0] !== "teacher") throw new AuthError("Akses admin hanya bisa diberikan ke akun guru");
    if (user.roles.includes("admin")) return;

    await UserRepository.updateRoles(targetUserId, [...user.roles, "admin"]);
  },

  /** Revokes a granted admin role — never touches roles[0] (the primary role), so this can't demote a real admin. */
  async revokeAdmin(targetUserId: string) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) throw new AuthError("Akun tidak ditemukan");

    await UserRepository.updateRoles(
      targetUserId,
      user.roles.filter((r, i) => !(r === "admin" && i !== 0)),
    );
  },
};
