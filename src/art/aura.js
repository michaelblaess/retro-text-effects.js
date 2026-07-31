// Aura: ein Dauerlaeufer. Ein Unicode-Zeichen wird zur ASCII-Figur und von einem
// Ring aus Terminalzeichen umgeben, der sich bewegt. Anders als alle anderen
// Effekte erzeugt dieser den Text erst selbst und laeuft danach weiter, bis
// cancel() ihn beendet.
//
// Zwei Ebenen liegen uebereinander: die Figur und die Aura. Die Figur wird nur
// angefasst, wenn sich Stellung oder Zeilenversatz aendern, die Aura jeden Frame.

import { resolveTarget } from '../core/dom.js';
import { createLoop } from '../core/loop.js';
import { toRgba } from '../core/color.js';
import { measureAdvance } from './metrics.js';
import {
  drawEmoji, boxOf, sampleGrid, gridToLines, ALPHA_ON, EMOJI_FONT,
} from './emoji.js';

/** Zeichenrampe der Aura, von schwach nach kraeftig. */
export const AURA_RAMP = '·~o+=*x%';

/** Abstand zwischen Figur und Aura, in Zeilenhoehen. */
const GAP = 1.15;
const TAU = Math.PI * 2;

/** Stellungen einer Bewegungsschleife. */
const FRAMES = 16;

/** Huepfweite je Bewegungsart, in Zeilen. */
const BOB = { off: 0, float: 2, spin: 1 };

/** Rand um die Figur, damit sie beim Kippen nicht am Rasterrand anschlaegt. */
const TILT_MARGIN = 0.11;

/**
 * Helligkeitsfunktionen der Aura. Jede bekommt Abstand, Winkel, Zellposition,
 * Zeit, einen festen Zufallswert der Zelle und die Aura-Breite.
 */
const VARIANTS = {
  // Jede Zelle flackert unabhaengig - der Klassiker von ghostty.org.
  shimmer: (d, angle, x, y, t, rnd) => 0.58 + 0.42 * Math.sin(t * 5.5 + rnd * 40),

  // Helligkeit als Funktion des Abstands, die Aura atmet nach aussen.
  pulse: (d, angle, x, y, t) => 0.45 + 0.55 * Math.sin(t * 2.1 - d * 1.15),

  // Zwei Ringe loesen sich periodisch von der Figur.
  sonar: (d, angle, x, y, t, rnd, ext) => {
    const span = ext + 1.2;
    const a = ((t * 0.55) % 1) * span;
    const b = ((t * 0.55 + 0.5) % 1) * span;
    const ia = Math.exp(-((d - a) * (d - a)) / 0.55);
    const ib = Math.exp(-((d - b) * (d - b)) / 0.55) * 0.7;
    return 0.12 + 0.88 * Math.max(ia, ib);
  },

  // Ein Lichtbogen kreist um die Figur.
  orbit: (d, angle, x, y, t) => {
    const c = Math.cos(angle - t * 1.3);
    return 0.18 + 0.82 * (c > 0 ? c * c * c : 0);
  },

  // Rauschfeld, das nach oben driftet.
  updraft: (d, angle, x, y, t, rnd) => {
    const s = Math.sin(y * 0.9 + t * 4.2 + rnd * 12) * Math.cos(x * 0.55 - t * 0.7);
    return 0.4 + 0.6 * (0.5 + 0.5 * s);
  },

  // Ohne Bewegung, nur der gestufte Abstand.
  halo: () => 1,
};

/** Verfuegbare Aura-Varianten. */
export const auraVariants = Object.keys(VARIANTS);

/** Verfuegbare Bewegungsarten. */
export const auraMotions = ['off', 'float', 'spin'];

/**
 * Stellung u (0..1) der Bewegungsschleife.
 * 'float' neigt die Figur, 'spin' staucht sie horizontal - das liest sich wie
 * eine Drehung um die Hochachse, bei negativem Kosinus spiegelt sie von selbst.
 */
function motionAt(motion, u) {
  if (motion === 'spin') {
    const c = Math.cos(u * TAU);
    return { angle: 0, scaleX: Math.abs(c) < 0.07 ? Math.sign(c) * 0.07 || 0.07 : c };
  }
  if (motion === 'float') {
    return { angle: 0.15 * Math.sin(u * TAU), scaleX: 1 };
  }
  return { angle: 0, scaleX: 1 };
}

/**
 * Rastergeometrie. Winkel und Zufallswert haengen nur an der Geometrie und
 * werden deshalb einmal je Gruppe berechnet, nicht je Stellung.
 */
