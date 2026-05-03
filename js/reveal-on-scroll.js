// Small utility: watch a set of elements and add a "revealed" class when
// each one enters the viewport. One-shot (unobserve after reveal) so the
// reveal doesn't re-trigger as the user scrolls back and forth.

/**
 * Observe elements and toggle a reveal class when they intersect the viewport.
 *
 * @param {Iterable<Element>} elements - Elements to watch (e.g. NodeList or array).
 * @param {object} [options]
 * @param {string} [options.rootMargin="0px 0px -10% 0px"] - IntersectionObserver rootMargin. The negative
 *   bottom margin fires the reveal slightly before the element is fully on screen, which feels nicer.
 * @param {number | number[]} [options.threshold=0] - IntersectionObserver threshold.
 * @param {string} [options.revealedClass="is-revealed"] - Class added to each element when it becomes visible.
 */
export function observeReveal(elements, options = {}) {
  const {
    rootMargin = "0px 0px -10% 0px",
    threshold = 0,
    revealedClass = "is-revealed",
  } = options;

  const targets = [...elements];
  if (targets.length === 0) return;

  // Fallback for older browsers without IntersectionObserver: reveal everything immediately.
  if (typeof IntersectionObserver === "undefined") {
    for (const el of targets) el.classList.add(revealedClass);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(revealedClass);
        // One-shot: once revealed, stop watching that element.
        obs.unobserve(entry.target);
      }
    },
    { rootMargin, threshold }
  );

  for (const el of targets) observer.observe(el);
}
