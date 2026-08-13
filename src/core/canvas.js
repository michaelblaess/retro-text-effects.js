import { resolveTarget, getText } from './dom.js';
import { toLines, toCells, isBlank } from './text.js';

// Shared engine for the canvas effects: lays an opaque canvas over the target,
// mirrors its font/colour/character grid, and drives a delta-time animation loop
// that ends in a short fade-out revealing the untouched text below. The text
// effects never import this file - it is only pulled in by effects that need
// free 2D character movement (fireworks, blackhole, rain, ...).

/** Bright accent colours for sparks, balls and burst debris. */
export const SPARK_COLORS = ['#ff5555', '#ffd700', '#66aaff', '#ff66cc', '#66dd88'];

/**
 * Cubic ease-out.
 * @param {number} t - progress 0..1
 * @returns {number}
 */
export function easeOutCubic(t) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/**
 * Clamps a number into [0, 1].
 * @param {number} t
 * @returns {number}
 */
export function clamp01(t) {
  if (t < 0) {
    return 0;
  }
  if (t > 1) {
    return 1;
  }
  return t;
}

/**
 * Creates the canvas stage over the target element.
 * @param {Element|string} target
 * @returns {{
 *   ctx: CanvasRenderingContext2D,
 *   canvas: HTMLCanvasElement,
 *   width: number, height: number,
 *   cellW: number, cellH: number, ascent: number,
 *   originX: number, originY: number,
 *   color: string,
 *   targets: Array<{ch: string, x: number, y: number}>,
 *   clear: (alpha?: number) => void,
 *   drawChar: (ch: string, x: number, y: number, fill?: string) => void,
 *   remove: () => void,
 * }}
 */
export function createStage(target) {
  const host = resolveTarget(target);
  const finalText = getText(host);

  const parent = host.parentNode || host;
  const previousPosition = parent.style.position;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const style = getComputedStyle(host);
  const fontSize = parseFloat(style.fontSize) || 16;
  const lineHeightRaw = parseFloat(style.lineHeight);
  const cellH = Number.isNaN(lineHeightRaw) ? Math.round(fontSize * 1.4) : lineHeightRaw;
  const padX = parseFloat(style.paddingLeft) || 0;
  const padY = parseFloat(style.paddingTop) || 0;
  // The canvas is placed on the border box, so the border counts towards the
  // origin - without it the whole grid sits a border width up and to the left.
  const borderX = parseFloat(style.borderLeftWidth) || 0;
  const borderY = parseFloat(style.borderTopWidth) || 0;
  const font = `${fontSize}px ${style.fontFamily}`;
  const color = style.color || '#33ff33';

  const width = Math.max(1, host.offsetWidth);
  const height = Math.max(1, host.offsetHeight);
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.cssText =
    `position:absolute;left:${host.offsetLeft}px;top:${host.offsetTop}px;`
    + `width:${width}px;height:${height}px;z-index:10;pointer-events:none;`;
  // Mirror the rounded corners of the target so the opaque black overlay does not
  // spill out over the host's border-radius. Copy the four longhands individually
  // because elliptical radii ("12px 8px") break when squeezed into the shorthand.
  canvas.style.borderTopLeftRadius = style.borderTopLeftRadius;
  canvas.style.borderTopRightRadius = style.borderTopRightRadius;
  canvas.style.borderBottomRightRadius = style.borderBottomRightRadius;
  canvas.style.borderBottomLeftRadius = style.borderBottomLeftRadius;
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.textBaseline = 'alphabetic';

  const metrics = ctx.measureText('M');
  const cellW = metrics.width || fontSize * 0.6;
  // A line box is taller than the glyphs, and CSS splits the difference above and
  // below them (half-leading). Without that the canvas text sits a few pixels
  // higher than the DOM text and the block visibly jumps when the effect starts.
  // 'alphabetic' is the only unambiguous baseline: 'top' means the em square in
  // Chrome and the font bounding box elsewhere.
  const ascent = typeof metrics.fontBoundingBoxAscent === 'number'
    ? metrics.fontBoundingBoxAscent
    : fontSize * 0.8;
  const descent = typeof metrics.fontBoundingBoxDescent === 'number'
    ? metrics.fontBoundingBoxDescent
    : fontSize * 0.2;
  const halfLeading = (cellH - (ascent + descent)) / 2;

  // Origin of the character grid: everything an effect positions - glyphs, balls,
  // beams - is measured from here, so the whole stage lines up with the text.
  const originX = borderX + padX;
  // Snap so the baseline lands on a whole pixel, half-pixels downwards - that is
  // where the browser puts it too, and a fractional baseline rasterises a row off.
  const originY = Math.ceil(borderY + padY + halfLeading + ascent - 0.5) - ascent;

  // Landing position of every visible character of the final text, in reading order.
  const targets = [];
  const rows = toLines(finalText);
  for (let r = 0; r < rows.length; r += 1) {
    const cells = toCells(rows[r]);
    for (let c = 0; c < cells.length; c += 1) {
      if (!isBlank(cells[c])) {
        targets.push({ ch: cells[c], x: originX + c * cellW, y: originY + r * cellH });
      }
    }
  }

  return {
    ctx,
    canvas,
    width,
    height,
    cellW,
    cellH,
    ascent,
    originX,
    originY,
    color,
    targets,

    clear(alpha) {
      ctx.fillStyle = alpha === undefined ? '#000000' : `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
    },

    // y is the top of the character's line box content, as in the targets above -
    // the baseline offset is applied here so effects never deal with it.
    drawChar(ch, x, y, fill) {
      ctx.font = font;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = fill || color;
      ctx.fillText(ch, x, y + ascent);
    },

    remove() {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      parent.style.position = previousPosition;
    },
  };
}

/**
 * Drives a canvas effect: creates the stage, calls setup(stage) once to obtain
 * the per-frame callback, runs it until it returns false, then fades the canvas
 * out and reveals the untouched text.
 * The frame callback receives (elapsedMs, dtMs) and returns true to keep going.
 * @param {Element|string} target
 * @param {{ onDone?: () => void }} options
 * @param {(stage: object) => (elapsed: number, dt: number) => boolean} setup
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function animateStage(target, options, setup) {
  const stage = createStage(target);
  const opts = options || {};

  let raf = null;
  let cancelled = false;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  function finish() {
    if (cancelled) {
      return;
    }
    cancelled = true;
    stage.remove();
    if (opts.onDone) {
      opts.onDone();
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
      stage.canvas.style.opacity = String(opacity);
      raf = requestAnimationFrame(fade);
    }
    fade();
  }

  stage.clear();
  const frame = setup(stage);
  let start = 0;
  let last = 0;

  function tick(now) {
    if (cancelled) {
      return;
    }
    if (start === 0) {
      start = now;
      last = now;
    }
    // Cap dt so a throttled background tab does not teleport the physics.
    const dt = Math.min(64, now - last);
    last = now;
    if (frame(now - start, dt)) {
      raf = requestAnimationFrame(tick);
    } else {
      fadeOut();
    }
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
      stage.remove();
      resolveFinished();
    },
  };
}
