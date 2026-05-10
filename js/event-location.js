// Venue / city / state for timeline events: `events-data.js` rows include these
// fields from `Concert Data.xlsx` (see scripts/generate-events-data.py). If any are
// missing on a row, we fall back to best-effort parse from setlist.fm URL slugs.

/** Hyphenated city slugs that appear before the state token in setlist.fm paths. */
const MULTI_TOKEN_CITIES = [
  "west-palm-beach",
  "salt-lake-city",
  "los-angeles",
  "las-vegas",
  "east-rutherford",
  "new-york",
  "san-francisco",
  "san-diego",
  "san-jose",
  "san-juan",
  "san-antonio",
  "st-louis",
  "el-monte",
  "fort-lauderdale",
  "kansas-city",
];

/** @param {string} slug */
function titleCaseWords(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Best-effort parse of setlist.fm venue slug: .../ARTIST/YEAR/{slug}.html
 * @param {string | undefined} url
 * @returns {{ venue: string; city: string; state: string } | null}
 */
function parseSetlistFmLocation(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/setlist\.fm\/setlist\/[^/]+\/\d{4}\/(.+)\.html$/i);
  if (!m) return null;

  /** @type {string[]} */
  let parts = m[1].split("-").filter(Boolean);
  while (parts.length && /^[a-f0-9]{5,14}$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  if (parts.length < 2) return null;

  let state = "";
  if (
    parts.length >= 2 &&
    parts[parts.length - 1].toLowerCase() === "rico" &&
    parts[parts.length - 2].toLowerCase() === "puerto"
  ) {
    state = "PR";
    parts = parts.slice(0, -2);
  } else if (parts[parts.length - 1].length === 2) {
    state = parts.pop().toUpperCase();
  } else {
    return null;
  }

  if (parts.length === 0) {
    return { venue: "", city: "", state };
  }

  let city = "";
  let matchedMulti = false;
  for (const mc of MULTI_TOKEN_CITIES) {
    const need = mc.split("-").length;
    if (parts.length < need) continue;
    const tail = parts.slice(-need).join("-").toLowerCase();
    if (tail === mc) {
      parts = parts.slice(0, -need);
      city = titleCaseWords(mc);
      matchedMulti = true;
      break;
    }
  }
  if (!matchedMulti) {
    city = titleCaseWords(parts.pop() ?? "");
  }

  const venue = parts.length ? titleCaseWords(parts.join("-")) : "";
  return { venue, city, state };
}

/**
 * @param {{ venue?: string; city?: string; state?: string; setlist?: string }} e
 * @returns {{ venue: string; city: string; state: string }}
 */
export function locationFromEventRow(e) {
  const venue = (e.venue ?? "").trim();
  const city = (e.city ?? "").trim();
  const state = (e.state ?? "").trim();
  if (venue || city || state) {
    return { venue, city, state };
  }
  return parseSetlistFmLocation(e.setlist) ?? { venue: "", city: "", state: "" };
}

/**
 * @param {{ venue?: string; city?: string; state?: string }} o
 */
export function hasAnyLocation(o) {
  return !!(o.venue?.trim() || o.city?.trim() || o.state?.trim());
}

/**
 * Comma-separated venue, city, state (omits empty segments).
 * @param {{ venue?: string; city?: string; state?: string }} o
 */
export function formatLocationComma(o) {
  const parts = [o.venue, o.city, o.state].map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
  return parts.join(", ");
}
