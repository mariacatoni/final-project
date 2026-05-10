// Synchronous fallback: works from file:// and when ES modules fail.

(() => {
  const coverEl = document.getElementById("cover-page");
  const btn = document.getElementById("cover-page-dismiss");
  if (!coverEl || !btn) return;

  function dismissCover() {
    if (coverEl.hidden) return;
    coverEl.hidden = true;
    coverEl.classList.add("cover-page--dismissed");
    coverEl.setAttribute("aria-hidden", "true");
    if ("inert" in coverEl) coverEl.inert = true;
    btn.disabled = true;

    const timeline = document.getElementById("timeline-vertical");
    if (timeline instanceof HTMLElement) {
      timeline.tabIndex = -1;
      timeline.focus({ preventScroll: true });
    }
  }

  btn.addEventListener("click", dismissCover);
})();
