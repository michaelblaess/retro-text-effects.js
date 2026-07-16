import { animateStage } from '../core/canvas.js';
import { randInt } from '../core/random.js';

// Rain (canvas): every character falls from above the visible area straight down
// into its final position, staggered so the text builds up like a steady drizzle.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function rain(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const drops = stage.targets.map((t) => ({
      t,
      y: t.y - stage.height * (0.15 + Math.random() * 0.85) - randInt(0, 200),
      v: (140 + Math.random() * 260) * speed,
      delay: randInt(0, Math.round(1400 / speed)),
      landed: false,
    }));

    return (elapsed, dt) => {
      stage.clear();
      let remaining = 0;

      for (const drop of drops) {
        if (!drop.landed && elapsed >= drop.delay) {
          drop.y += (drop.v * dt) / 1000;
          if (drop.y >= drop.t.y) {
            drop.y = drop.t.y;
            drop.landed = true;
          }
        }

        if (drop.landed) {
          stage.drawChar(drop.t.ch, drop.t.x, drop.t.y);
        } else {
          remaining += 1;
          if (elapsed >= drop.delay) {
            stage.drawChar(drop.t.ch, drop.t.x, drop.y);
          }
        }
      }

      return remaining > 0;
    };
  });
}
