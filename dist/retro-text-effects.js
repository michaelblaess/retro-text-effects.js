/*! retro-text-effects.js | Apache-2.0 | https://github.com/michaelblaess/retro-text-effects.js */
var RetroTextEffects = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    decrypt: () => decrypt,
    matrix: () => matrix,
    overflow: () => overflow,
    print: () => print,
    version: () => version
  });

  // src/core/dom.js
  function resolveTarget(target) {
    if (target === null || target === void 0) {
      throw new Error("retro-text-effects: a target element or selector is required");
    }
    if (typeof target === "string") {
      const found = document.querySelector(target);
      if (found === null) {
        throw new Error(`retro-text-effects: no element matches "${target}"`);
      }
      return textHost(found);
    }
    return textHost(target);
  }
  function textHost(element) {
    if (element.tagName === "PRE") {
      return element;
    }
    const pre = element.querySelector("pre");
    return pre !== null ? pre : element;
  }
  function getText(element) {
    return element.textContent || "";
  }
  function setText(element, text) {
    element.textContent = text;
  }

  // src/core/text.js
  function toLines(text) {
    return text.split("\n");
  }
  function toCells(line) {
    return Array.from(line);
  }
  function isBlank(ch) {
    return ch === " " || ch === "	" || ch === "\xA0";
  }

  // src/core/random.js
  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  // src/core/glyphs.js
  var SYMBOLS = Array.from("!<>-_\\/[]{}=+*^?#$%&@");
  var DIGITS = Array.from("0123456789");
  var BLOCKS = Array.from("\u2591\u2592\u2593\u2588");
  var MATRIX = Array.from(
    "\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C\uFF6D\uFF6E\uFF6F\uFF70\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF780123456789"
  );
  var DEFAULT_GLYPHS = SYMBOLS.concat(DIGITS, BLOCKS);

  // src/core/loop.js
  function createLoop(onTick, config = {}) {
    const interval = 1e3 / (config.fps || 30);
    let raf = null;
    let last = 0;
    let acc = 0;
    let cancelled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });
    function frame(now) {
      if (cancelled) {
        return;
      }
      if (last === 0) {
        last = now;
      }
      acc += now - last;
      last = now;
      let keepGoing = true;
      let guard = 0;
      while (acc >= interval && keepGoing && guard < 5) {
        acc -= interval;
        guard += 1;
        keepGoing = onTick();
      }
      if (keepGoing) {
        raf = requestAnimationFrame(frame);
      } else {
        resolveFinished();
      }
    }
    raf = requestAnimationFrame(frame);
    return {
      finished,
      cancel() {
        if (cancelled) {
          return;
        }
        cancelled = true;
        if (raf !== null) {
          cancelAnimationFrame(raf);
        }
        resolveFinished();
      }
    };
  }

  // src/effects/decrypt.js
  function decrypt(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;
    const preserveWhitespace = options.preserveWhitespace !== false;
    const speed = options.speed || 1;
    const rows = toLines(finalText).map(
      (line) => toCells(line).map((ch) => {
        const keep = preserveWhitespace && isBlank(ch);
        return {
          ch,
          flips: keep ? 0 : Math.max(1, Math.round(randInt(6, 34) / speed)),
          current: keep ? ch : pick(glyphs)
        };
      })
    );
    const render = () => rows.map((row) => row.map((c) => c.current).join("")).join("\n");
    return createLoop(
      () => {
        let unresolved = 0;
        for (const row of rows) {
          for (const cell of row) {
            if (cell.flips > 0) {
              cell.flips -= 1;
              cell.current = cell.flips === 0 ? cell.ch : pick(glyphs);
              if (cell.flips > 0) {
                unresolved += 1;
              }
            }
          }
        }
        if (unresolved === 0) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render());
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/print.js
  function print(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const fps = options.fps || 30;
    const cps = (options.cps || 60) * (options.speed || 1);
    const head = options.head || "\u2588";
    const lines = toLines(finalText).map(toCells);
    const total = lines.reduce((sum, cells) => sum + cells.length, 0);
    const render = (count) => {
      let seen = 0;
      return lines.map((cells) => {
        let out = "";
        for (const ch of cells) {
          if (seen < count) {
            out += ch;
          } else if (seen === count) {
            out += head;
          } else {
            out += " ";
          }
          seen += 1;
        }
        return out;
      }).join("\n");
    };
    let printed = 0;
    return createLoop(
      () => {
        printed += cps / fps;
        const count = Math.floor(printed);
        if (count >= total) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render(count));
        return true;
      },
      { fps }
    );
  }

  // src/effects/matrix.js
  function matrix(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const glyphs = options.glyphs ? Array.from(options.glyphs) : MATRIX;
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const height = grid.length;
    const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
    const columns = [];
    for (let c = 0; c < width; c += 1) {
      columns.push({
        front: 0,
        delay: randInt(0, Math.round(height / speed) + 4),
        step: randInt(1, 2)
      });
    }
    const render = () => grid.map((row, r) => {
      let out = "";
      for (let c = 0; c < row.length; c += 1) {
        const ch = row[c];
        if (isBlank(ch)) {
          out += ch;
          continue;
        }
        const reach = columns[c].front - columns[c].delay;
        if (r < reach - 1) {
          out += ch;
        } else if (r <= reach) {
          out += pick(glyphs);
        } else {
          out += " ";
        }
      }
      return out;
    }).join("\n");
    return createLoop(
      () => {
        let done = true;
        for (const column of columns) {
          column.front += column.step;
          if (column.front - column.delay < height + 1) {
            done = false;
          }
        }
        if (done) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render());
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/overflow.js
  function overflow(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const cycles = options.cycles || 3;
    const lines = toLines(finalText);
    const height = Math.max(1, lines.length);
    const totalTicks = Math.max(1, Math.round(height * cycles / speed));
    let tick = 0;
    let offset = 0;
    const render = () => lines.map((_, i) => lines[(i + offset) % lines.length]).join("\n");
    return createLoop(
      () => {
        tick += 1;
        offset = (offset + 1) % height;
        if (tick % height === 0) {
          offset = randInt(0, height - 1);
        }
        if (tick >= totalTicks) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render());
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/index.js
  var version = "0.1.0";
  return __toCommonJS(index_exports);
})();
