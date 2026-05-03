// Raw concert rows from the static dataset; popover helpers for dots and the detail dialog.
import { CONCERT_EVENTS } from "./events-data.js";
import {
  formatDisplayDate,
  createEventPopover,
  showEventPopover,
  hideEventPopover,
  attachPopoverGlobalListeners,
} from "./event-popover.js";
import { observeReveal } from "./reveal-on-scroll.js";

// -----------------------------------------------------------------------------
// Timeline range and decade groupings
// Which years appear on the axis and how they roll up into labeled buckets (2000s, 2010s, 2020s).
// -----------------------------------------------------------------------------
const START_YEAR = 2000;
const END_YEAR = 2025;

const YEAR_BUCKETS = [
  { label: "My first show was in 2000", startYear: 2000, endYear: 2009 },
  { label: "I moved to New York in 2010", startYear: 2010, endYear: 2019 },
  { label: "2020 was... a year", startYear: 2020, endYear: 2025 },
];

/** ISO `YYYY-MM-DD` dates that get an extra ring on the timeline (see `.event-dot--special-date`). */
const SPECIAL_TIMELINE_DATES = new Set(["2000-04-07", "2007-02-03"]);

// -----------------------------------------------------------------------------
// Merging and ordering events
// Multiple CSV-style rows for the same calendar date become one event with several
// artists; compareMergedEvents defines stable sort order for lists and years.
// -----------------------------------------------------------------------------
/**
 * @param {{ sortKey: number; date: string; artists: { name: string }[] }} a
 * @param {{ sortKey: number; date: string; artists: { name: string }[] }} b
 */
function compareMergedEvents(a, b) {
  if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.artists[0].name.localeCompare(b.artists[0].name);
}

/**
 * @param {typeof CONCERT_EVENTS} events
 */
function mergeEventsByDate(events) {
  /** @type {Map<string, {date: string, year: number, artists: { name: string; setlist?: string }[], sortKey: number}>} */
  const groups = new Map();

  for (const e of events) {
    const key = `${e.year}|${e.date}`;
    const name = (e.artist ?? "").trim() || "Unknown artist";
    const setlist =
      typeof e.setlist === "string" && e.setlist.trim() !== "" ? e.setlist.trim() : undefined;

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        date: e.date,
        year: e.year,
        artists: [setlist ? { name, setlist } : { name }],
        sortKey: e.sortKey,
      });
      continue;
    }

    existing.sortKey = Math.min(existing.sortKey, e.sortKey);

    const i = existing.artists.findIndex((a) => a.name === name);
    if (i === -1) {
      existing.artists.push(setlist ? { name, setlist } : { name });
    } else if (setlist && !existing.artists[i].setlist) {
      existing.artists[i].setlist = setlist;
    }
  }

  return [...groups.values()].sort(compareMergedEvents);
}

// -----------------------------------------------------------------------------
// Small DOM and year helpers
// Strict querySelector wrapper for required mount nodes; clampYear filters outliers.
// -----------------------------------------------------------------------------
function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function clampYear(year) {
  return year >= START_YEAR && year <= END_YEAR;
}

// -----------------------------------------------------------------------------
// Events indexed by calendar year
// Builds a map year → merged events, drops out-of-range years, sorts each year’s list.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Decade layout helpers
// Alternates which side of the central axis holds events vs empty space; placeholder
// blurbs fill decade headers until real copy replaces them.
// -----------------------------------------------------------------------------
/** First decade (2000s) on the right of the axis; alternate left/right for each following decade. */
function decadeEventsOnRight(decadeIndex) {
  return decadeIndex % 2 === 0;
}

const DECADE_DUMMY_BLURBS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.",
];

/**
 * Polaroid collage per decade: same two placeholder files for every bucket so you can
 * preview layout; swap `src` (and add files under assets/timeline-photos/) per era when ready.
 * `photoClass` picks polaroid layout (--a upper, --b lower); keep two entries unless CSS is extended.
 */
