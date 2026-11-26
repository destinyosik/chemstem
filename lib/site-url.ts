import "server-only";

const PRODUCTION_SITE_URL = "https://chemstems.vercel.app";
export function getSiteOrigin(): string {
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_SITE_URL;

  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
  const siteUrl =
    configuredUrl ||
    (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "production"
        ? PRODUCTION_SITE_URL
        : "http://localhost:3000");

  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a site origin without credentials, path, query, or fragment.");
  }

  return url.origin;
}