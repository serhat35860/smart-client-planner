/** Sadece rakamlar (ülke kodu dahil), örn. 905551234567 */
export function phoneDigitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function whatsAppContactUrl(digits: string, message: string) {
  if (!digits) return "#";
  const t = message.trim();
  if (!t) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Tarayıcıda WhatsApp Web. */
export function whatsAppWebUrl(digits: string, message: string) {
  if (!digits) return "#";
  const t = message.trim();
  const base = `https://web.whatsapp.com/send?phone=${digits}`;
  if (!t) return base;
  return `${base}&text=${encodeURIComponent(message)}`;
}

/** Yüklü WhatsApp masaüstü / mobil uygulama (özel URL şeması). */
export function whatsAppDesktopUrl(digits: string, message: string) {
  if (!digits) return "#";
  const t = message.trim();
  const base = `whatsapp://send?phone=${digits}`;
  if (!t) return base;
  return `${base}&text=${encodeURIComponent(message)}`;
}

export function mailtoContactUrl(email: string, subject: string, body: string) {
  const trimmed = email.trim();
  if (!trimmed) return "#";
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const q = params.toString();
  return q ? `mailto:${trimmed}?${q}` : `mailto:${trimmed}`;
}