const DECADE_COLLAGE_CONFIG = [
  {
    ariaLabel: "Photos from the 2000s",
    photos: [
      {
        src: "assets/timeline-photos/2000s-1.jpg",
        alt: "Concert photo for the 2000s section",
        photoClass: "decade-header-collage__photo--a",
      },
      {
        src: "assets/timeline-photos/2000s-2.jpg",
        alt: "Second concert photo for the 2000s section",
        photoClass: "decade-header-collage__photo--b",
      },
    ],
  },
  {
    ariaLabel: "Photos from the 2010s",
    photos: [
      {
        src: "assets/timeline-photos/2000s-1.jpg",
        alt: "Placeholder collage image (replace with a 2010s photo)",
        photoClass: "decade-header-collage__photo--a",
      },
      {
        src: "assets/timeline-photos/2000s-2.jpg",
        alt: "Second placeholder collage image (replace with a 2010s photo)",
        photoClass: "decade-header-collage__photo--b",
      },
    ],
  },
  {
    ariaLabel: "Photos from the 2020s",
    photos: [
      {
        src: "assets/timeline-photos/2000s-1.jpg",
        alt: "Placeholder collage image (replace with a 2020s photo)",
        photoClass: "decade-header-collage__photo--a",
      },
      {
        src: "assets/timeline-photos/2000s-2.jpg",
        alt: "Second placeholder collage image (replace with a 2020s photo)",
        photoClass: "decade-header-collage__photo--b",
      },
    ],
  },
];

/** Collage wrapper + images for one decade rail (collage grid layout). */
function createDecadeCollage(ariaLabel, photos) {
  const collage = document.createElement("div");
  collage.className = "decade-header-collage";
  collage.setAttribute("aria-label", ariaLabel);
  for (const item of photos) {
    const img = document.createElement("img");
    img.className = `decade-header-collage__photo ${item.photoClass}`;
    img.src = item.src;
    img.alt = item.alt;
    img.loading = "lazy";
    img.decoding = "async";
    collage.appendChild(img);
  }
  return collage;
}

/**
 * One timeline year row: empty side | axis label | event dots (or mirrored when events are on the left).
 * @param {number} year
 * @param {boolean} onRight
 * @param {ReturnType<typeof groupEventsByYear>} byYear
 * @param {ReturnType<typeof createEventPopover>} popover
 */
function buildYearRow(year, onRight, byYear, popover) {
  const row = document.createElement("div");
  row.className = "year-row";

  const leftCell = document.createElement("div");
  const axisCell = document.createElement("div");
  const rightCell = document.createElement("div");

  const yearEvents = byYear.get(year) ?? [];
  const eventsCell = onRight ? rightCell : leftCell;
  const emptyCell = onRight ? leftCell : rightCell;

  eventsCell.className = `year-side year-side--events ${onRight ? "year-side--right" : "year-side--left"}`;
  emptyCell.className = "year-side year-side--empty";

  axisCell.className = "year-axis-cell";
  const yearLabel = document.createElement("span");
  yearLabel.className = "year-axis-label";
  yearLabel.textContent = String(year);
  yearLabel.setAttribute("title", String(year));
  axisCell.appendChild(yearLabel);

  for (const ev of yearEvents) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "event-dot";
    if (SPECIAL_TIMELINE_DATES.has(ev.date)) dot.classList.add("event-dot--special-date");
    const hoverText = ev.artists.map((a) => a.name).join(", ");
    dot.title = hoverText;
    dot.setAttribute("aria-haspopup", "dialog");
    dot.setAttribute("aria-label", `${formatDisplayDate(ev.date)}: ${hoverText}. Click for details.`);

    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      showEventPopover(popover, ev, dot, e);
    });

    eventsCell.appendChild(dot);
  }

  row.append(leftCell, axisCell, rightCell);
  return row;
}

// -----------------------------------------------------------------------------
// Vertical timeline DOM
// Renders decade blocks, year rows, central axis labels, and interactive dots that
// open the shared event popover with merged artist data for that date.
// -----------------------------------------------------------------------------
/**
 * @param {HTMLElement} rootEl
 * @param {ReturnType<typeof groupEventsByYear>} byYear
 * @param {ReturnType<typeof createEventPopover>} popover
 */
