// Lightweight click-to-expand viewer for the decade collage polaroids.
// Builds a single shared <dialog> at the document level. Each click on a
// collage photo just swaps the dialog's <img> source/alt and opens it modal.
// We use the native <dialog> element so we get backdrop, focus trapping,
// and Escape-to-close behavior for free.

// -----------------------------------------------------------------------------
// Module state
// One dialog instance is enough for the whole page. We remember the element
// that opened the lightbox so we can return focus to it on close.
// -----------------------------------------------------------------------------
/** @typedef {{ el: HTMLDialogElement; imgEl: HTMLImageElement; closeBtn: HTMLButtonElement; footerEl: HTMLElement; titleEl: HTMLParagraphElement; yearsEl: HTMLElement }} PhotoLightbox */

/** @type {PhotoLightbox | null} */
let lightbox = null;

/** @type {HTMLElement | null} */
let lastOpenerEl = null;

// -----------------------------------------------------------------------------
// Building the dialog
// Creates the <dialog> markup once and wires close interactions: X button,
// backdrop click (event target === dialog itself), and the dialog's own
// 'close' event (covers Escape and any other dismissal path).
// -----------------------------------------------------------------------------
/** @returns {PhotoLightbox} */
export function createPhotoLightbox() {
  if (lightbox) return lightbox;

  const el = document.createElement("dialog");
  el.className = "photo-lightbox";
  el.setAttribute("aria-label", "Expanded concert photo");

  // Centered popover-style panel (dark header + image + cream footer). Clicking
  // the dialog backdrop (outside the panel) dismisses the lightbox.
  const contentEl = document.createElement("div");
  contentEl.className = "photo-lightbox__content";

  // Panel matches event-detail-popover styling (cream card, dark header bar).
  const panelEl = document.createElement("div");
  panelEl.className = "photo-lightbox__panel";

  const headerEl = document.createElement("div");
  headerEl.className = "photo-lightbox__header";

  const titleEl = document.createElement("p");
  titleEl.className = "photo-lightbox__header-title";
  titleEl.id = "photo-lightbox-dialog-title";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "photo-lightbox__close event-detail-popover-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00D7";

  headerEl.append(titleEl, closeBtn);

  const mediaEl = document.createElement("div");
  mediaEl.className = "photo-lightbox__media";

  const imgEl = document.createElement("img");
  imgEl.className = "photo-lightbox__img";
  imgEl.alt = "";

  const footerEl = document.createElement("div");
  footerEl.className = "photo-lightbox__footer";
  footerEl.hidden = true;

  const yearsEl = document.createElement("p");
  yearsEl.className = "photo-lightbox__years";

  footerEl.appendChild(yearsEl);
  mediaEl.appendChild(imgEl);
  panelEl.append(headerEl, mediaEl, footerEl);
  contentEl.appendChild(panelEl);

  el.setAttribute("aria-labelledby", "photo-lightbox-dialog-title");
  el.appendChild(contentEl);
  document.body.appendChild(el);

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.close();
  });

  // Outside-click: .photo-lightbox__content is full-size and centers the panel,
  // so clicks on the dimmed margin hit the content wrapper—not the <dialog>.
  // Close whenever the click isn't inside the card (same UX as many modals).
  el.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (!panelEl.contains(t)) {
      el.close();
    }
  });

  // Restore focus to whatever opened the lightbox after any close path
  // (Escape, backdrop click, X button, programmatic close).
  el.addEventListener("close", () => {
    if (lastOpenerEl && typeof lastOpenerEl.focus === "function") {
      lastOpenerEl.focus({ preventScroll: true });
    }
    lastOpenerEl = null;
  });

  lightbox = { el, imgEl, closeBtn, footerEl, titleEl, yearsEl };
  return lightbox;
}

// -----------------------------------------------------------------------------
// Showing a photo
// Swaps src/alt on the shared <img> and opens the dialog modal. If the
// caller passes the element that triggered the open, we remember it so we
// can return focus to it on close.
// -----------------------------------------------------------------------------
/**
 * @param {number[]} years sorted calendar years
 * @returns {string} e.g. "Seen in (2007), (2009), and (2012)"; em dash if empty.
 */
function formatYearsSeenLine(years) {
  if (years.length === 0) return "\u2014";
  const y = years.map((n) => `${n}`);
  if (y.length === 1) return `Seen in ${y[0]}`;
  if (y.length === 2) return `Seen in ${y[0]} and ${y[1]}`;
  const last = y[y.length - 1];
  const rest = y.slice(0, -1).join(", ");
  return `Seen in ${rest}, and ${last}`;
}

/**
 * @param {{ artist?: string; years?: number[] }} [caption] Bold artist line + years from timeline data (empty years shows an em dash).
 */
export function openPhotoLightbox(src, alt, openerEl, caption) {
  const lb = createPhotoLightbox();
  lb.imgEl.src = src;
  lb.imgEl.alt = alt ?? "";
  lastOpenerEl = openerEl ?? null;

  const artist = caption?.artist?.trim();
  if (artist) {
    lb.footerEl.hidden = false;
    lb.titleEl.textContent = artist;
    const years = caption?.years ?? [];
    const yearsLine = formatYearsSeenLine(years);
    lb.yearsEl.textContent = yearsLine;
    lb.el.setAttribute(
      "aria-label",
      years.length === 0
        ? `Expanded photo. ${artist}. No years listed in timeline data for this name.`
        : `Expanded photo. ${artist}. ${yearsLine}.`
    );
  } else {
    lb.footerEl.hidden = true;
    lb.titleEl.textContent = "Concert photo";
    lb.yearsEl.textContent = "";
    lb.el.setAttribute("aria-label", "Expanded concert photo");
  }

  if (typeof lb.el.showModal === "function") {
    lb.el.showModal();
  } else {
    // Fallback for very old browsers without <dialog> support: just show it.
    lb.el.setAttribute("open", "");
  }
}
