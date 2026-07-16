import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Black hole (canvas): the characters spiral into a singularity in the centre of
// the stage, vanish, and after a bright flash the singularity throws them back
// out to their final positions.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function blackhole(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const maxRadius = Math.hypot(stage.width, stage.height) / 2;
    const explodeDuration = 900 / speed;

    const parts = stage.targets.map((t) => ({
      t,
      angle: Math.random() * Math.PI * 2,
      radius: maxRadius * (0.35 + Math.random() * 0.65),
      spin: 0.9 + Math.random() * 1.7,
      pull: 70 + Math.random() * 140,
      consumed: false,
    }));

    let exploding = false;
    let explodeStart = 0;

    return (elapsed, dt) => {
      stage.clear(0.3);
      const dtS = (dt * speed) / 1000;

      if (!exploding) {
        // Singularitaet
        stage.ctx.fillStyle = '#e0d0ff';
        stage.ctx.beginPath();
        stage.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        stage.ctx.fill();

        let alive = 0;
        for (const part of parts) {
          if (part.consumed) {
            continue;
          }
          // Naeher am Zentrum: schnellere Rotation und staerkerer Sog
          part.angle += part.spin * dtS * (1 + 40 / (part.radius + 20));
          part.radius -= part.pull * dtS * (1 + 90 / (part.radius + 30));
          if (part.radius <= 6) {
            part.consumed = true;
            continue;
          }
          alive += 1;
          const x = cx + Math.cos(part.angle) * part.radius;
          const y = cy + Math.sin(part.angle) * part.radius * 0.6;
          stage.drawChar(part.t.ch, x, y);
        }

        if (alive === 0) {
          exploding = true;
          explodeStart = elapsed;
        }
        return true;
      }

      const progress = clamp01((elapsed - explodeStart) / explodeDuration);
      const eased = easeOutCubic(progress);

      // Druckwelle
      if (progress < 1) {
        stage.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - progress)})`;
        stage.ctx.lineWidth = 2;
        stage.ctx.beginPath();
        stage.ctx.arc(cx, cy, eased * maxRadius, 0, Math.PI * 2);
        stage.ctx.stroke();
      }

      for (const part of parts) {
        const x = cx + (part.t.x - cx) * eased;
        const y = cy + (part.t.y - cy) * eased;
        stage.drawChar(part.t.ch, x, y);
      }

      return progress < 1;
    };
  });
}
