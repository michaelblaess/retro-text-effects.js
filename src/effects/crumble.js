import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Crumble (canvas): the text first crumbles into scattered dust that drifts apart
// and sinks, then the dust is vacuumed back up and reforms into the ordered text.

const DUST = '·'; // middle dot

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function crumble(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const disperseEnd = 1100 / speed;
    const reformEnd = disperseEnd + 1400 / speed;

    const bits = stage.targets.map((t) => ({
      t,
      // Streuziel: seitlich verteilt, mit deutlichem Fall nach unten.
      scatterX: Math.max(-30, Math.min(stage.width + 30, t.x + (Math.random() - 0.5) * stage.width * 0.7)),
      scatterY: Math.min(stage.height + 30, t.y + 20 + Math.random() * stage.height * 0.5),
    }));

    return (elapsed) => {
      stage.clear();

      if (elapsed >= reformEnd) {
        for (const b of bits) {
          stage.drawChar(b.t.ch, b.t.x, b.t.y);
        }
        return false;
      }

      if (elapsed < disperseEnd) {
        // Zerfall: vom festen Text beschleunigt auseinander (ease-in).
        const p = clamp01(elapsed / disperseEnd);
        const e = p * p * p;
        for (const b of bits) {
          const x = b.t.x + (b.scatterX - b.t.x) * e;
          const y = b.t.y + (b.scatterY - b.t.y) * e;
          stage.drawChar(e < 0.25 ? b.t.ch : DUST, x, y, e < 0.25 ? undefined : '#8a8a8a');
        }
      } else {
        // Wiederaufbau: der Staub wird zurueckgesaugt (ease-out).
        const p = clamp01((elapsed - disperseEnd) / (reformEnd - disperseEnd));
        const e = easeOutCubic(p);
        for (const b of bits) {
          const x = b.scatterX + (b.t.x - b.scatterX) * e;
          const y = b.scatterY + (b.t.y - b.scatterY) * e;
          stage.drawChar(e > 0.7 ? b.t.ch : DUST, x, y, e > 0.7 ? undefined : '#8a8a8a');
        }
      }

      return true;
    };
  });
}
