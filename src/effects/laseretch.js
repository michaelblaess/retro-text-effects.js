import { animateStage } from '../core/canvas.js';

// Laser etch (canvas): a laser beam from the top-right corner traces the text in
// reading order and burns it in character by character, throwing off falling
// sparks at the etch point.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function laseretch(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cells = stage.targets;
    const totalDuration = 2400 / speed;
    const sparks = [];
    let etchedBefore = 0;

    return (elapsed, dt) => {
      stage.clear();
      const dtS = dt / 1000;
      const etched = Math.min(cells.length, Math.floor((elapsed / totalDuration) * cells.length));

      // Bereits eingebrannter Text
      for (let i = 0; i < etched; i += 1) {
        stage.drawChar(cells[i].ch, cells[i].x, cells[i].y);
      }

      if (etched < cells.length) {
        const head = cells[etched];

        // Laserstrahl aus der oberen rechten Ecke zum Aetzpunkt
        stage.ctx.strokeStyle = 'rgba(255, 64, 64, 0.55)';
        stage.ctx.lineWidth = 1.5;
        stage.ctx.beginPath();
        stage.ctx.moveTo(stage.width - 4, -4);
        stage.ctx.lineTo(head.x + stage.cellW / 2, head.y + stage.cellH / 2);
        stage.ctx.stroke();

        // Glutpunkt
        stage.ctx.fillStyle = '#ffffff';
        stage.ctx.beginPath();
        stage.ctx.arc(head.x + stage.cellW / 2, head.y + stage.cellH / 2, 2.5, 0, Math.PI * 2);
        stage.ctx.fill();

        // Funken fuer frisch geaetzte Zeichen
        for (let i = etchedBefore; i < etched; i += 1) {
          if (Math.random() < 0.35) {
            sparks.push({
              x: cells[i].x + stage.cellW / 2,
              y: cells[i].y + stage.cellH / 2,
              vx: -40 + Math.random() * 80,
              vy: 30 + Math.random() * 120,
              life: 450,
            });
          }
        }
      }
      etchedBefore = etched;

      // Funken animieren (leichte Gravitation, ausfaden)
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i];
        spark.life -= dt;
        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        spark.vy += 300 * dtS;
        spark.x += spark.vx * dtS;
        spark.y += spark.vy * dtS;
        stage.ctx.globalAlpha = spark.life / 450;
        stage.ctx.fillStyle = '#ffb347';
        stage.ctx.fillRect(spark.x, spark.y, 2, 2);
        stage.ctx.globalAlpha = 1;
      }

      return etched < cells.length || sparks.length > 0;
    };
  });
}