function renderTimelineVertical(rootEl, byYear, popover) {
  rootEl.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "timeline-vertical-wrap";

  const inner = document.createElement("div");
  inner.className = "timeline-vertical-inner";

  YEAR_BUCKETS.forEach((bucket, decadeIndex) => {
    const block = document.createElement("div");
    block.className = "decade-block";

    const onRight = decadeEventsOnRight(decadeIndex);
    const collageCfg = DECADE_COLLAGE_CONFIG[decadeIndex];
    if (!collageCfg) throw new Error(`Missing DECADE_COLLAGE_CONFIG for decade index ${decadeIndex}`);

    /*
     * Collage sidebar: polaroid rail on the outer edge (left when events are on the right,
     * right when events are on the left) so the axis and dots never sit under the photos.
     */
    block.classList.add("decade-block--collage");
    if (onRight) block.classList.add("decade-block--collage-rail-start");
    else block.classList.add("decade-block--collage-rail-end");

    const layout = document.createElement("div");
    layout.className = "decade-collage-layout";

    const headerAxis = document.createElement("div");
    headerAxis.className = "decade-header-axis";
    headerAxis.setAttribute("aria-hidden", "true");

    const introWrap = document.createElement("div");
    introWrap.className = "decade-collage-layout__intro decade-header-side decade-header-side--filled";

    const headerInner = document.createElement("div");
    headerInner.className = "decade-header-inner";

    const h2 = document.createElement("h2");
    h2.className = "decade-title";
    h2.textContent = bucket.label;

    const blurb = document.createElement("p");
    blurb.className = "decade-header-blurb";
    blurb.textContent = DECADE_DUMMY_BLURBS[decadeIndex] ?? DECADE_DUMMY_BLURBS[0];

    headerInner.append(h2, blurb);
    introWrap.appendChild(headerInner);

    const headerOpposite = document.createElement("div");
    headerOpposite.className = "decade-header-side decade-header-side--empty";

    if (onRight) {
      introWrap.classList.add("decade-header-side--left");
      headerOpposite.classList.add("decade-header-side--right");
    } else {
      introWrap.classList.add("decade-header-side--right");
      headerOpposite.classList.add("decade-header-side--left");
    }

    const rail = document.createElement("div");
    rail.className = "decade-collage-rail";
    rail.appendChild(createDecadeCollage(collageCfg.ariaLabel, collageCfg.photos));

    const yearCount = bucket.endYear - bucket.startYear + 1;
    rail.style.gridRow = `2 / span ${yearCount}`;

    if (onRight) layout.append(introWrap, headerAxis, headerOpposite, rail);
    else layout.append(headerOpposite, headerAxis, introWrap, rail);

    let gridRow = 2;
    for (let year = bucket.startYear; year <= bucket.endYear; year++) {
      const built = buildYearRow(year, onRight, byYear, popover);
      const axisCell = built.children[1];
      const eventsCell = onRight ? built.children[2] : built.children[0];
      const yearStrip = document.createElement("div");
      yearStrip.className = "decade-collage-year";
      yearStrip.style.gridRow = String(gridRow);
      if (onRight) yearStrip.append(axisCell, eventsCell);
      else yearStrip.append(eventsCell, axisCell);
      layout.appendChild(yearStrip);
      gridRow += 1;
    }

    block.appendChild(layout);
    inner.appendChild(block);
  });

  wrap.appendChild(inner);
  rootEl.appendChild(wrap);
}

// -----------------------------------------------------------------------------
// Live region / status line updates
// Writes progress and result counts to [data-status] when present (e.g. a11y-friendly summary).
// -----------------------------------------------------------------------------
function setStatus(message) {
  const el = document.querySelector("[data-status]");
  if (el) el.textContent = message;
}

// -----------------------------------------------------------------------------
// Bootstrap
// Merges data, mounts the timeline and popover on #timeline-vertical, wires outside-click
// and scroll-to-close, and reports success or errors via setStatus.
// -----------------------------------------------------------------------------
function main() {
  const root = $("#timeline-vertical");

  setStatus("Rendering timeline…");

  try {
    const merged = mergeEventsByDate(CONCERT_EVENTS);
    const byYear = groupEventsByYear(merged);

    const popover = createEventPopover();
    document.body.appendChild(popover.el);

    const onOutsidePointerDown = (e) => {
      if (popover.el.hidden) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (popover.el.contains(t)) return;
      if (t instanceof Element && t.closest(".event-dot")) return;
      hideEventPopover(popover);
    };

    renderTimelineVertical(root, byYear, popover);

    // Rise polaroid photos as they enter the viewport; positive bottom rootMargin starts
    // the reveal slightly earlier so more of the motion happens on-screen.
    observeReveal(root.querySelectorAll(".decade-header-collage__photo"), {
      rootMargin: "0px 0px 12% 0px",
    });

    attachPopoverGlobalListeners(popover, onOutsidePointerDown);
    window.addEventListener(
      "scroll",
      () => {
        if (!popover.el.hidden) hideEventPopover(popover);
      },
      { passive: true }
    );

    setStatus(
      `Between ${START_YEAR} and ${END_YEAR}, I saw ${CONCERT_EVENTS.length} different sets on ${merged.length} concert dates. Each circle represents a date. Click a circle for details and setlist links. Outlined circles indicate additional content including stories, images, and videos.`
    );
  } catch (err) {
    console.error(err);
    setStatus(`Failed to render timeline: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main();
