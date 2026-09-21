/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `clsx` — the project has no such dependency and this is the
 * whole of what the UI layer needs.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default cn;
