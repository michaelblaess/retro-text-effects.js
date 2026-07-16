// Public API. esbuild bundles this into a single IIFE that exposes everything
// below on window.RetroTextEffects.

// Text effects: rewrite textContent of a <pre>, no canvas involved.
export { decrypt } from './effects/decrypt.js';
export { print } from './effects/print.js';
export { matrix } from './effects/matrix.js';
export { overflow } from './effects/overflow.js';
export { errorcorrect } from './effects/errorcorrect.js';
export { randomsequence } from './effects/randomsequence.js';
export { middleout } from './effects/middleout.js';
export { sweep } from './effects/sweep.js';
export { pour } from './effects/pour.js';
export { slide } from './effects/slide.js';
export { burn } from './effects/burn.js';
export { vhstape } from './effects/vhstape.js';

// Style effect: persistent CRT treatment (scanlines/glow/flicker), no canvas.
export { crt } from './effects/crt.js';

// Canvas effects: an overlay canvas animates the characters in free 2D motion,
// then fades out and reveals the untouched text.
export { matrix2 } from './effects/matrix2.js';
export { decrypt2 } from './effects/decrypt2.js';
export { print2 } from './effects/print2.js';
export { overflow2 } from './effects/overflow2.js';
export { rain } from './effects/rain.js';
export { bouncyballs } from './effects/bouncyballs.js';
export { scattered } from './effects/scattered.js';
export { expand } from './effects/expand.js';
export { fireworks } from './effects/fireworks.js';
export { blackhole } from './effects/blackhole.js';
export { laseretch } from './effects/laseretch.js';
export { beams } from './effects/beams.js';
export { bubbles } from './effects/bubbles.js';
export { spray } from './effects/spray.js';
export { swarm } from './effects/swarm.js';
export { unstable } from './effects/unstable.js';
export { rings } from './effects/rings.js';

export const version = '0.4.1';
