export function getSafeReturnPath(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  try {
    const baseOrigin = "http://chemstem.local";
    const destination = new URL(value, baseOrigin);
    if (destination.origin !== baseOrigin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
