// Shared audio for decade collage polaroids: one clip at a time, basename-matched MP3s.
// Volume ramps: fade in at start, fade out before natural end.

/** @type {HTMLAudioElement | null} */
let sharedAudio = null;

/** Relative URL (e.g. assets/music/2000s-1.mp3) of the track we last loaded. */
let activeTrack = "";

const FADE_IN_MS = 1500;
const FADE_OUT_MS = 1500;

/** @type {number} */
let volumeRafId = 0;

/** @type {boolean} */
let audioUiHandlersAttached = false;

const GLYPH_PLAY = "\u25B6";
const GLYPH_PAUSE = "\u23F8";

/** Bumps when loading a new `src` so late `canplay` from the previous load is ignored. */
let loadGeneration = 0;

/**
 * @param {string} photoSrc e.g. assets/timeline-photos/2000s-1.jpg
 * @returns {string} e.g. assets/music/2000s-1.mp3
 */
export function musicUrlFromPhotoSrc(photoSrc) {
  const file = photoSrc.replace(/^.*\//, "");
  const base = file.replace(/\.[^.]+$/, "");
  return `assets/music/${base}.mp3`;
}

function getAudio() {
  if (!sharedAudio) sharedAudio = new Audio();
  return sharedAudio;
}

function stopVolumeLoop() {
  if (volumeRafId) {
    cancelAnimationFrame(volumeRafId);
    volumeRafId = 0;
  }
}

/**
 * Drive volume from playback position: ramp up over the first FADE_IN_MS, ramp down
 * in the last FADE_OUT_MS. Works for resume mid-track and very short clips (ramps overlap).
 * @param {HTMLAudioElement} audio
 */
function startVolumeLoop(audio) {
  stopVolumeLoop();
  const fi = FADE_IN_MS / 1000;
  const fo = FADE_OUT_MS / 1000;

  const tick = () => {
    if (audio.paused && !audio.ended) {
      volumeRafId = 0;
      return;
    }

    const t = audio.currentTime;
    const d = audio.duration;

    let v = 1;
    if (Number.isFinite(d) && d > 0) {
      if (t < fi) v = Math.min(v, t / fi);
      const remain = d - t;
      if (remain < fo) v = Math.min(v, remain / fo);
    } else {
      v = 0;
    }

    audio.volume = Math.max(0, Math.min(1, v));

    if (!audio.ended && !audio.paused) {
      volumeRafId = requestAnimationFrame(tick);
    } else {
      volumeRafId = 0;
    }
  };

  volumeRafId = requestAnimationFrame(tick);
}

function syncCollagePlayButtonIcons() {
  const audio = sharedAudio;
  const track = activeTrack;
  const playing = Boolean(audio && !audio.paused && !audio.ended);

  for (const btn of document.querySelectorAll("button.decade-header-collage__play[data-photo-src]")) {
    const raw = btn.dataset.photoSrc;
    if (!raw) continue;
    const btnTrack = musicUrlFromPhotoSrc(raw);
    const isThisTrack = btnTrack === track && track !== "";
    const showPause = isThisTrack && playing;
    btn.classList.toggle("decade-header-collage__play--paused", showPause);
    btn.textContent = showPause ? GLYPH_PAUSE : GLYPH_PLAY;
    btn.setAttribute(
      "aria-label",
      showPause ? "Pause audio clip for this photo" : "Play audio clip for this photo"
    );
  }
}

function attachAudioUiHandlers(audio) {
  if (audioUiHandlersAttached) return;
  audio.addEventListener("play", syncCollagePlayButtonIcons);
  audio.addEventListener("pause", syncCollagePlayButtonIcons);
  audio.addEventListener("ended", () => {
    stopVolumeLoop();
    audio.volume = 1;
    syncCollagePlayButtonIcons();
  });
  audioUiHandlersAttached = true;
}

/**
 * Play the clip for this photo, pause if the same clip is already playing,
 * resume if it is paused, or switch to a new clip.
 * @param {string} photoSrc
 */
export function toggleCollageAudio(photoSrc) {
  const track = musicUrlFromPhotoSrc(photoSrc);
  const audio = getAudio();
  attachAudioUiHandlers(audio);

  if (activeTrack === track && !audio.paused) {
    audio.pause();
    stopVolumeLoop();
    syncCollagePlayButtonIcons();
    return;
  }

  if (activeTrack === track && audio.paused) {
    void audio.play().then(() => {
      startVolumeLoop(audio);
      syncCollagePlayButtonIcons();
    }).catch(() => {});
    return;
  }

  stopVolumeLoop();
  activeTrack = track;
  syncCollagePlayButtonIcons();
  const gen = ++loadGeneration;
  audio.src = track;
  audio.volume = 0;

  const tryPlay = () => {
    if (gen !== loadGeneration) return;
    void audio
      .play()
      .then(() => {
        if (gen !== loadGeneration) return;
        startVolumeLoop(audio);
        syncCollagePlayButtonIcons();
      })
      .catch(() => {
        if (gen !== loadGeneration) return;
        audio.volume = 1;
        syncCollagePlayButtonIcons();
      });
  };

  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    tryPlay();
  } else {
    audio.addEventListener("canplay", tryPlay, { once: true });
  }
}

/**
 * @param {HTMLButtonElement} button
 * @param {string} photoSrc
 */
export function attachCollagePlayButton(button, photoSrc) {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCollageAudio(photoSrc);
  });
}
