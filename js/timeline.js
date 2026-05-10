// Raw concert rows from the static dataset; popover helpers for dots and the detail dialog.
import { CONCERT_EVENTS } from "./events-data.js";
import {
  formatDisplayDate,
  createEventPopover,
  showEventPopover,
  hideEventPopover,
  attachPopoverGlobalListeners,
} from "./event-popover.js";
import { locationFromEventRow, hasAnyLocation } from "./event-location.js";
import { attachCollagePlayButton } from "./timeline-photo-audio.js";
import { EVENT_RICH_DETAILS } from "./event-rich-details.js";

// -----------------------------------------------------------------------------
// Timeline range and decade groupings
// Which years appear on the axis and how they roll up into labeled buckets (2000s, 2010s, 2020s).
// -----------------------------------------------------------------------------
const START_YEAR = 2000;
const END_YEAR = 2025;

const YEAR_BUCKETS = [
  { eraLabel: "2000s", label: "My first show was in 2000", startYear: 2000, endYear: 2009 },
  { eraLabel: "2010s", label: "I moved to New York in 2010", startYear: 2010, endYear: 2019 },
  { eraLabel: "2020s", label: "2020 was... a year", startYear: 2020, endYear: 2025 },
];

/** Set to `true` to put the decade heading on one side of the axis and the paragraph on the other; `false` restores the stacked title + copy in one column. */
const SPLIT_DECADE_HEADING_AND_BLURB = true;

