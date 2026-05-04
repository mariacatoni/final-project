// Scroll-scrubbed reveal: each element gets --reveal-progress from 0 (offset start pose)
// to 1 (final pose) based on how far it has moved through a viewport band. Scrolling back
// up lowers progress so photos drift back to their start offset.

/**
 * @param {number} startY
 * @param {number} h
 * @param {number} span
 * @param {Element} measureEl
 */
function progressForElementTop(startY, h, span, measureEl) {
  const top = measureEl.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, (startY - top) / (h * span)));
}

/**
 * @param {Iterable<Element>} elements
 * @param {object} [options]
 * @param {number} [options.startViewportRatio=0.9] - Progress stays 0 while the element’s top
 *   is below this fraction of the viewport height (element still low on the page).
 * @param {number} [options.endViewportRatio=0.28] - Progress reaches 1 once the element’s top
 *   is above this fraction (higher on screen). Must be less than startViewportRatio.
 */
export function bindScrollReveal(elements, options = {}) {
  const { startViewportRatio = 0.9, endViewportRatio = 0.28 } = options;

  const targets = [...elements];
  if (targets.length === 0) return () => {};

  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const span = Math.max(1e-6, startViewportRatio - endViewportRatio);

  function update() {
    const h = window.innerHeight;
    const startY = h * startViewportRatio;

    if (reduced) {
      for (const el of targets) el.style.setProperty("--reveal-progress", "1");
      return;
    }

    for (const el of targets) {
      const p = progressForElementTop(startY, h, span, el);
      el.style.setProperty("--reveal-progress", p.toFixed(4));
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  update();

  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
}

/**
 * Like bindScrollReveal, but progress is computed once per group from `groupRoot`’s top, then
 * applied to every matching descendant. Keeps stacked items (e.g. two polaroids in one decade)
 * moving in lockstep.
 *
 * @param {Iterable<Element>} groupRoots - Elements whose bounding box drives the scroll band (e.g. `.decade-header-collage`).
 * @param {string} progressTargetsSelector - Descendants inside each group that receive `--reveal-progress`.
 * @param {object} [options] - Same ratios as bindScrollReveal.
 */
export function bindScrollRevealGrouped(groupRoots, progressTargetsSelector, options = {}) {
  const { startViewportRatio = 0.9, endViewportRatio = 0.28 } = options;

  const groups = [...groupRoots];
  if (groups.length === 0) return () => {};

  /** @type {Element[]} */
  const allTargets = [];
  for (const g of groups) {
    allTargets.push(...g.querySelectorAll(progressTargetsSelector));
  }

  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const span = Math.max(1e-6, startViewportRatio - endViewportRatio);

  function update() {
    const h = window.innerHeight;
    const startY = h * startViewportRatio;

    if (reduced) {
      for (const el of allTargets) el.style.setProperty("--reveal-progress", "1");
      return;
    }

    const pStr = (/** @type {number} */ p) => p.toFixed(4);
    for (const group of groups) {
      const p = progressForElementTop(startY, h, span, group);
      const s = pStr(p);
      for (const el of group.querySelectorAll(progressTargetsSelector)) {
        el.style.setProperty("--reveal-progress", s);
      }
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  update();

  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
}
