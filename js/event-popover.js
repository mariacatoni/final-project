// Loads optional long-form copy and images keyed by concert date for the detail pane.
import { getRichDetailForDate } from "./event-rich-details.js";

// -----------------------------------------------------------------------------
// Rich media in the popover
// Builds lazy-loaded <figure>/<img> nodes and either a single image layout or a
// small carousel (prev/next, live counter) when there are multiple photos.
// -----------------------------------------------------------------------------
/**
 * @param {{ src: string; alt: string }} image
 * @param {string} figureClass
 */
function createLazyFigure(image, figureClass) {
  const fig = document.createElement("figure");
  fig.className = figureClass;
  const im = document.createElement("img");
  im.src = image.src;
  im.alt = image.alt;
  im.loading = "lazy";
  fig.appendChild(im);
  return fig;
}

/**
 * @param {import("./event-rich-details.js").RichYoutubeSlide} slide
 * @param {string} figureClass
 */
function createYoutubeFigure(slide, figureClass) {
  const fig = document.createElement("figure");
  fig.className = `${figureClass} event-detail-popover-youtube`;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(slide.videoId)}?rel=0`;
  iframe.title = slide.title;
  iframe.loading = "lazy";
  iframe.setAttribute("allowfullscreen", "");
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  fig.appendChild(iframe);
  return fig;
}

/**
 * @param {import("./event-rich-details.js").RichSlide} slide
 * @param {string} figureClass
 */
function appendSlideFigure(slide, figureClass) {
  if (slide.kind === "image") {
    return createLazyFigure(slide, figureClass);
  }
  return createYoutubeFigure(slide, figureClass);
}

/**
 * @param {HTMLElement} richEl
 * @param {import("./event-rich-details.js").RichSlide[]} slides
 */
function appendRichMediaBlock(richEl, slides) {
  if (slides.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "event-detail-popover-rich-media";

  if (slides.length === 1) {
    wrap.appendChild(
      appendSlideFigure(slides[0], "event-detail-popover-figure event-detail-popover-figure--solo")
    );
    richEl.appendChild(wrap);
    return;
  }

  const root = document.createElement("div");
  root.className = "event-detail-popover-slideshow";
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Concert photos and video");

  const viewport = document.createElement("div");
  viewport.className = "event-detail-popover-slides-viewport";

  const track = document.createElement("div");
  track.className = "event-detail-popover-slides-track";

  for (const item of slides) {
    const slide = document.createElement("div");
    slide.className = "event-detail-popover-slide";
    slide.appendChild(appendSlideFigure(item, "event-detail-popover-figure"));
    track.appendChild(slide);
  }

  const nav = document.createElement("div");
  nav.className = "event-detail-popover-slideshow-nav";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "event-detail-popover-slideshow-btn";
  prev.setAttribute("aria-label", "Previous slide");
  prev.textContent = "‹";

  const counter = document.createElement("span");
  counter.className = "event-detail-popover-slideshow-counter";
  counter.setAttribute("aria-live", "polite");

  const next = document.createElement("button");
  next.type = "button";
  next.className = "event-detail-popover-slideshow-btn";
  next.setAttribute("aria-label", "Next slide");
  next.textContent = "›";

  let index = 0;
  const n = slides.length;

  const applyIndex = () => {
    index = Math.max(0, Math.min(index, n - 1));
    track.style.transform = `translateX(-${index * 100}%)`;
    counter.textContent = `${index + 1} / ${n}`;
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  };

  prev.addEventListener("click", (e) => {
    e.stopPropagation();
    index -= 1;
    applyIndex();
  });
  next.addEventListener("click", (e) => {
    e.stopPropagation();
    index += 1;
    applyIndex();
  });

  nav.append(prev, counter, next);
  viewport.appendChild(track);
  root.append(viewport, nav);
  wrap.appendChild(root);
  richEl.appendChild(wrap);

  applyIndex();
}

// -----------------------------------------------------------------------------
// Date formatting for the UI
// Converts ISO calendar dates (YYYY-MM-DD) to a readable US locale string.
// -----------------------------------------------------------------------------
/**
 * @param {string} isoDate `YYYY-MM-DD`
 * @returns {string} e.g. "April 7, 2000"
 */
export function formatDisplayDate(isoDate) {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return isoDate;
  const dt = new Date(y, m, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// -----------------------------------------------------------------------------
// Popover structure and visibility
// Typedef and activeDotEl track the open dialog and the dot that opened it (for
// focus on close). hideEventPopover hides the dialog; createEventPopover builds
// the markup (header, scroll area, artist list, rich region) and wires the close control.
// -----------------------------------------------------------------------------
/** @typedef {{ el: HTMLDivElement; headerEl: HTMLDivElement; dateEl: HTMLParagraphElement; listEl: HTMLParagraphElement; richEl: HTMLDivElement; closeBtn: HTMLButtonElement; scrollEl: HTMLDivElement }} EventPopover */

/** @type {HTMLButtonElement | null} */
let activeDotEl = null;

/** @param {EventPopover} popover */
export function hideEventPopover(popover) {
  popover.el.hidden = true;
  if (activeDotEl) {
    activeDotEl.focus({ preventScroll: true });
    activeDotEl = null;
  }
}

/** @returns {EventPopover} */
export function createEventPopover() {
  const el = document.createElement("div");
  el.className = "event-detail-popover";
  el.setAttribute("role", "dialog");
  el.hidden = true;

  const headerEl = document.createElement("div");
  headerEl.className = "event-detail-popover-header";

  const dateEl = document.createElement("p");
  dateEl.className = "event-detail-popover-date";
  dateEl.id = "event-detail-popover-title";
  el.setAttribute("aria-labelledby", "event-detail-popover-title");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "event-detail-popover-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00D7";

  headerEl.append(dateEl, closeBtn);

  const scrollEl = document.createElement("div");
  scrollEl.className = "event-detail-popover-scroll";

  const listEl = document.createElement("p");
  listEl.className = "event-detail-popover-artists";

  const richEl = document.createElement("div");
  richEl.className = "event-detail-popover-rich";
  richEl.hidden = true;

  scrollEl.append(listEl, richEl);
  el.append(headerEl, scrollEl);

  /** @type {EventPopover} */
  const popover = { el, headerEl, dateEl, listEl, richEl, closeBtn, scrollEl };
  const onClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!popover.el.hidden) hideEventPopover(popover);
  };
  closeBtn.addEventListener("pointerdown", onClose, true);
  closeBtn.addEventListener("click", onClose);
  return popover;
}

// -----------------------------------------------------------------------------
// Popover placement
// Positions the dialog near the click (or under the anchor if coords missing),
// clamped so it stays inside the visible viewport with a small margin.
// Uses Visual Viewport when available (mobile URL bar / pinch-zoom), and
// getBoundingClientRect so sizing matches the laid-out box after show.
// -----------------------------------------------------------------------------
/** @returns {{ x0: number; y0: number; x1: number; y1: number }} */
function getVisibleViewportRect() {
  const vv = window.visualViewport;
  if (vv) {
    const x0 = vv.offsetLeft;
    const y0 = vv.offsetTop;
    return { x0, y0, x1: x0 + vv.width, y1: y0 + vv.height };
  }
  return { x0: 0, y0: 0, x1: window.innerWidth, y1: window.innerHeight };
}

/** @param {EventPopover} popover */
function clampPopoverIntoView(popover) {
  const { el } = popover;
  const pad = 8;
  const vis = getVisibleViewportRect();
  const box = el.getBoundingClientRect();
  const w = box.width;
  const h = box.height;
  if (w < 1 || h < 1) return;
  let left = box.left;
  let top = box.top;
  const minL = vis.x0 + pad;
  const minT = vis.y0 + pad;
  const maxL = vis.x1 - pad - w;
  const maxT = vis.y1 - pad - h;
  left = Math.max(minL, Math.min(left, maxL));
  top = Math.max(minT, Math.min(top, maxT));
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

/**
 * @param {EventPopover} popover
 * @param {MouseEvent} pointerEvent
 * @param {HTMLElement} anchorEl
 */
function positionPopoverNearPointer(popover, pointerEvent, anchorEl) {
  const { el } = popover;
  let left = pointerEvent.clientX;
  let top = pointerEvent.clientY;
  if (!Number.isFinite(left) || !Number.isFinite(top) || (left === 0 && top === 0)) {
    const anchorRect = anchorEl.getBoundingClientRect();
    left = anchorRect.left;
    top = anchorRect.bottom + 4;
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  clampPopoverIntoView(popover);
}

// -----------------------------------------------------------------------------
// Showing the popover with event + optional rich copy
// Fills date, artist list (with optional setlist links), then rich text/images
// from event-rich-details when available; toggles layout class and visibility.
// -----------------------------------------------------------------------------
/**
 * @param {EventPopover} popover
 * @param {{ date: string; artists: { name: string; setlist?: string }[] }} ev
 * @param {HTMLButtonElement} anchorEl
 * @param {MouseEvent} pointerEvent
 */
export function showEventPopover(popover, ev, anchorEl, pointerEvent) {
  activeDotEl = anchorEl;
  popover.dateEl.textContent = formatDisplayDate(ev.date);
  popover.listEl.replaceChildren();
  const n = ev.artists.length;
  for (let i = 0; i < n; i++) {
    const a = ev.artists[i];
    if (a.setlist) {
      const link = document.createElement("a");
      link.className = "event-detail-popover-artist-link";
      link.href = a.setlist;
      link.textContent = a.name;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      popover.listEl.appendChild(link);
    } else {
      popover.listEl.appendChild(document.createTextNode(a.name));
    }
    if (i < n - 1) {
      popover.listEl.appendChild(document.createTextNode(", "));
    }
  }

  const detail = getRichDetailForDate(ev.date);
  const { richEl } = popover;
  richEl.replaceChildren();

  if (detail) {
    popover.el.classList.add("event-detail-popover--rich");
    richEl.hidden = false;

    appendRichMediaBlock(richEl, detail.slides ?? []);

    if (detail.lead) {
      const lead = document.createElement("p");
      lead.className = "event-detail-popover-lead";
      lead.textContent = detail.lead;
      richEl.appendChild(lead);
    }

    for (const text of detail.bodyParagraphs) {
      const p = document.createElement("p");
      p.className = "event-detail-popover-body";
      p.textContent = text;
      richEl.appendChild(p);
    }
  } else {
    popover.el.classList.remove("event-detail-popover--rich");
    richEl.hidden = true;
  }

  popover.el.hidden = false;
  requestAnimationFrame(() => {
    positionPopoverNearPointer(popover, pointerEvent, anchorEl);
    requestAnimationFrame(() => {
      positionPopoverNearPointer(popover, pointerEvent, anchorEl);
    });
  });
}

// -----------------------------------------------------------------------------
// Global behavior while the popover is used from the timeline
// Outside clicks (handled by caller), Escape, and window resize all close/hide.
// -----------------------------------------------------------------------------
/**
 * @param {EventPopover} popover
 * @param {(e: PointerEvent) => void} onOutsidePointerDown
 */
export function attachPopoverGlobalListeners(popover, onOutsidePointerDown) {
  document.addEventListener("pointerdown", onOutsidePointerDown, true);
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !popover.el.hidden) hideEventPopover(popover);
    },
    true
  );
  window.addEventListener("resize", () => {
    if (!popover.el.hidden) hideEventPopover(popover);
  });
  const vv = window.visualViewport;
  if (vv) {
    const onVvChange = () => {
      if (popover.el.hidden) return;
      clampPopoverIntoView(popover);
    };
    vv.addEventListener("resize", onVvChange);
    vv.addEventListener("scroll", onVvChange);
  }
}