function makeGroup(box, config) {
  const { cols, aspect, ext, bob, ramp } = config;
  const cw = box.bw / cols;
  const ch = cw / aspect;
  const rows = Math.max(1, Math.round(box.bh / ch));
  const padX = Math.ceil(ext / aspect) + 1;
  const padY = Math.ceil(ext) + 1 + bob;
  const W = cols + 2 * padX;
  const H = rows + 2 * padY;

  const angle = new Float32Array(W * H);
  const rnd = new Float32Array(W * H);
  const cx = padX + cols / 2;
  const cy = padY + rows / 2;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      angle[i] = Math.atan2(y - cy, (x - cx) * aspect);
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      rnd[i] = h - Math.floor(h);
    }
  }

  return {
    cols, rows, aspect, ext, ramp,
    W, H, padX, padY,
    angle, rnd,
    blank: ' '.repeat(W),
    frames: [],
  };
}

/** Distanzfeld nach aussen, zwei Chamfer-Durchlaeufe. */
function distanceField(cov, W, H, aspect) {
  const INF = 1e9;
  const wH = aspect;
  const wD = Math.sqrt(aspect * aspect + 1);
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) {
    dist[i] = cov[i] >= ALPHA_ON ? 0 : INF;
  }

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      if (x > 0 && dist[i - 1] + wH < dist[i]) {
        dist[i] = dist[i - 1] + wH;
      }
      if (y > 0 && dist[i - W] + 1 < dist[i]) {
        dist[i] = dist[i - W] + 1;
      }
      if (x > 0 && y > 0 && dist[i - W - 1] + wD < dist[i]) {
        dist[i] = dist[i - W - 1] + wD;
      }
      if (x < W - 1 && y > 0 && dist[i - W + 1] + wD < dist[i]) {
        dist[i] = dist[i - W + 1] + wD;
      }
    }
  }
  for (let y = H - 1; y >= 0; y -= 1) {
    for (let x = W - 1; x >= 0; x -= 1) {
      const i = y * W + x;
      if (x < W - 1 && dist[i + 1] + wH < dist[i]) {
        dist[i] = dist[i + 1] + wH;
      }
      if (y < H - 1 && dist[i + W] + 1 < dist[i]) {
        dist[i] = dist[i + W] + 1;
      }
      if (x < W - 1 && y < H - 1 && dist[i + W + 1] + wD < dist[i]) {
        dist[i] = dist[i + W + 1] + wD;
      }
      if (x > 0 && y < H - 1 && dist[i + W - 1] + wD < dist[i]) {
        dist[i] = dist[i + W - 1] + wD;
      }
    }
  }
  return dist;
}

/** Eine Stellung in Figurzeilen und Distanzfeld uebersetzen. */
function sampleFrame(pixels, box, g) {
  const grid = sampleGrid(pixels, box, { cols: g.cols, aspect: g.aspect });
  const lines = gridToLines(grid, { ramp: g.ramp, trim: false });
  const left = ' '.repeat(g.padX);
  const right = ' '.repeat(g.W - g.padX - g.cols);

  const bodyLines = [];
  for (let y = 0; y < g.H; y += 1) {
    const r = y - g.padY;
    bodyLines.push(r >= 0 && r < grid.rows ? left + lines[r] + right : g.blank);
  }

  const cov = new Float32Array(g.W * g.H);
  for (let r = 0; r < grid.rows && r < g.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      cov[(r + g.padY) * g.W + (c + g.padX)] = grid.cov[r * grid.cols + c];
    }
  }

  return { bodyLines, dist: distanceField(cov, g.W, g.H, g.aspect) };
}

const groupCache = new Map();

/**
 * Alle Stellungen bauen. Jede wird genau einmal gezeichnet - getImageData ist
 * der teure Teil, das Abtasten danach ist billig.
 */
