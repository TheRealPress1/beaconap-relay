import type { ContactRow } from "@/lib/supabase/types";

const FALLBACK_GRADIENT = "#1e40af,#3b82f6";

export function ContactAvatar({ contact, size = 36 }: { contact: ContactRow; size?: number }) {
  const initials = [contact.first_name?.[0], contact.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";
  const [from, to] = (contact.gradient || FALLBACK_GRADIENT).split(",");
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(135deg, ${from?.trim()}, ${to?.trim()})`,
      }}
    >
      {initials}
    </div>
  );
}
