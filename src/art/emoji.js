// Rastert ein beliebiges Unicode-Zeichen zu ASCII-Art. Reine Berechnung, keine
// Animation: das Ergebnis ist ein String und laesst sich in jeden Text-Effekt
// kippen (decrypt, matrix, print). Die Aura in aura.js benutzt dieselben
// Bausteine, braucht aber das rohe Raster statt des fertigen Textes.

import { cellAspect } from './metrics.js';

/** Zeichenrampe von duenn nach dicht. */
export const BODY_RAMP = '·~oxX%$@';

/** Farbige Emoji-Schriften der ueblichen Systeme. */
export const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

/** Ab dieser mittleren Deckung gilt eine Zelle als Teil der Figur. */
export const ALPHA_ON = 0.28;

const SIZE = 320;

let canvas = null;
let ctx = null;

function context() {
  if (ctx === null) {
    canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  return ctx;
}

/**
 * Zeichnet das Zeichen einmal auf das Offscreen-Canvas und gibt die Pixel zurueck.
 * Drehung und horizontale Stauchung erzeugen die Stellungen der Bewegung.
 * @param {string} emoji
 * @param {{ angle?: number, scaleX?: number, font?: string }} [options]
 * @returns {Uint8ClampedArray}
 */
export function drawEmoji(emoji, options = {}) {
  const c = context();
  const scaleX = options.scaleX === undefined ? 1 : options.scaleX;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, SIZE, SIZE);
  c.save();
  c.translate(SIZE / 2, SIZE / 2);
  c.rotate(options.angle || 0);
  c.scale(scaleX, 1);
  c.font = `${Math.round(SIZE * 0.72)}px ${options.font || EMOJI_FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, 0, 0);
  c.restore();
  return c.getImageData(0, 0, SIZE, SIZE).data;
}

/**
 * Umschliessendes Rechteck aller sichtbaren Pixel.
 * @param {Uint8ClampedArray} pixels
 * @param {number} [margin] - Rand als Anteil der Kantenlaenge, z.B. 0.11
 * @returns {{ x0: number, y0: number, bw: number, bh: number } | null}
 */
export function boxOf(pixels, margin = 0) {
  let x0 = SIZE;
  let y0 = SIZE;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (pixels[(y * SIZE + x) * 4 + 3] > 16) {
        if (x < x0) {
          x0 = x;
        }
        if (y < y0) {
          y0 = y;
        }
        if (x > x1) {
          x1 = x;
        }
        if (y > y1) {
          y1 = y;
        }
      }
    }
  }
  if (x1 < 0) {
    return null;
  }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const mx = bw * margin;
  const my = bh * margin;
  return { x0: x0 - mx, y0: y0 - my, bw: bw + 2 * mx, bh: bh + 2 * my };
}

/**
 * Legt ein Zellraster ueber den Rahmen und mittelt je Zelle Deckung und Helligkeit.
 * @param {Uint8ClampedArray} pixels
 * @param {{ x0: number, y0: number, bw: number, bh: number }} box
 * @param {{ cols: number, aspect: number }} options
 * @returns {{ cols: number, rows: number, cov: Float32Array, lum: Float32Array }}
 */
export function sampleGrid(pixels, box, options) {
  const cols = Math.max(1, Math.round(options.cols));
  const cw = box.bw / cols;
  const ch = cw / options.aspect;
  const rows = Math.max(1, Math.round(box.bh / ch));
  const cov = new Float32Array(cols * rows);
  const lum = new Float32Array(cols * rows);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = Math.max(0, Math.floor(box.x0 + c * cw));
      const py = Math.max(0, Math.floor(box.y0 + r * ch));
      const ex = Math.min(SIZE, Math.floor(box.x0 + (c + 1) * cw));
      const ey = Math.min(SIZE, Math.floor(box.y0 + (r + 1) * ch));
      let a = 0;
      let l = 0;
      let n = 0;
      for (let y = py; y < ey; y += 1) {
        for (let x = px; x < ex; x += 1) {
          const i = (y * SIZE + x) * 4;
          const av = pixels[i + 3] / 255;
          a += av;
          l += av * (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
          n += 1;
        }
      }
      cov[r * cols + c] = n > 0 ? a / n : 0;
      lum[r * cols + c] = n > 0 ? l / n : 0;
    }
  }

  return { cols, rows, cov, lum };
}

/**
 * Uebersetzt ein Raster in Zeichen. Zellen mit einem Nachbarn ausserhalb der
 * Figur bekommen hart '@' - diese Kante erzeugt die sichtbare Kontur.
 * @param {{ cols: number, rows: number, cov: Float32Array, lum: Float32Array }} grid
 * @param {{ ramp?: string, trim?: boolean }} [options]
 * @returns {string[]}
 */
export function gridToLines(grid, options = {}) {
  const ramp = options.ramp || BODY_RAMP;
  const last = ramp.length - 1;
  const { cols, rows, cov, lum } = grid;
  const lines = [];

  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      if (cov[i] < ALPHA_ON) {
        line += ' ';
        continue;
      }
      const edge =
        c === 0 || c === cols - 1 || r === 0 || r === rows - 1
        || cov[i - 1] < ALPHA_ON || cov[i + 1] < ALPHA_ON
        || cov[i - cols] < ALPHA_ON || cov[i + cols] < ALPHA_ON;
      if (edge) {
        line += '@';
      } else {
        const v = lum[i] / Math.max(cov[i], 0.001);
        const idx = Math.round(v * last);
        line += ramp.charAt(idx < 0 ? 0 : Math.min(idx, last));
      }
    }
    lines.push(options.trim === false ? line : line.replace(/\s+$/, ''));
  }
  return lines;
}

/**
 * Ein Unicode-Zeichen als ASCII-Art.
 * @param {string} emoji - beliebiges Zeichen, z.B. ein Emoji
 * @param {{
 *   cols?: number,
 *   aspect?: number,
 *   fontFamily?: string,
 *   lineHeight?: number,
 *   ramp?: string,
 *   font?: string,
 * }} [options]
 * @returns {string} leerer String, wenn die Schrift kein Glyph liefert
 */
export function asciiArt(emoji, options = {}) {
  const pixels = drawEmoji(emoji, { font: options.font });
  const box = boxOf(pixels);
  if (box === null) {
    return '';
  }
  const aspect = options.aspect
    || cellAspect(options.fontFamily || 'monospace', options.lineHeight || 1.06);
  const grid = sampleGrid(pixels, box, { cols: options.cols || 40, aspect });
  return gridToLines(grid, { ramp: options.ramp }).join('\n');
}
