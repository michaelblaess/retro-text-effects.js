import { resolveTarget } from '../core/dom.js';

// Highlight: runs a single specular highlight across the text. The glyphs keep
// their own colour while one bright band travels over them once (via a moving
// background-clip:text gradient), then the original styling is restored. Great as
// a one-shot "sheen" over an already-visible console.

/**
 * @param {Element|string} target
 * @param {{
 *   color?: string,
 *   speed?: number,
 *   direction?: 'left'|'right',
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function highlight(target, options = {}) {
  const host = resolveTarget(target);
  const speed = options.speed || 1;
  const light = options.color || '#ffffff';
  const rightward = options.direction !== 'left';
  const base = getComputedStyle(host).color || '#33ff33';
  const duration = 1200 / speed;

  const previous = {
    backgroundImage: host.style.backgroundImage,
    backgroundSize: host.style.backgroundSize,
    backgroundRepeat: host.style.backgroundRepeat,
    backgroundPosition: host.style.backgroundPosition,
    backgroundClip: host.style.backgroundClip,
    webkitBackgroundClip: host.style.webkitBackgroundClip,
    webkitTextFillColor: host.style.webkitTextFillColor,
    color: host.style.color,
  };

  // Basisfarbe ueberall, nur ein schmales helles Band in der Mitte des Bildes.
  host.style.backgroundImage =
    `linear-gradient(100deg, ${base} 42%, ${light} 50%, ${base} 58%)`;
  host.style.backgroundSize = '300% 100%';
  host.style.backgroundRepeat = 'no-repeat';
  host.style.backgroundClip = 'text';
  host.style.webkitBackgroundClip = 'text';
  host.style.webkitTextFillColor = 'transparent';
  host.style.color = 'transparent';

  const from = rightward ? 130 : -30;
  const to = rightward ? -30 : 130;

  let raf = null;
  let cancelled = false;
  let start = 0;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  function restore() {
    host.style.backgroundImage = previous.backgroundImage;
    host.style.backgroundSize = previous.backgroundSize;
    host.style.backgroundRepeat = previous.backgroundRepeat;
    host.style.backgroundPosition = previous.backgroundPosition;
    host.style.backgroundClip = previous.backgroundClip;
    host.style.webkitBackgroundClip = previous.webkitBackgroundClip;
    host.style.webkitTextFillColor = previous.webkitTextFillColor;
    host.style.color = previous.color;
  }

  function tick(now) {
    if (cancelled) {
      return;
    }
    if (start === 0) {
      start = now;
    }
    const p = Math.min(1, (now - start) / duration);
    host.style.backgroundPosition = `${from + (to - from) * p}% 0`;

    if (p >= 1) {
      cancelled = true;
      restore();
      if (options.onDone) {
        options.onDone();
      }
      resolveFinished();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  return {
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
      restore();
      resolveFinished();
    },
  };
}
