// System-generated login identifier for accounts without email (students,
// guardians) — see auth-service.ts login(). Modeled on generateTempPassword
// in password.ts: crypto.getRandomValues, no native deps.

const USERNAME_SUFFIX_DIGITS = "23456789"; // no 0/1, matches temp-password's no-ambiguous-chars convention
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function baseUsername(firstName: string, lastName: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINING_DIACRITICS, "")
      .replace(/[^a-z0-9]/g, "");
  return `${clean(firstName)}.${clean(lastName)}`;
}

export function generateUsername(firstName: string, lastName: string): string {
  const suffix = Array.from(
    crypto.getRandomValues(new Uint8Array(3)),
    (b) => USERNAME_SUFFIX_DIGITS[b % USERNAME_SUFFIX_DIGITS.length],
  ).join("");
  return `${baseUsername(firstName, lastName)}${suffix}`;
}
