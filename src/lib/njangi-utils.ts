import { lastDayOfMonth, previousSunday, isSunday, format } from "date-fns";

export const BIRTH_ORDER = ["Yvonne", "Solo", "Bankom", "Nah", "Nandet"];

export function sortByBirthOrder<T extends { full_name: string }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const ai = BIRTH_ORDER.indexOf(a.full_name);
    const bi = BIRTH_ORDER.indexOf(b.full_name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function getLastSunday(year: number, month: number): Date {
  const last = lastDayOfMonth(new Date(year, month - 1));
  return isSunday(last) ? last : previousSunday(last);
}

export function getDeadlineLabel(year: number, month: number): string {
  return format(getLastSunday(year, month), "EEE, MMM d, yyyy");
}

export function getDaysToDeadline(year: number, month: number): number {
  const deadline = getLastSunday(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type NjangiStatusType = "not_started" | "partial" | "completed" | "overpaid";

export function computeStatus(remitted: number, expected: number): NjangiStatusType {
  if (remitted <= 0) return "not_started";
  if (remitted < expected) return "partial";
  if (remitted === expected) return "completed";
  return "overpaid";
}

export const statusConfig: Record<NjangiStatusType, { label: string; color: string; emoji: string }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground", emoji: "⏳" },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-800", emoji: "🔶" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", emoji: "✅" },
  overpaid: { label: "Overpaid", color: "bg-blue-100 text-blue-800", emoji: "💎" },
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash 💵" },
  { value: "interac", label: "Interac 💳" },
  { value: "bank_transfer", label: "Bank Transfer 🏦" },
  { value: "other", label: "Other" },
] as const;