/** ISO `YYYY-MM-DD` dates with rich popup content get an extra ring (see `.event-dot--special-date`). */
const RICH_DETAIL_DATES = new Set(Object.keys(EVENT_RICH_DETAILS));

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
  /** @type {Map<string, {date: string, year: number, artists: { name: string; setlist?: string }[], sortKey: number, venue: string, city: string, state: string}>} */
  const groups = new Map();

  for (const e of events) {
    const key = `${e.year}|${e.date}`;
    const name = (e.artist ?? "").trim() || "Unknown artist";
    const setlist =
      typeof e.setlist === "string" && e.setlist.trim() !== "" ? e.setlist.trim() : undefined;

    const existing = groups.get(key);
    if (!existing) {
      const loc = locationFromEventRow(e);
      groups.set(key, {
        date: e.date,
        year: e.year,
        artists: [setlist ? { name, setlist } : { name }],
        sortKey: e.sortKey,
        venue: loc.venue,
        city: loc.city,
        state: loc.state,
      });
      continue;
    }

    existing.sortKey = Math.min(existing.sortKey, e.sortKey);

    if (!hasAnyLocation(existing)) {
      const loc = locationFromEventRow(e);
      if (hasAnyLocation(loc)) {
        existing.venue = loc.venue;
        existing.city = loc.city;
        existing.state = loc.state;
      }
    }

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
 * `photoClass` picks polaroid layout (--a upper, --b lower, optional --c middle overlap); use two or three entries per era as needed.
 * Optional `songTitle` + `artist` appear as text above the play control on hover (see `.decade-header-collage__track-label`).
 */
const DECADE_COLLAGE_CONFIG = [
  {
    ariaLabel: "Photos from the 2000s",
    photos: [
      {
        src: "assets/timeline-photos/2000s-1.jpg",
        alt: "Concert photo for the 2000s section",
        photoClass: "decade-header-collage__photo--a",
        songTitle: "Promises",
        artist: "The Cranberries",
      },
      {
        src: "assets/timeline-photos/2000s-2.jpg",
        alt: "Second concert photo for the 2000s section",
        photoClass: "decade-header-collage__photo--b",
        songTitle: "THE FINAL",
        artist: "Dir en grey",
      },
    ],
  },
  {
    ariaLabel: "Photos from the 2010s",
    photos: [
      {
        src: "assets/timeline-photos/2010s-1.jpg",
        alt: "Concert photo for the 2010s section",
        photoClass: "decade-header-collage__photo--a",
        songTitle: "Ibara no Namida",
        artist: "L'arc-en-Ciel",
      },
      {
        src: "assets/timeline-photos/2010s-3.jpg",
        alt: "Second concert photo for the 2010s section",
        photoClass: "decade-header-collage__photo--b",
        songTitle: "Dance In The Dark",
        artist: "Lady Gaga",
      },
      {
        src: "assets/timeline-photos/2010s-2.jpg",
        alt: "Third concert photo for the 2010s section",
        photoClass: "decade-header-collage__photo--c",
        songTitle: "Tricky Tricky",
        artist: "Royksopp",
      },
    ],
  },
  {
    ariaLabel: "Photos from the 2020s",
    photos: [
      {
        src: "assets/timeline-photos/2020s-1.jpg",
        alt: "Concert photo for the 2020s section",
        photoClass: "decade-header-collage__photo--a",
        songTitle: "visions",
        artist: "Charli XCX",
      },
      {
        src: "assets/timeline-photos/2020s-2.jpg",
        alt: "Second concert photo for the 2020s section",
        photoClass: "decade-header-collage__photo--b",
        songTitle: "TOMBOY",
        artist: "i-dle",
      },
    ],
  },
];

/**
 * Hover tooltip for a polaroid: "Song" by Band (typographic quotes). Omit empty parts.
 * @param {string | undefined} songTitle
 * @param {string | undefined} artist
 */
function formatCollagePhotoTooltip(songTitle, artist) {
  const s = typeof songTitle === "string" ? songTitle.trim() : "";
  const a = typeof artist === "string" ? artist.trim() : "";
  if (s !== "" && a !== "") {
    return `\u201C${s}\u201D by ${a}`;
  }
  if (s !== "") {
    return `\u201C${s}\u201D`;
  }
  if (a !== "") {
    return `Audio: ${a}`;
  }
  return "";
}

/**
 * Collage wrapper + images for one decade rail (collage grid layout).
 * @param {string} ariaLabel
 * @param {typeof DECADE_COLLAGE_CONFIG[number]["photos"]} photos
 */
function createDecadeCollage(ariaLabel, photos) {
  const collage = document.createElement("div");
  collage.className = "decade-header-collage";
  collage.setAttribute("aria-label", ariaLabel);
  for (const item of photos) {
    const wrap = document.createElement("div");
    wrap.className = `decade-header-collage__photo-wrap ${item.photoClass}`;
    const trackLabelText = formatCollagePhotoTooltip(item.songTitle, item.artist);

    const img = document.createElement("img");
    img.className = "decade-header-collage__photo";
    img.src = item.src;
    img.alt = item.alt;
    img.loading = "lazy";
    img.decoding = "async";

    const controls = document.createElement("div");
    controls.className = "decade-header-collage__controls";

    const trackLabelId =
      trackLabelText !== "" ? `collage-track-${item.src.replace(/[^a-z0-9]+/gi, "-")}` : "";

    if (trackLabelText !== "") {
      const labelEl = document.createElement("span");
      labelEl.id = trackLabelId;
      labelEl.className = "decade-header-collage__track-label";
      labelEl.textContent = trackLabelText;
      controls.appendChild(labelEl);
    }

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "decade-header-collage__play";
    playBtn.dataset.photoSrc = item.src;
    playBtn.setAttribute("aria-label", "Play audio clip for this photo");
    playBtn.textContent = "\u25B6";
    if (trackLabelId !== "") {
      playBtn.setAttribute("aria-describedby", trackLabelId);
    }

    attachCollagePlayButton(playBtn, item.src);

    controls.appendChild(playBtn);
    wrap.append(img, controls);
    collage.appendChild(wrap);
  }
  return collage;
}

/**
 * One timeline year strip: axis label + event dots, mirrored when events are on the left.
 * @param {number} year
 * @param {boolean} onRight
 * @param {ReturnType<typeof groupEventsByYear>} byYear
 * @param {ReturnType<typeof createEventPopover>} popover
 * @returns {{ axisCell: HTMLDivElement; eventsCell: HTMLDivElement }}
 */
function buildYearCells(year, onRight, byYear, popover) {
  const axisCell = document.createElement("div");
  const eventsCell = document.createElement("div");

  const yearEvents = byYear.get(year) ?? [];

  eventsCell.className = `year-side year-side--events ${onRight ? "year-side--right" : "year-side--left"}`;

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
    if (RICH_DETAIL_DATES.has(ev.date)) dot.classList.add("event-dot--special-date");
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

  return { axisCell, eventsCell };
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
    block.classList.add(`decade-block--collage-era-${bucket.startYear}`);
    if (onRight) block.classList.add("decade-block--collage-rail-start");
    else block.classList.add("decade-block--collage-rail-end");

    const layout = document.createElement("div");
    layout.className = "decade-collage-layout";
    if (SPLIT_DECADE_HEADING_AND_BLURB) {
      layout.classList.add("decade-collage-layout--split-heading");
    }

    const headerAxis = document.createElement("div");
    headerAxis.className = "decade-header-axis";
    headerAxis.setAttribute("aria-hidden", "true");

    const introWrap = document.createElement("div");
    introWrap.className = "decade-collage-layout__intro decade-header-side decade-header-side--filled";

    const headerInner = document.createElement("div");
    headerInner.className = "decade-header-inner";

    const eraHeading = document.createElement("h2");
    eraHeading.className = "decade-era-label";
    eraHeading.textContent = bucket.eraLabel;

    const titleHeading = document.createElement("h3");
    titleHeading.className = "decade-title";
    titleHeading.textContent = bucket.label;

    const blurb = document.createElement("p");
    blurb.className = "decade-header-blurb";
    blurb.textContent = DECADE_DUMMY_BLURBS[decadeIndex] ?? DECADE_DUMMY_BLURBS[0];

    if (SPLIT_DECADE_HEADING_AND_BLURB) {
      headerInner.classList.add("decade-header-inner--title-only");
      headerInner.append(eraHeading, titleHeading);
    } else {
      headerInner.append(eraHeading, titleHeading, blurb);
    }
    introWrap.appendChild(headerInner);

    const headerOpposite = document.createElement("div");
    headerOpposite.className = "decade-collage-layout__header-opposite decade-header-side";

    if (SPLIT_DECADE_HEADING_AND_BLURB) {
      headerOpposite.classList.add("decade-header-side--filled");
      const blurbInner = document.createElement("div");
      blurbInner.className = "decade-header-inner";
      blurbInner.appendChild(blurb);
      headerOpposite.appendChild(blurbInner);
    } else {
      headerOpposite.classList.add("decade-header-side--empty");
    }

    if (onRight) {
      introWrap.classList.add("decade-header-side--left");
      headerOpposite.classList.add("decade-header-side--right");
    } else if (SPLIT_DECADE_HEADING_AND_BLURB) {
      /* Split view: keep heading left of axis / blurb right like rail-start decades (polaroids stay on the outer column). */
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
      const { axisCell, eventsCell } = buildYearCells(year, onRight, byYear, popover);
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
// Writes progress and errors as a single .status paragraph inside [data-status].
// Success clears the header; loading/errors stay as a single .status in [data-status].
// -----------------------------------------------------------------------------
function setStatus(message) {
  const wrap = document.querySelector("[data-status]");
  if (!wrap) return;
  const p = document.createElement("p");
  p.className = "status";
  p.textContent = message;
  wrap.replaceChildren(p);
}

/**
 * @param {{ concertCount: number; dateCount: number }} stats
 */
function setTimelineIntroComplete(stats) {
  const timelineWrap = document.querySelector("#timeline-vertical .timeline-vertical-wrap");
  if (!timelineWrap) return;

  const title = document.createElement("h2");
  title.id = "timeline-intro-heading";
  title.className = "timeline-intro__title";
  title.textContent = `Between ${START_YEAR} and ${END_YEAR}, I attended ${stats.dateCount} events and saw ${stats.concertCount} artist sets.`;

  const subtitle = document.createElement("h3");
  subtitle.className = "timeline-intro__subtitle";
  subtitle.textContent = "Click a circle for details and setlist links.";

  const markerPlain = document.createElement("span");
  markerPlain.className = "timeline-intro__marker timeline-intro__marker--plain";
  markerPlain.setAttribute("aria-hidden", "true");

  const markerRich = document.createElement("span");
  markerRich.className = "timeline-intro__marker timeline-intro__marker--rich";
  markerRich.setAttribute("aria-hidden", "true");

  const linePlain = document.createElement("p");
  linePlain.className = "timeline-intro__line";
  // Two U+2003 EM SPACEs between legend dot and sentence (2× em-wide gap).
  const emSpace = "\u2003\u2003";
  linePlain.append(
    markerPlain,
    document.createTextNode(emSpace),
    document.createTextNode("Each circle represents a date.")
  );

  const lineRich = document.createElement("p");
  lineRich.className = "timeline-intro__line";
  lineRich.append(
    markerRich,
    document.createTextNode(emSpace),
    document.createTextNode(
      "Outlined circles indicate extra content including stories, images, and videos."
    )
  );

  const introInner = document.createElement("div");
  introInner.className = "timeline-vertical-intro__inner";
  introInner.append(title, subtitle, linePlain, lineRich);

  const introSection = document.createElement("section");
  introSection.className = "timeline-vertical-intro";
  introSection.setAttribute("aria-labelledby", "timeline-intro-heading");
  introSection.appendChild(introInner);

  timelineWrap.insertBefore(introSection, timelineWrap.firstChild);

  const statusHost = document.querySelector("[data-status]");
  if (statusHost) statusHost.replaceChildren();
}

// -----------------------------------------------------------------------------
// Bootstrap
// Merges data, mounts the timeline and popover on #timeline-vertical, wires outside-click
// and scroll-to-close; loading/errors via setStatus, intro mounted into the card on success.
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

    attachPopoverGlobalListeners(popover, onOutsidePointerDown);
    window.addEventListener(
      "scroll",
      () => {
        if (!popover.el.hidden) hideEventPopover(popover);
      },
      { passive: true }
    );

    setTimelineIntroComplete({
      concertCount: CONCERT_EVENTS.length,
      dateCount: merged.length,
    });
  } catch (err) {
    console.error(err);
    setStatus(`Failed to render timeline: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main();
