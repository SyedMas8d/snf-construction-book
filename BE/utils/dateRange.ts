function toDateOnly(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export function dateSpanRange(from: string, to: string) {
  return { $gte: toDateOnly(from), $lte: toDateOnly(to) };
}

export function dayRange(date: string) {
  return { $gte: toDateOnly(date), $lte: toDateOnly(date) };
}

export function beforeDate(date: string) {
  return { $lt: toDateOnly(date) };
}

export function dateSequence(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = toDateOnly(from);
  const end = toDateOnly(to);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// Shared by every request schema that accepts a user-chosen [from, to] range —
// an unbounded range means an unbounded table scan, so every such endpoint caps it.
export const MAX_DATE_RANGE_DAYS = 90;

export function daysBetween(from: string, to: string): number {
  const a = toDateOnly(from).getTime();
  const b = toDateOnly(to).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}
