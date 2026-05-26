const LOCALE = "pt-BR";

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(LOCALE, { day: "2-digit", month: "short", year: "numeric" });
}

export type DueStatus = "overdue" | "today" | "upcoming";

export function getDueStatus(iso: string): DueStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

export function formatPhoneNumber(phoneStr: string): string {
  const cleaned = phoneStr.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]} - ${match[3]}`;
  }
  const landlineMatch = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
  if (landlineMatch) {
    return `(${landlineMatch[1]}) ${landlineMatch[2]} - ${landlineMatch[3]}`;
  }

  return phoneStr;
}
