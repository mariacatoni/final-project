import { getRichDetailForDate } from "./event-rich-details.js";

/** @typedef {{ src: string; alt: string }} RichImage */

/**
 * @param {HTMLElement} richEl
 * @param {RichImage[]} images
 */
function appendRichMediaBlock(richEl, images) {
  if (images.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "event-detail-popover-rich-media";

  if (images.length === 1) {
    const fig = document.createElement("figure");
    fig.className = "event-detail-popover-figure event-detail-popover-figure--solo";
    const im = document.createElement("img");
    im.src = images[0].src;
    im.alt = images[0].alt;
    im.loading = "lazy";
    fig.appendChild(im);
    wrap.appendChild(fig);
    richEl.appendChild(wrap);
    return;
  }

  const root = document.createElement("div");
  root.className = "event-detail-popover-slideshow";
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Concert photos");

  const viewport = document.createElement("div");
  viewport.className = "event-detail-popover-slides-viewport";

  const track = document.createElement("div");
  track.className = "event-detail-popover-slides-track";

  for (const img of images) {
    const slide = document.createElement("div");
    slide.className = "event-detail-popover-slide";
    const fig = document.createElement("figure");
    fig.className = "event-detail-popover-figure";
    const im = document.createElement("img");
    im.src = img.src;
    im.alt = img.alt;
    im.loading = "lazy";
    fig.appendChild(im);
    slide.appendChild(fig);
    track.appendChild(slide);
  }

  const nav = document.createElement("div");
  nav.className = "event-detail-popover-slideshow-nav";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "event-detail-popover-slideshow-btn";
  prev.setAttribute("aria-label", "Previous image");
  prev.textContent = "‹";

  const counter = document.createElement("span");
  counter.className = "event-detail-popover-slideshow-counter";
  counter.setAttribute("aria-live", "polite");

  const next = document.createElement("button");
  next.type = "button";
  next.className = "event-detail-popover-slideshow-btn";
  next.setAttribute("aria-label", "Next image");
  next.textContent = "›";

  let index = 0;
  const n = images.length;

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

/** @typedef {{ el: HTMLDivElement; dateEl: HTMLParagraphElement; listEl: HTMLUListElement; richEl: HTMLDivElement; closeBtn: HTMLButtonElement; scrollEl: HTMLDivElement }} EventPopover */

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
  el.setAttribute("aria-label", "Concert details");
  el.hidden = true;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "event-detail-popover-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00D7";

  const scrollEl = document.createElement("div");
  scrollEl.className = "event-detail-popover-scroll";

  const dateEl = document.createElement("p");
  dateEl.className = "event-detail-popover-date";

  const listEl = document.createElement("ul");
  listEl.className = "event-detail-popover-artists";

  const richEl = document.createElement("div");
  richEl.className = "event-detail-popover-rich";
  richEl.hidden = true;

  scrollEl.append(dateEl, listEl, richEl);
  /* Close after scroll so it stacks above the scroll layer and receives clicks. */
  el.append(scrollEl, closeBtn);

  /** @type {EventPopover} */
  const popover = { el, dateEl, listEl, richEl, closeBtn, scrollEl };
  const onClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!popover.el.hidden) hideEventPopover(popover);
  };
  closeBtn.addEventListener("pointerdown", onClose, true);
  closeBtn.addEventListener("click", onClose);
  return popover;
}

/**
 * @param {EventPopover} popover
 * @param {MouseEvent} pointerEvent
 * @param {HTMLElement} anchorEl
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
export function showEventPopover(popover, ev, anchorEl, pointerEvent) {
  activeDotEl = anchorEl;
  popover.dateEl.textContent = formatDisplayDate(ev.date);
  popover.listEl.replaceChildren();
  for (const name of ev.artists) {
    const li = document.createElement("li");
    li.textContent = name;
    popover.listEl.appendChild(li);
  }

  const detail = getRichDetailForDate(ev.date);
  const { richEl } = popover;
  richEl.replaceChildren();

  if (detail) {
    popover.el.classList.add("event-detail-popover--rich");
    richEl.hidden = false;

    appendRichMediaBlock(richEl, detail.images ?? []);

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
  });
}

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
}
