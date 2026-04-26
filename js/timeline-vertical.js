import { CONCERT_EVENTS } from "./events-data.js";
import {
  formatDisplayDate,
  createEventPopover,
  showEventPopover,
  hideEventPopover,
  attachPopoverGlobalListeners,
} from "./event-popover.js";

const START_YEAR = 2000;
const END_YEAR = 2025;

const YEAR_BUCKETS = [
  { label: "2000s", startYear: 2000, endYear: 2009 },
  { label: "2010s", startYear: 2010, endYear: 2019 },
  { label: "2020s", startYear: 2020, endYear: 2025 },
];

/**
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
  return String(year);
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

    const headerRow = document.createElement("div");
    headerRow.className = "decade-header-row";

    const headerLeft = document.createElement("div");
    headerLeft.className = "decade-header-side decade-header-side--left";
    const headerAxis = document.createElement("div");
    headerAxis.className = "decade-header-axis";
    headerAxis.setAttribute("aria-hidden", "true");
    const headerRight = document.createElement("div");
    headerRight.className = "decade-header-side decade-header-side--right";

    const headerInner = document.createElement("div");
    headerInner.className = "decade-header-inner";

    const h2 = document.createElement("h2");
    h2.className = "decade-title";
    h2.textContent = bucket.label;

    const blurb = document.createElement("p");
    blurb.className = "decade-header-blurb";
    blurb.textContent = DECADE_DUMMY_BLURBS[decadeIndex] ?? DECADE_DUMMY_BLURBS[0];

    headerInner.append(h2, blurb);

    if (onRight) {
      headerLeft.classList.add("decade-header-side--filled");
      headerLeft.appendChild(headerInner);
      headerRight.classList.add("decade-header-side--empty");
    } else {
      headerRight.classList.add("decade-header-side--filled");
      headerRight.appendChild(headerInner);
      headerLeft.classList.add("decade-header-side--empty");
    }

    headerRow.append(headerLeft, headerAxis, headerRight);
    block.appendChild(headerRow);

    for (let year = bucket.startYear; year <= bucket.endYear; year++) {
      const row = document.createElement("div");
      row.className = "year-row";

      const leftCell = document.createElement("div");
      const axisCell = document.createElement("div");
      const rightCell = document.createElement("div");

      const yearEvents = (byYear.get(year) ?? []).slice().sort(compareMergedEvents);

      const eventsCell = onRight ? rightCell : leftCell;
      const emptyCell = onRight ? leftCell : rightCell;

      eventsCell.className = `year-side year-side--events ${onRight ? "year-side--right" : "year-side--left"}`;
      emptyCell.className = "year-side year-side--empty";

      axisCell.className = "year-axis-cell";
      const yearLabel = document.createElement("span");
      yearLabel.className = "year-axis-label";
      yearLabel.textContent = formatYearLabel(year);
      yearLabel.setAttribute("title", String(year));
      axisCell.appendChild(yearLabel);

      for (const ev of yearEvents) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "event-dot";
        const hoverText = ev.artists.join(", ");
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
      block.appendChild(row);
    }

    inner.appendChild(block);
  });

  wrap.appendChild(inner);
  rootEl.appendChild(wrap);
}

function setStatus(message) {
  const el = document.querySelector("[data-status-vertical]") ?? document.querySelector("[data-status]");
  if (el) el.textContent = message;
}

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
    attachPopoverGlobalListeners(popover, onOutsidePointerDown);
    window.addEventListener(
      "scroll",
      () => {
        if (!popover.el.hidden) hideEventPopover(popover);
      },
      { passive: true }
    );

    setStatus(
      `${CONCERT_EVENTS.length} concerts across ${merged.length} concert dates between ${START_YEAR} and ${END_YEAR}. Click a dot for date and artists.`
    );
  } catch (err) {
    console.error(err);
    setStatus(`Failed to render timeline: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main();
