import { CONCERT_EVENTS } from "./events-data.js";

const START_YEAR = 2000;
const END_YEAR = 2025;

// Vertical spacing between stacked dots within a year column (center-to-center stride).
const DOT_STRIDE_PX = 16;

const YEAR_BUCKETS = [
  { label: "2000s", startYear: 2000, endYear: 2009 },
  { label: "2010s", startYear: 2010, endYear: 2019 },
  { label: "2020s", startYear: 2020, endYear: 2025 },
];

/**
 * Collapse multiple spreadsheet rows that share the same calendar date into one timeline dot.
 *
 * Hover text uses column B values joined with commas.
 *
 * @param {typeof CONCERT_EVENTS} events
 */
function mergeEventsByDate(events) {
  /** @type {Map<string, {date: string, year: number, artists: string[], sortKey: number}>} */
  const groups = new Map();

  for (const e of events) {
    const key = `${e.year}|${e.date}`;
    const artist = (e.artist ?? "").trim() || "Unknown artist";

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        date: e.date,
        year: e.year,
        artists: [artist],
        sortKey: e.sortKey,
      });
      continue;
    }

    existing.sortKey = Math.min(existing.sortKey, e.sortKey);

    if (!existing.artists.includes(artist)) {
      existing.artists.push(artist);
    }
  }

  return [...groups.values()].sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.artists[0].localeCompare(b.artists[0]);
  });
}

function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function clampYear(year) {
  return year >= START_YEAR && year <= END_YEAR;
}

function formatYearLabel(year) {
  return String(year % 100).padStart(2, "0");
}

/**
 * @param {string} isoDate `YYYY-MM-DD`
 * @returns {string} e.g. "April 7, 2000"
 */
function formatDisplayDate(isoDate) {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return isoDate;
  const dt = new Date(y, m, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** @typedef {{ el: HTMLDivElement; dateEl: HTMLParagraphElement; listEl: HTMLUListElement }} EventPopover */

/** @returns {EventPopover} */
function createEventPopover() {
  const el = document.createElement("div");
  el.className = "event-detail-popover";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Concert details");
  el.hidden = true;

  const dateEl = document.createElement("p");
  dateEl.className = "event-detail-popover-date";

  const listEl = document.createElement("ul");
  listEl.className = "event-detail-popover-artists";

  el.append(dateEl, listEl);
  return { el, dateEl, listEl };
}

/** @type {HTMLButtonElement | null} */
let activeDotEl = null;

/**
 * Places the popover so its top-left is at the pointer (viewport coords), clamped on screen.
 *
 * @param {EventPopover} popover
 * @param {MouseEvent} pointerEvent
 * @param {HTMLElement} anchorEl fallback when pointer coords are missing (e.g. keyboard activation)
 */
function positionPopoverNearPointer(popover, pointerEvent, anchorEl) {
  const { el } = popover;
  const pad = 8;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let left = pointerEvent.clientX;
  let top = pointerEvent.clientY;
  if (!Number.isFinite(left) || !Number.isFinite(top) || (left === 0 && top === 0)) {
    const rect = anchorEl.getBoundingClientRect();
    left = rect.left;
    top = rect.bottom + 4;
  }
  left = Math.max(pad, Math.min(left, window.innerWidth - pad - w));
  top = Math.max(pad, Math.min(top, window.innerHeight - pad - h));
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

/**
 * @param {EventPopover} popover
 * @param {{ date: string; artists: string[] }} ev
 * @param {HTMLButtonElement} anchorEl
 * @param {MouseEvent} pointerEvent
 */
function showEventPopover(popover, ev, anchorEl, pointerEvent) {
  activeDotEl = anchorEl;
  popover.dateEl.textContent = formatDisplayDate(ev.date);
  popover.listEl.replaceChildren();
  for (const name of ev.artists) {
    const li = document.createElement("li");
    li.textContent = name;
    popover.listEl.appendChild(li);
  }
  popover.el.hidden = false;
  popover.el.classList.add("is-open");
  requestAnimationFrame(() => {
    positionPopoverNearPointer(popover, pointerEvent, anchorEl);
  });
}

/** @param {EventPopover} popover */
function hideEventPopover(popover) {
  popover.el.classList.remove("is-open");
  popover.el.hidden = true;
  if (activeDotEl) {
    activeDotEl.focus({ preventScroll: true });
    activeDotEl = null;
  }
}

/**
 * @param {EventPopover} popover
 * @param {(e: PointerEvent) => void} onOutsidePointerDown
 */
function attachPopoverGlobalListeners(popover, onOutsidePointerDown) {
  document.addEventListener("pointerdown", onOutsidePointerDown);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popover.el.classList.contains("is-open")) hideEventPopover(popover);
  });
  window.addEventListener("resize", () => {
    if (popover.el.classList.contains("is-open")) hideEventPopover(popover);
  });
}

/**
 * Build symmetric vertical offsets (in px) around an invisible center line.
 *
 * Rules:
 * - Odd counts keep a dot exactly on the axis (`y = 0`), then expand outward.
 * - Even counts use **half-steps** (`±0.5d, ±1.5d, …`) so paired dots straddle the axis
 *   instead of leaving an empty gap at `y = 0`.
 */
