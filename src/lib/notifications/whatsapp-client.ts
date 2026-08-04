export class WhatsAppSendError extends Error {}

/** `phone` must already be normalized (see phone.ts) — digits only, `62...`, no `+`. */
export async function sendWhatsAppMessage(phone: string, text: string) {
  const res = await fetch(`${process.env.WAHA_BASE_URL}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
    },
    body: JSON.stringify({
      session: process.env.WAHA_SESSION ?? "default",
      chatId: `${phone}@c.us`,
      text,
    }),
  });

  if (!res.ok) {
    throw new WhatsAppSendError(`WAHA mengembalikan status ${res.status}: ${await res.text()}`);
  }
}

/**
 * Deep link that opens WhatsApp (app on phone, web.whatsapp.com on desktop)
 * with the chat to `phone` prefilled with `text` — no WAHA session needed,
 * the admin sends it themselves from their own WhatsApp account. `phone`
 * must already be normalized (see phone.ts) — digits only, `62...`, no `+`.
 */
export function buildWaMeLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
