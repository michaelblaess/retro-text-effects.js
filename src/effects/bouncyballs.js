import { animateStage, SPARK_COLORS } from '../core/canvas.js';
import { randInt, pick } from '../core/random.js';

// Bouncy balls (canvas): the characters drop in as coloured balls, bounce a few
// times on their landing row and settle into the final glyph.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function bouncyballs(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const gravity = 2400;
    const balls = stage.targets.map((t) => ({
      t,
      y: t.y - stage.height * (0.2 + Math.random() * 0.6) - randInt(20, 160),
      vy: 0,
      delay: randInt(0, Math.round(1600 / speed)),
      color: pick(SPARK_COLORS),
      settled: false,
    }));

    return (elapsed, dt) => {
      stage.clear();
      const dtS = (dt * speed) / 1000;
      let remaining = 0;

      for (const ball of balls) {
        if (!ball.settled && elapsed >= ball.delay) {
          ball.vy += gravity * dtS;
          ball.y += ball.vy * dtS;
          if (ball.y >= ball.t.y) {
            ball.y = ball.t.y;
            ball.vy = -ball.vy * 0.5;
            if (Math.abs(ball.vy) < 120) {
              ball.settled = true;
            }
          }
        }

        if (ball.settled) {
          stage.drawChar(ball.t.ch, ball.t.x, ball.t.y);
        } else {
          remaining += 1;
          if (elapsed >= ball.delay) {
            stage.drawChar('●', ball.t.x, ball.y, ball.color);
          }
        }
      }

      return remaining > 0;
    };
  });
}
