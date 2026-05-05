// Phase 1: every inquiry routes to admin's WhatsApp.
// Phase 2: swap to pg.owner_phone (one-line change).
export function getInquiryWhatsAppNumber(_pgOwnerPhone?: string | null): string {
  const adminNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP;
  if (!adminNumber) {
    throw new Error("NEXT_PUBLIC_ADMIN_WHATSAPP is not set");
  }
  return adminNumber;
  // Phase 2: return _pgOwnerPhone || adminNumber;
}

interface InquiryMessage {
  pgName: string;
  pgSlug: string;
  studentName: string;
  studentPhone: string;
  moveInDate?: string;
  budget?: number;
  roomPreference?: string;
  notes?: string;
}

export function buildWhatsAppLink(to: string, msg: InquiryMessage): string {
  const lines = [
    "🏠 New PG Inquiry",
    `PG: ${msg.pgName}`,
    `Student: ${msg.studentName}`,
    `Phone: ${msg.studentPhone}`,
    msg.moveInDate ? `Move-in: ${msg.moveInDate}` : null,
    msg.budget ? `Budget: ₹${msg.budget}` : null,
    msg.roomPreference ? `Room: ${msg.roomPreference}` : null,
    msg.notes ? `Notes: ${msg.notes}` : null,
    "",
    `Listing: ${typeof window !== "undefined" ? window.location.origin : ""}/pg/${msg.pgSlug}`
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${to}?text=${text}`;
}
