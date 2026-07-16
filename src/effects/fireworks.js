import { animateStage, easeOutCubic, clamp01, SPARK_COLORS } from '../core/canvas.js';
import { pick } from '../core/random.js';

// Fireworks (canvas): the characters arrive in volleys. Each volley launches as a
// rocket from the bottom edge, explodes into a shower of sparks, and the burst
// throws its characters to their final positions.

const VOLLEY_SIZE = 24;

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function fireworks(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    // Zufaellige Zuordnung der Zeichen zu den Salven
    const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
    const shows = [];
    for (let i = 0; i < shuffled.length; i += VOLLEY_SIZE) {
      const index = shows.length;
      shows.push({
        chars: shuffled.slice(i, i + VOLLEY_SIZE),
        burstX: stage.width * (0.15 + Math.random() * 0.7),
        burstY: stage.height * (0.1 + Math.random() * 0.35),
        launchAt: (index * 460) / speed,
        riseDuration: 480 / speed,
        flyDuration: 900 / speed,
        sparkDuration: 650 / speed,
        color: pick(SPARK_COLORS),
        sparks: Array.from({ length: 18 }, () => ({
          angle: Math.random() * Math.PI * 2,
          range: 30 + Math.random() * 70,
        })),
      });
    }

    return (elapsed) => {
      // Leichte Spur fuer Raketen und Funken
      stage.clear(0.35);
      let active = 0;

      for (const show of shows) {
        const local = elapsed - show.launchAt;
        const total = show.riseDuration + Math.max(show.flyDuration, show.sparkDuration);

        if (local < total) {
          active += 1;
        }

        if (local < 0) {
          continue;
        }

        if (local < show.riseDuration) {
          // Aufstieg: heller Punkt von der Unterkante zum Explosionspunkt
          const rise = easeOutCubic(local / show.riseDuration);
          const y = stage.height - (stage.height - show.burstY) * rise;
          stage.ctx.fillStyle = '#ffffff';
          stage.ctx.fillRect(show.burstX - 1.5, y - 1.5, 3, 6);
          continue;
        }

        const sinceBurst = local - show.riseDuration;

        // Funkenschauer
        const sparkProgress = clamp01(sinceBurst / show.sparkDuration);
        if (sparkProgress < 1) {
          const reach = easeOutCubic(sparkProgress);
          stage.ctx.fillStyle = show.color;
          stage.ctx.globalAlpha = 1 - sparkProgress;
          for (const spark of show.sparks) {
            const x = show.burstX + Math.cos(spark.angle) * spark.range * reach;
            const y = show.burstY + Math.sin(spark.angle) * spark.range * reach + sparkProgress * 24;
            stage.ctx.fillRect(x, y, 2, 2);
          }
          stage.ctx.globalAlpha = 1;
        }

        // Zeichenflug vom Explosionspunkt zur Zielposition
        const fly = clamp01(sinceBurst / show.flyDuration);
        const eased = easeOutCubic(fly);
        for (const t of show.chars) {
          const x = show.burstX + (t.x - show.burstX) * eased;
          const y = show.burstY + (t.y - show.burstY) * eased;
          stage.drawChar(t.ch, x, y, fly < 1 ? show.color : stage.color);
        }
      }

      return active > 0;
    };
  });
}
