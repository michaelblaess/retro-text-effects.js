import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Spray (canvas): a nozzle in the bottom-left corner sprays the characters in
// random order onto the block; every character flies along a curved arc to its
// final position.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function spray(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const nozzleX = 0;
    const nozzleY = stage.height;
    const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
    const spreadDuration = 1600 / speed;
    const flightDuration = 450 / speed;

    const parts = shuffled.map((t, i) => ({
      t,
      start: (i / Math.max(1, shuffled.length - 1)) * spreadDuration,
      // Kontrollpunkt fuer den Bogen: seitlich versetzt zwischen Duese und Ziel
      cx: (nozzleX + t.x) / 2 + (Math.random() - 0.5) * stage.width * 0.4,
      cy: Math.min(nozzleY, t.y) - Math.random() * stage.height * 0.3,
    }));

    return (elapsed) => {
      stage.clear();
      let flying = 0;

      for (const part of parts) {
        const progress = clamp01((elapsed - part.start) / flightDuration);
        if (elapsed < part.start) {
          flying += 1;
          continue;
        }
        if (progress < 1) {
          flying += 1;
          const e = easeOutCubic(progress);
          // Quadratische Bezier-Kurve Duese -> Kontrollpunkt -> Ziel
          const inv = 1 - e;
          const x = inv * inv * nozzleX + 2 * inv * e * part.cx + e * e * part.t.x;
          const y = inv * inv * nozzleY + 2 * inv * e * part.cy + e * e * part.t.y;
          stage.drawChar(part.t.ch, x, y, '#ffffff');
        } else {
          stage.drawChar(part.t.ch, part.t.x, part.t.y);
        }
      }

      return flying > 0;
    };
  });
}
