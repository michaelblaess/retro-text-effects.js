import { animateStage, easeOutCubic, clamp01, SPARK_COLORS } from '../core/canvas.js';

// Orbittingvolley (canvas): four launchers orbit the block and fire volleys of
// characters inward. The text is filled from the centre outward, each launcher
// taking the next character in turn as it swings around.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function orbittingvolley(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const radius = Math.hypot(stage.width, stage.height) / 2 + 30;
    const omega = ((Math.PI * 2) / 3000) * speed;
    const gap = 45 / speed;
    const travel = 750 / speed;

    // Zeichen von innen nach aussen abfeuern (Aufbau aus der Mitte heraus).
    const ordered = stage.targets
      .slice()
      .sort((a, b) => (Math.hypot(a.x - cx, a.y - cy)) - (Math.hypot(b.x - cx, b.y - cy)));

    const shots = ordered.map((t, i) => {
      const launcher = i % 4;
      const fireTime = i * gap;
      const angle = launcher * (Math.PI / 2) + omega * fireTime;
      return {
        t,
        launcher,
        fireTime,
        startX: cx + Math.cos(angle) * radius,
        startY: cy + Math.sin(angle) * radius,
      };
    });

    return (elapsed) => {
      stage.clear();
      let pending = 0;

      // Die vier kreisenden Abschusspunkte als helle Punkte zeichnen.
      for (let l = 0; l < 4; l += 1) {
        const a = l * (Math.PI / 2) + omega * elapsed;
        const lx = cx + Math.cos(a) * radius;
        const ly = cy + Math.sin(a) * radius;
        stage.ctx.fillStyle = SPARK_COLORS[l % SPARK_COLORS.length];
        stage.ctx.beginPath();
        stage.ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        stage.ctx.fill();
      }

      for (const s of shots) {
        if (elapsed < s.fireTime) {
          pending += 1;
          continue;
        }
        const p = clamp01((elapsed - s.fireTime) / travel);
        if (p >= 1) {
          stage.drawChar(s.t.ch, s.t.x, s.t.y);
          continue;
        }
        pending += 1;
        const e = easeOutCubic(p);
        const x = s.startX + (s.t.x - s.startX) * e;
        const y = s.startY + (s.t.y - s.startY) * e;
        stage.drawChar(s.t.ch, x, y);
      }

      return pending > 0;
    };
  });
}
