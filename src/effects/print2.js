import { animateStage } from '../core/canvas.js';

// Print 2 (canvas): the canvas twin of print - the text appears in reading order
// behind a glowing print head that leaves a hot afterglow on the freshest
// characters.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   cps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function print2(target, options = {}) {
  const speed = options.speed || 1;
  const cps = (options.cps || 60) * speed;

  return animateStage(target, options, (stage) => {
    const cells = stage.targets;

    return (elapsed) => {
      stage.clear();
      const revealed = Math.min(cells.length, Math.floor((elapsed / 1000) * cps));

      for (let i = 0; i < revealed; i += 1) {
        // Die letzten Zeichen gluehen noch nach
        const age = revealed - i;
        if (age <= 4) {
          stage.ctx.save();
          stage.ctx.shadowColor = '#ffffff';
          stage.ctx.shadowBlur = 10 - age * 2;
          stage.drawChar(cells[i].ch, cells[i].x, cells[i].y, age <= 2 ? '#ffffff' : stage.color);
          stage.ctx.restore();
        } else {
          stage.drawChar(cells[i].ch, cells[i].x, cells[i].y);
        }
      }

      if (revealed < cells.length) {
        // Druckkopf mit Glow
        const head = cells[revealed];
        stage.ctx.save();
        stage.ctx.shadowColor = '#ffffff';
        stage.ctx.shadowBlur = 12;
        stage.drawChar('█', head.x, head.y, '#ffffff');
        stage.ctx.restore();
      }

      return revealed < cells.length;
    };
  });
}
