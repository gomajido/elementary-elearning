/**
 * Normalizes an Indonesian phone number to the digits-only form WAHA expects
 * (`62...`, no `+`, no spaces/dashes). Accepts `08...`, `62...`, `+62...`.
 * Returns null for anything that doesn't plausibly resolve to a real number
 * — `guardians.phone` has no format constraint today, so this is the only
 * validation that exists.
 */
export function normalizeIndonesianPhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 0) return null;

  let normalized: string;
  if (digits.startsWith("62")) {
    normalized = digits;
  } else if (digits.startsWith("0")) {
    normalized = `62${digits.slice(1)}`;
  } else {
    return null;
  }

  if (normalized.length < 10 || normalized.length > 15) return null;
  return normalized;
}