function symmetricOffsetsPx(count) {
  if (count <= 0) return [];
  if (count === 1) return [0];

  const d = DOT_STRIDE_PX;

  if (count % 2 === 1) {
    /** @type {number[]} */
    const offsets = [0];
    let k = 1;
    while (offsets.length < count) {
      offsets.push(-k * d, k * d);
      k += 1;
    }
    return offsets.slice(0, count);
  }

  /** @type {number[]} */
  const offsets = [];
  let band = 0;
  while (offsets.length < count) {
    const mag = (band + 0.5) * d;
    offsets.push(-mag, mag);
    band += 1;
  }
  return offsets.slice(0, count);
}

/**
 * @param {{ sortKey: number; date: string; artists: string[] }} a
 * @param {{ sortKey: number; date: string; artists: string[] }} b
 */
function compareMergedEvents(a, b) {
  if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.artists[0].localeCompare(b.artists[0]);
}

/**
 * Symmetric offsets are only a set of allowed positions; assign them so chronological order reads
 * bottom → top within the column (earliest concert dates lower on screen).
 *
 * Positive `--y` translates downward in CSS, so earliest → largest y.
 *
 * @param {Array<{ sortKey: number; date: string; artists: string[] }>} yearEvents chronological ASC
 * @returns {number[]}
 */
function offsetsBottomToTopChronological(yearEvents) {
  const n = yearEvents.length;
  const template = symmetricOffsetsPx(n)
    .slice()
    .sort((x, y) => y - x); // largest (most “down”) first → earliest dates

  /** @type {number[]} */
  const assigned = new Array(n);
  for (let i = 0; i < n; i++) assigned[i] = template[i] ?? 0;
  return assigned;
}

function groupEventsByYear(events) {
  /** @type {Map<number, typeof events>} */
  const byYear = new Map();
  for (let y = START_YEAR; y <= END_YEAR; y++) byYear.set(y, []);

  for (const e of events) {
    if (!clampYear(e.year)) continue;
    byYear.get(e.year)?.push(e);
  }

  for (const [, list] of byYear) {
    list.sort(compareMergedEvents);
  }

  return byYear;
}

/**
 * @param {HTMLElement} rootEl
 * @param {ReturnType<typeof groupEventsByYear>} byYear
 * @param {EventPopover} popover
 */
function renderTimeline(rootEl, byYear, popover) {
  rootEl.replaceChildren();

  const scroll = document.createElement("div");
  scroll.className = "timeline-scroll";

  const continuous = document.createElement("div");
  continuous.className = "timeline-continuous";

  for (const bucket of YEAR_BUCKETS) {
    const group = document.createElement("section");
    group.className = "year-group";

    const headingId = `year-group-${bucket.startYear}-${bucket.endYear}`;
    group.setAttribute("aria-labelledby", headingId);

    const heading = document.createElement("h2");
    heading.id = headingId;
    heading.className = "year-group-title";
    heading.textContent = bucket.label;

    const yearsRow = document.createElement("div");
    yearsRow.className = "year-group-years";
    yearsRow.setAttribute("role", "list");

    for (let year = bucket.startYear; year <= bucket.endYear; year++) {
      const col = document.createElement("section");
      col.className = "year-col";
      col.setAttribute("role", "listitem");

      const track = document.createElement("div");
      track.className = "year-track";

      const yearEvents = (byYear.get(year) ?? []).slice().sort(compareMergedEvents);
      const offsets = offsetsBottomToTopChronological(yearEvents);

      yearEvents.forEach((ev, idx) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "event-dot";
        dot.style.setProperty("--y", `${offsets[idx]}px`);
        const hoverText = ev.artists.join(", ");
        dot.title = hoverText;
        dot.setAttribute("aria-haspopup", "dialog");
        dot.setAttribute(
          "aria-label",
          `${formatDisplayDate(ev.date)}: ${hoverText}. Click for details.`
        );

        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          showEventPopover(popover, ev, dot, e);
        });

        track.appendChild(dot);
      });

      const yearLabel = document.createElement("div");
      yearLabel.className = "year-label";
      yearLabel.textContent = formatYearLabel(year);

      col.append(track, yearLabel);
      yearsRow.appendChild(col);
    }

    group.append(heading, yearsRow);
    continuous.appendChild(group);
  }

  scroll.appendChild(continuous);
  rootEl.appendChild(scroll);

  scroll.addEventListener("scroll", () => {
    if (popover.el.classList.contains("is-open")) hideEventPopover(popover);
  });
}

function setStatus(message) {
  const el = document.querySelector("[data-status]");
  if (el) el.textContent = message;
}

function main() {
  const root = $("#timeline");

  setStatus("Rendering timeline…");

  try {
    const merged = mergeEventsByDate(CONCERT_EVENTS);
    const byYear = groupEventsByYear(merged);

    const popover = createEventPopover();
    document.body.appendChild(popover.el);

    const onOutsidePointerDown = (e) => {
      if (!popover.el.classList.contains("is-open")) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (popover.el.contains(t)) return;
      if (t instanceof Element && t.closest(".event-dot")) return;
      hideEventPopover(popover);
    };
    attachPopoverGlobalListeners(popover, onOutsidePointerDown);

    renderTimeline(root, byYear, popover);
    setStatus(
      `${CONCERT_EVENTS.length} concerts across ${merged.length} concert dates between ${START_YEAR} and ${END_YEAR}. Click a dot for date and artists; hover still shows a quick artist preview.`
    );
  } catch (err) {
    console.error(err);
    setStatus(`Failed to render timeline: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main();
