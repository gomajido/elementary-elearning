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
