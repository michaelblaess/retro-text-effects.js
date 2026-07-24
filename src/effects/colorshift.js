import { resolveTarget } from '../core/dom.js';

// Colorshift: a persistent style treatment - like crt, it does not animate the
// text but paints an animated multi-colour gradient across the glyphs (via
// background-clip:text) that keeps sliding back and forth. cancel() removes it and
// restores the original colours.

const STYLE_ID = 'rte-colorshift-style';
const DEFAULT_COLORS = ['#33ff33', '#66ddff', '#ff66cc', '#ffd700', '#33ff33'];

function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    '@keyframes rte-colorshift{0%{background-position:0% 50%}'
    + '50%{background-position:100% 50%}100%{background-position:0% 50%}}';
  document.head.appendChild(style);
}

/**
 * @param {Element|string} target
 * @param {{
 *   colors?: string[],
 *   speed?: number,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function colorshift(target, options = {}) {
  const host = resolveTarget(target);
  const colors = options.colors && options.colors.length > 1 ? options.colors : DEFAULT_COLORS;
  const speed = options.speed || 1;
  const duration = (6 / speed).toFixed(2);

  ensureKeyframes();

  const previous = {
    backgroundImage: host.style.backgroundImage,
    backgroundSize: host.style.backgroundSize,
    backgroundClip: host.style.backgroundClip,
    webkitBackgroundClip: host.style.webkitBackgroundClip,
    webkitTextFillColor: host.style.webkitTextFillColor,
    color: host.style.color,
    animation: host.style.animation,
  };

  host.style.backgroundImage = `linear-gradient(90deg, ${colors.join(', ')})`;
  host.style.backgroundSize = '200% 200%';
  host.style.backgroundClip = 'text';
  host.style.webkitBackgroundClip = 'text';
  host.style.webkitTextFillColor = 'transparent';
  host.style.color = 'transparent';
  host.style.animation = `rte-colorshift ${duration}s linear infinite`;

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
      host.style.backgroundImage = previous.backgroundImage;
      host.style.backgroundSize = previous.backgroundSize;
      host.style.backgroundClip = previous.backgroundClip;
      host.style.webkitBackgroundClip = previous.webkitBackgroundClip;
      host.style.webkitTextFillColor = previous.webkitTextFillColor;
      host.style.color = previous.color;
      host.style.animation = previous.animation;
      resolveFinished();
    },
  };
}
