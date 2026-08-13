import { resolveTarget } from '../core/dom.js';
import { createLoop } from '../core/loop.js';

// Placeholder: types the placeholder of an <input> or <textarea> character by
// character, holds it, wipes it out again and moves on to the next entry.
// The only thing it ever writes is the placeholder attribute - no wrapper, no
// injected markup, no inline styles - so the field keeps its own CSS, its value
// and its layout untouched.
//
// Compared with the jQuery plugin the idea comes from
// (https://github.com/BornaSepic/Placeholder-Typewriter) this one runs on the
// shared rAF loop instead of setInterval (no drift, no runaway timers), honours
// prefers-reduced-motion, freezes while the field is in use and puts the
// original placeholder back on cancel().

const TYPING = 0;
const HOLDING = 1;
const DELETING = 2;
const WAITING = 3;

/**
 * @param {Element|string} target - the field, or a selector for it (or for a
 *   wrapper that contains exactly one).
 * @param {{
 *   texts?: string[],
 *   text?: string,
 *   cps?: number,
 *   deleteCps?: number,
 *   hold?: number,
 *   pause?: number,
 *   cursor?: string,
 *   blink?: boolean,
 *   loop?: boolean,
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function placeholder(target, options = {}) {
  const field = resolveField(target);
  const original = field.getAttribute('placeholder');
  const texts = collectTexts(field, options);

  const restore = () => {
    if (original === null) {
      field.removeAttribute('placeholder');
    } else {
      field.setAttribute('placeholder', original);
    }
  };

  if (texts.length === 0) {
    return { finished: Promise.resolve(), cancel: () => {} };
  }

  // Reduced motion: no typing at all, just the first line as a plain placeholder.
  if (prefersReducedMotion()) {
    field.setAttribute('placeholder', texts[0]);
    if (options.onDone) {
      options.onDone();
    }
    return { finished: Promise.resolve(), cancel: restore };
  }

  const speed = options.speed || 1;
  const fps = options.fps || 30;
  const step = 1000 / fps;
  const cps = (options.cps || 22) * speed;
  const deleteCps = (options.deleteCps || 45) * speed;
  const hold = toDelay(options.hold, 1800) / speed;
  const pause = toDelay(options.pause, 400) / speed;
  const cursor = options.cursor === undefined ? '_' : options.cursor;
  const blink = options.blink !== false;
  const repeat = options.loop !== false;
  const blinkFrames = Math.max(1, Math.round(fps * 0.5));

  let index = 0;
  let cells = [...texts[0]];
  let shown = 0;
  let phase = TYPING;
  let waited = 0;
  let frames = 0;

  const write = (withCursor) => {
    const text = cells.slice(0, Math.floor(shown)).join('');
    field.setAttribute('placeholder', withCursor && cursor ? text + cursor : text);
  };

  const blinkOn = () => !blink || Math.floor(frames / blinkFrames) % 2 === 0;

  // A field that is focused or already filled has no business flickering: the
  // placeholder is either being read by someone about to type, or not visible
  // at all. Freeze there and pick up again on blur.
  const inUse = () => document.activeElement === field || (field.value || '') !== '';

  // Jumping to the full line on focus avoids leaving a half-typed word behind
  // while the field sits in use.
  const onFocus = () => {
    shown = cells.length;
    phase = HOLDING;
    waited = 0;
    write(false);
  };
  field.addEventListener('focus', onFocus);

  const loop = createLoop(
    () => {
      frames += 1;

      if (inUse()) {
        return true;
      }

      if (phase === TYPING) {
        shown = Math.min(cells.length, shown + cps / fps);
        write(true);
        if (shown >= cells.length) {
          phase = HOLDING;
          waited = 0;
        }
        return true;
      }

      if (phase === HOLDING) {
        waited += step;
        write(blinkOn());
        if (waited < hold) {
          return true;
        }
        if (!repeat && index === texts.length - 1) {
          write(false);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        phase = DELETING;
        return true;
      }

      if (phase === DELETING) {
        shown = Math.max(0, shown - deleteCps / fps);
        write(true);
        if (shown <= 0) {
          phase = WAITING;
          waited = 0;
        }
        return true;
      }

      waited += step;
      write(blinkOn());
      if (waited >= pause) {
        index = (index + 1) % texts.length;
        cells = [...texts[index]];
        shown = 0;
        phase = TYPING;
      }
      return true;
    },
    { fps },
  );

  return {
    finished: loop.finished,
    cancel() {
      loop.cancel();
      field.removeEventListener('focus', onFocus);
      restore();
    },
  };
}

/**
 * @param {Element|string} target
 * @returns {HTMLInputElement|HTMLTextAreaElement}
 */
function resolveField(target) {
  const element = resolveTarget(target);
  if (isField(element)) {
    return element;
  }
  const inner = element.querySelector ? element.querySelector('input, textarea') : null;
  if (inner === null) {
    throw new Error('retro-text-effects: placeholder needs an <input> or <textarea>');
  }
  return inner;
}

function isField(element) {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

// The lines come from the options, from a data attribute, or - as a last
// resort - from the placeholder already on the field. The pipe lets you keep
// the whole rotation in the markup, so the field still reads sensibly with
// JavaScript switched off.
function collectTexts(field, options) {
  if (Array.isArray(options.texts)) {
    return options.texts.filter((entry) => typeof entry === 'string' && entry.length > 0);
  }
  if (typeof options.text === 'string' && options.text.length > 0) {
    return [options.text];
  }
  const attribute = field.getAttribute('data-rte-placeholders');
  const source = attribute === null ? field.getAttribute('placeholder') || '' : attribute;
  return source
    .split('|')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function toDelay(value, fallback) {
  return typeof value === 'number' && value >= 0 ? value : fallback;
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
