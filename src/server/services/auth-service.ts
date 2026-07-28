import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, hashToken } from "@/lib/auth/token";
import { UserRepository } from "@/server/repositories/user-repository";
import { SessionRepository } from "@/server/repositories/session-repository";

export class AuthError extends Error {}

export const AuthService = {
  /** Verifies credentials and opens a new session. Throws AuthError on failure. */
  async login(email: string, password: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.isActive) throw new AuthError("Invalid email or password");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new AuthError("Invalid email or password");

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
    if (existingAdmins > 0) throw new AuthError("Admin account already exists");

    const passwordHash = await hashPassword(password);
    return UserRepository.create({ email, passwordHash, role: "admin" });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AuthError("Not found");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AuthError("Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await UserRepository.updatePassword(userId, passwordHash);
  },
};