function buildGroup(config) {
  const key = [
    config.emoji, config.cols, config.aspect.toFixed(3),
    config.ext, config.motion, config.ramp, config.font,
  ].join('|');
  if (groupCache.has(key)) {
    return groupCache.get(key);
  }

  const box = boxOf(drawEmoji(config.emoji, { font: config.font }), TILT_MARGIN);
  let group = null;
  if (box !== null) {
    group = makeGroup(box, {
      cols: config.cols,
      aspect: config.aspect,
      ext: config.ext,
      ramp: config.ramp,
      bob: BOB[config.motion] || 0,
    });
    const count = config.motion === 'off' ? 1 : FRAMES;
    for (let k = 0; k < count; k += 1) {
      const pose = motionAt(config.motion, k / count);
      const pixels = drawEmoji(config.emoji, {
        angle: pose.angle,
        scaleX: pose.scaleX,
        font: config.font,
      });
      group.frames.push(sampleFrame(pixels, box, group));
    }
  }

  // Der Cache haelt ganze Stellungssaetze, deshalb frueh begrenzen.
  if (groupCache.size > 8) {
    groupCache.clear();
  }
  groupCache.set(key, group);
  return group;
}

/** Aura-Zeilen fuer eine Stellung und einen Zeitpunkt. */
function auraLines(g, dist, fn, t) {
  const span = g.ext - GAP;
  const last = AURA_RAMP.length - 1;
  const out = [];
  for (let y = 0; y < g.H; y += 1) {
    let line = '';
    for (let x = 0; x < g.W; x += 1) {
      const i = y * g.W + x;
      const d = dist[i];
      if (d < GAP || d > g.ext) {
        line += ' ';
        continue;
      }
      // Steiler Abfall, sonst franst die Aura in den weiten Flaechen zu Rauschen aus.
      const f = Math.pow(1 - (d - GAP) / span, 1.7);
      const v = f * fn(d, g.angle[i], x, y, t, g.rnd[i], g.ext);
      if (v <= 0.18) {
        line += ' ';
        continue;
      }
      line += AURA_RAMP.charAt(Math.min(last, Math.floor(v * AURA_RAMP.length)));
    }
    out.push(line);
  }
  return out;
}

/** Zeilen um dy verschieben. Das ist das Huepfen, ganzzahlig im Raster. */
function shifted(lines, dy, g) {
  if (dy === 0) {
    return lines.join('\n');
  }
  const out = [];
  for (let y = 0; y < g.H; y += 1) {
    const s = y - dy;
    out.push(s >= 0 && s < g.H ? lines[s] : g.blank);
  }
  return out.join('\n');
}

function makeLayer() {
  const el = document.createElement('span');
  el.style.cssText = 'grid-area:1/1;white-space:pre;font-family:inherit;';
  return el;
}

/**
 * Setzt ein Unicode-Zeichen als leuchtende ASCII-Figur in das Zielelement und
 * laesst die Aura dauerhaft laufen.
 * @param {Element|string} target
 * @param {{
 *   emoji?: string,
 *   cols?: number,
 *   variant?: string,
 *   motion?: string,
 *   width?: number,
 *   speed?: number,
 *   color?: string,
 *   ramp?: string,
 *   lineHeight?: number,
 *   fit?: boolean,
 *   maxFontSize?: number,
 *   fps?: number,
 *   font?: string,
 *   respectReducedMotion?: boolean,
 * }} [options]
 * @returns {{
 *   finished: Promise<void>,
 *   cancel: () => void,
 *   update: (patch: object) => void,
 *   text: () => string,
 * }}
 */
