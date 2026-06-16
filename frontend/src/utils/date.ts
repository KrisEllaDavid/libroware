const FALLBACK = '—';

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** "Jan 5, 2025" */
export function fmtDate(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return FALLBACK;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}

/** "1/5/2025" — locale short form */
export function fmtShort(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return FALLBACK;
  return d.toLocaleDateString();
}

/** "Jan 5, 2025 · 14:32" */
export function fmtDateTime(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return FALLBACK;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** Returns true if the date string represents a past date */
export function isPast(value: string | null | undefined): boolean {
  const d = parse(value);
  return d ? d < new Date() : false;
}

/** Days since a past date (0 if not past or invalid) */
export function daysPast(value: string | null | undefined): number {
  const d = parse(value);
  if (!d || d >= new Date()) return 0;
  return Math.ceil((Date.now() - d.getTime()) / 86_400_000);
}
