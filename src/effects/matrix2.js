import { resolveTarget } from '../core/dom.js';

// Matrix rain as a canvas overlay: a black canvas is laid over the target, katakana
// glyphs rain down for a while, then the canvas fades out to reveal the untouched
// text underneath. This is the ONE effect that uses a canvas - every other effect
// only rewrites textContent. Inspired by the classic falling-glyph screen.

const KATAKANA =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

/**
 * @param {Element|string} target
 * @param {{
 *   duration?: number,
 *   fontSize?: number,
 *   color?: string,
 *   glyphs?: string,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function matrix2(target, options = {}) {
  const host = resolveTarget(target);
  const duration = options.duration || 1500;
  const fontSize = options.fontSize || 20;
  const color = options.color || '#00ff00';
  const glyphs = options.glyphs || KATAKANA;

  const parent = host.parentNode || host;
  const previousPosition = parent.style.position;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const canvas = document.createElement('canvas');
  const width = host.offsetWidth;
  const height = host.offsetHeight;
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  canvas.style.cssText =
    `position:absolute;left:${host.offsetLeft}px;top:${host.offsetTop}px;`
    + `width:${width}px;height:${height}px;z-index:10;pointer-events:none;`;
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const columnCount = Math.max(1, Math.floor(canvas.width / fontSize));
  const columns = [];
  for (let i = 0; i < columnCount; i += 1) {
    columns.push(Math.random() * -100);
  }

  let raf = null;
  let cancelled = false;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  function cleanup() {
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    parent.style.position = previousPosition;
  }

  function finish() {
    if (cancelled) {
      return;
    }
    cancelled = true;
    cleanup();
    if (options.onDone) {
      options.onDone();
    }
    resolveFinished();
  }

  function fadeOut() {
    let opacity = 1;
    function fade() {
      if (cancelled) {
        return;
      }
      opacity -= 0.1;
      if (opacity <= 0) {
        finish();
        return;
      }
      canvas.style.opacity = String(opacity);
      raf = requestAnimationFrame(fade);
    }
    fade();
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const start = performance.now();

  function draw(now) {
    if (cancelled) {
      return;
    }
    // Semi-transparent fill leaves a fading trail behind each glyph.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < columns.length; i += 1) {
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * fontSize;
      const y = columns[i] * fontSize;
      ctx.fillText(glyph, x, y);
      if (y > canvas.height && Math.random() > 0.975) {
        columns[i] = 0;
      }
      columns[i] += 1;
    }

    if (now - start < duration) {
      raf = requestAnimationFrame(draw);
    } else {
      fadeOut();
    }
  }

  raf = requestAnimationFrame(draw);

  return {
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      cleanup();
      resolveFinished();
    },
  };
}
