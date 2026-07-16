import { animateStage, SPARK_COLORS } from '../core/canvas.js';
import { randInt, pick } from '../core/random.js';

// Bubbles (canvas): every character floats down in its own little bubble, swaying
// gently; when the bubble reaches its landing spot it pops with a small ring and
// leaves the character behind.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function bubbles(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const radius = Math.max(6, stage.cellH * 0.7);
    const all = stage.targets.map((t) => ({
      t,
      y: t.y - stage.height * (0.2 + Math.random() * 0.8) - randInt(20, 120),
      v: (50 + Math.random() * 90) * speed,
      phase: Math.random() * Math.PI * 2,
      color: pick(SPARK_COLORS),
      poppedAt: -1,
    }));

    return (elapsed, dt) => {
      stage.clear();
      let floating = 0;

      for (const bubble of all) {
        if (bubble.poppedAt < 0) {
          bubble.y += (bubble.v * dt) / 1000;
          if (bubble.y >= bubble.t.y) {
            bubble.y = bubble.t.y;
            bubble.poppedAt = elapsed;
          }
        }

        if (bubble.poppedAt < 0) {
          floating += 1;
          const sway = Math.sin(elapsed / 350 + bubble.phase) * stage.cellW * 0.8;
          const x = bubble.t.x + sway;
          stage.ctx.strokeStyle = bubble.color;
          stage.ctx.globalAlpha = 0.6;
          stage.ctx.lineWidth = 1;
          stage.ctx.beginPath();
          stage.ctx.arc(x + stage.cellW / 2, bubble.y + stage.cellH / 2, radius, 0, Math.PI * 2);
          stage.ctx.stroke();
          stage.ctx.globalAlpha = 1;
          stage.drawChar(bubble.t.ch, x, bubble.y);
        } else {
          // Platz-Ring kurz nach dem Aufsetzen
          const since = elapsed - bubble.poppedAt;
          if (since < 250) {
            const grow = since / 250;
            stage.ctx.strokeStyle = bubble.color;
            stage.ctx.globalAlpha = 1 - grow;
            stage.ctx.beginPath();
            stage.ctx.arc(
              bubble.t.x + stage.cellW / 2,
              bubble.t.y + stage.cellH / 2,
              radius * (1 + grow),
              0,
              Math.PI * 2,
            );
            stage.ctx.stroke();
            stage.ctx.globalAlpha = 1;
            floating += 1;
          }
          stage.drawChar(bubble.t.ch, bubble.t.x, bubble.t.y);
        }
      }

      return floating > 0;
    };
  });
}
