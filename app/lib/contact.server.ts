const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

/**
 * Attentive requires E.164. Numbers without a country code are treated as US
 * (10 digits, or 11 starting with 1).
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");

  let phone: string | null = null;
  if (trimmed.startsWith("+")) phone = `+${digits}`;
  else if (digits.length === 10) phone = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith("1")) phone = `+${digits}`;

  return phone && E164.test(phone) ? phone : null;
}
