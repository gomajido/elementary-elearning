"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AuthService, AuthError } from "@/server/services/auth-service";
import { setSessionCookie, clearSessionCookie, getSessionToken, getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Masukkan email dan kata sandi yang valid" };

  try {
    const headerList = await headers();
    const { token, user } = await AuthService.login(parsed.data.email, parsed.data.password, {
      userAgent: headerList.get("user-agent") ?? undefined,
    });
    await setSessionCookie(token);
    redirect(user.mustChangePassword ? "/account/change-password" : ROLE_HOME[user.role]);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
}

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) await AuthService.logout(token);
  await clearSessionCookie();
  redirect("/login");
}

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export type BootstrapState = { error?: string };

/** One-time first-run setup — see AuthService.bootstrapAdmin. */
export async function bootstrapAdminAction(_prev: BootstrapState, formData: FormData): Promise<BootstrapState> {
  const parsed = bootstrapSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await AuthService.bootstrapAdmin(parsed.data.email, parsed.data.password);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  redirect("/login");
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
});

export type ChangePasswordState = { error?: string };

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await AuthService.changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  redirect(ROLE_HOME[user.role]);
}