export function aura(target, options = {}) {
  const host = resolveTarget(target);
  const style = getComputedStyle(host);

  const opts = {
    emoji: options.emoji || '\u{1F47B}',
    cols: options.cols || 40,
    variant: VARIANTS[options.variant] ? options.variant : 'shimmer',
    motion: auraMotions.indexOf(options.motion) >= 0 ? options.motion : 'float',
    width: options.width || 4.5,
    speed: options.speed || 1,
    color: options.color || style.color || '#33ff33',
    ramp: options.ramp,
    lineHeight: options.lineHeight || 1.06,
    fit: options.fit !== false,
    maxFontSize: options.maxFontSize || 22,
    fps: options.fps || 24,
    font: options.font || EMOJI_FONT,
  };

  const reduced =
    options.respectReducedMotion !== false
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    opts.motion = 'off';
  }

  const fontFamily = style.fontFamily || 'monospace';
  const advance = measureAdvance(fontFamily);
  const aspect = advance / opts.lineHeight;

  const stage = document.createElement('span');
  stage.style.cssText = `display:grid;justify-content:center;line-height:${opts.lineHeight};`;
  const bodyEl = makeLayer();
  const glowEl = makeLayer();
  glowEl.setAttribute('aria-hidden', 'true');
  stage.appendChild(bodyEl);
  stage.appendChild(glowEl);

  function applyColor() {
    bodyEl.style.color = opts.color;
    bodyEl.style.textShadow = `0 0 6px ${toRgba(opts.color, 0.4)}`;
    glowEl.style.color = toRgba(opts.color, 0.42);
    glowEl.style.textShadow = `0 0 8px ${toRgba(opts.color, 0.28)}`;
  }
  applyColor();

  const previousChildren = Array.prototype.slice.call(host.childNodes);
  previousChildren.forEach((node) => host.removeChild(node));
  host.appendChild(stage);

  let group = null;
  let stamp = '';
  let visible = true;
  let t = 0;

  function fit() {
    if (group === null) {
      return;
    }
    const cs = getComputedStyle(host);
    const inner = host.getBoundingClientRect().width
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (inner <= 0) {
      return;
    }
    const wanted = opts.fit
      ? inner / (group.W * advance)
      : parseFloat(cs.fontSize) || 14;
    stage.style.fontSize = `${Math.min(opts.maxFontSize, Math.max(2.5, wanted)).toFixed(2)}px`;
  }

  function rebuild() {
    group = buildGroup({
      emoji: opts.emoji,
      cols: opts.cols,
      aspect,
      ext: opts.width,
      motion: opts.motion,
      ramp: opts.ramp,
      font: opts.font,
    });
    stamp = '';
    if (group === null) {
      bodyEl.textContent = '';
      glowEl.textContent = '';
      return;
    }
    fit();
  }

  function render(time) {
    if (group === null || !visible) {
      return;
    }
    const count = group.frames.length;
    let index = 0;
    if (count > 1) {
      const turns = opts.motion === 'spin' ? 0.2 : 0.24;
      let u = (time * turns) % 1;
      if (u < 0) {
        u += 1;
      }
      index = Math.min(count - 1, Math.floor(u * count));
    }
    const amp = BOB[opts.motion] || 0;
    const dy = amp === 0 ? 0 : Math.round(amp * Math.sin(time * TAU * 0.4));
    const frame = group.frames[index];

    // Die Figur nur anfassen, wenn sich Stellung oder Versatz aendern.
    const next = `${index}:${dy}`;
    if (stamp !== next) {
      bodyEl.textContent = shifted(frame.bodyLines, dy, group);
      stamp = next;
    }
    glowEl.textContent = shifted(
      auraLines(group, frame.dist, VARIANTS[opts.variant], time),
      dy,
      group,
    );
  }

  rebuild();

  let observer = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
    }, { rootMargin: '120px' });
    observer.observe(host);
  }

  let resizer = null;
  function onResize() {
    fit();
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizer = new ResizeObserver(onResize);
    resizer.observe(host);
  } else {
    window.addEventListener('resize', onResize);
  }

  let loop = null;
  let resolveStill;
  const stillFinished = new Promise((resolve) => {
    resolveStill = resolve;
  });

  if (reduced) {
    render(0.6);
  } else {
    const stepT = 1 / opts.fps;
    loop = createLoop(() => {
      t += stepT * opts.speed;
      render(t);
      return true;
    }, { fps: opts.fps });
  }

  let cancelled = false;

  function teardown() {
    if (cancelled) {
      return;
    }
    cancelled = true;
    if (observer !== null) {
      observer.disconnect();
    }
    if (resizer !== null) {
      resizer.disconnect();
    } else {
      window.removeEventListener('resize', onResize);
    }
    if (stage.parentNode === host) {
      host.removeChild(stage);
    }
    previousChildren.forEach((node) => host.appendChild(node));
  }

  return {
    finished: loop !== null ? loop.finished : stillFinished,

    cancel() {
      teardown();
      if (loop !== null) {
        loop.cancel();
      } else {
        resolveStill();
      }
    },

    /**
     * Aendert Zeichen, Variante, Bewegung, Farbe oder Aura-Breite im Betrieb.
     * @param {object} patch
     */
    update(patch = {}) {
      const structural = ['emoji', 'cols', 'width', 'motion', 'ramp', 'font'];
      const needsRebuild = structural.some(
        (key) => patch[key] !== undefined && patch[key] !== opts[key],
      );
      Object.keys(patch).forEach((key) => {
        if (patch[key] !== undefined) {
          opts[key] = patch[key];
        }
      });
      if (reduced) {
        opts.motion = 'off';
      }
      if (patch.color !== undefined) {
        applyColor();
      }
      if (needsRebuild) {
        rebuild();
      }
      render(t);
    },

    /** Die Figur als reiner Text, ohne Aura. */
    text() {
      return bodyEl.textContent || '';
    },
  };
}
