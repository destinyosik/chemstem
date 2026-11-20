import "server-only";

const PRODUCTION_SITE_URL = "https://chemstem.vercel.app";

export function getSiteOrigin(): string {
  const configuredUrl =
    process.env.SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : "http://localhost:3000");

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("SITE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("SITE_URL must use HTTP or HTTPS.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("SITE_URL must use HTTPS in production.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("SITE_URL must be an origin without credentials, query, or fragment.");
  }

  return url.origin;
}
