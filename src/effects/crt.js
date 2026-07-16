import { resolveTarget } from '../core/dom.js';

// CRT: a persistent retro-monitor treatment - phosphor glow, a subtle scanline
// overlay and a faint flicker. Unlike the other effects this does not animate the
// text; it styles the element and returns a handle you cancel() to remove it again.

const STYLE_ID = 'rte-crt-style';

function ensureFlickerStyle() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = '@keyframes rte-crt-flicker{0%{opacity:.97}50%{opacity:1}100%{opacity:.98}}';
  document.head.appendChild(style);
}

// Turns #rgb / #rrggbb into an rgba() string for the glow; returns the input
// unchanged if it is not a hex colour.
function toGlow(color, alpha) {
  const hex = color.replace('#', '');
  let r;
  let g;
  let b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return color;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * @param {Element|string} target
 * @param {{
 *   color?: string,
 *   scanlineOpacity?: number,
 *   glow?: boolean,
 *   flicker?: boolean,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function crt(target, options = {}) {
  const host = resolveTarget(target);
  const color = options.color || '#33ff33';
  const scanlineOpacity = options.scanlineOpacity === undefined ? 0.15 : options.scanlineOpacity;
  const glow = options.glow !== false;
  const flicker = options.flicker !== false;

  ensureFlickerStyle();

  const previous = {
    position: host.style.position,
    textShadow: host.style.textShadow,
    animation: host.style.animation,
  };

  if (getComputedStyle(host).position === 'static') {
    host.style.position = 'relative';
  }
  if (glow) {
    host.style.textShadow = `0 0 5px ${toGlow(color, 0.5)}, 0 0 10px ${toGlow(color, 0.3)}`;
  }
  if (flicker) {
    host.style.animation = 'rte-crt-flicker 0.15s infinite alternate';
  }

  const scanlines = document.createElement('div');
  scanlines.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2;'
    + `background:repeating-linear-gradient(0deg,rgba(0,0,0,${scanlineOpacity}) 0px,`
    + `rgba(0,0,0,${scanlineOpacity}) 1px,transparent 1px,transparent 2px);`;
  host.appendChild(scanlines);

  let cancelled = false;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  return {
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (scanlines.parentNode) {
        scanlines.parentNode.removeChild(scanlines);
      }
      host.style.position = previous.position;
      host.style.textShadow = previous.textShadow;
      host.style.animation = previous.animation;
      resolveFinished();
    },
  };
}
