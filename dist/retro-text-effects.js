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
    crt: () => crt,
    decrypt: () => decrypt,
    matrix: () => matrix,
    matrix2: () => matrix2,
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

  // src/effects/matrix2.js
  var KATAKANA = "\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB\u30DE\u30DF\u30E0\u30E1\u30E2\u30E4\u30E6\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EF\u30F2\u30F30123456789ABCDEF";
  function matrix2(target, options = {}) {
    const host = resolveTarget(target);
    const duration = options.duration || 1500;
    const fontSize = options.fontSize || 20;
    const color = options.color || "#00ff00";
    const glyphs = options.glyphs || KATAKANA;
    const parent = host.parentNode || host;
    const previousPosition = parent.style.position;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const canvas = document.createElement("canvas");
    const width = host.offsetWidth;
    const height = host.offsetHeight;
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    canvas.style.cssText = `position:absolute;left:${host.offsetLeft}px;top:${host.offsetTop}px;width:${width}px;height:${height}px;z-index:10;pointer-events:none;`;
    parent.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const columnCount = Math.max(1, Math.floor(canvas.width / fontSize));
    const columns = [];
    for (let i = 0; i < columnCount; i += 1) {
      columns.push(Math.random() * -100);
    }
    let raf = null;
    let cancelled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });
    function cleanup() {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      parent.style.position = previousPosition;
    }
    function finish() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      cleanup();
      if (options.onDone) {
        options.onDone();
      }
      resolveFinished();
    }
    function fadeOut() {
      let opacity = 1;
      function fade() {
        if (cancelled) {
          return;
        }
        opacity -= 0.1;
        if (opacity <= 0) {
          finish();
          return;
        }
        canvas.style.opacity = String(opacity);
        raf = requestAnimationFrame(fade);
      }
      fade();
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const start = performance.now();
    function draw(now) {
      if (cancelled) {
        return;
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns.length; i += 1) {
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = columns[i] * fontSize;
        ctx.fillText(glyph, x, y);
        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        }
        columns[i] += 1;
      }
      if (now - start < duration) {
        raf = requestAnimationFrame(draw);
      } else {
        fadeOut();
      }
    }
    raf = requestAnimationFrame(draw);
    return {
      finished,
      cancel() {
        if (cancelled) {
          return;
        }
        cancelled = true;
        cleanup();
        resolveFinished();
      }
    };
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

  // src/effects/crt.js
  var STYLE_ID = "rte-crt-style";
  function ensureFlickerStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = "@keyframes rte-crt-flicker{0%{opacity:.97}50%{opacity:1}100%{opacity:.98}}";
    document.head.appendChild(style);
  }
  function toGlow(color, alpha) {
    const hex = color.replace("#", "");
    let r;
    let g;
    let b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function crt(target, options = {}) {
    const host = resolveTarget(target);
    const color = options.color || "#33ff33";
    const scanlineOpacity = options.scanlineOpacity === void 0 ? 0.15 : options.scanlineOpacity;
    const glow = options.glow !== false;
    const flicker = options.flicker !== false;
    ensureFlickerStyle();
    const previous = {
      position: host.style.position,
      textShadow: host.style.textShadow,
      animation: host.style.animation
    };
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    if (glow) {
      host.style.textShadow = `0 0 5px ${toGlow(color, 0.5)}, 0 0 10px ${toGlow(color, 0.3)}`;
    }
    if (flicker) {
      host.style.animation = "rte-crt-flicker 0.15s infinite alternate";
    }
    const scanlines = document.createElement("div");
    scanlines.style.cssText = `position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(0,0,0,${scanlineOpacity}) 0px,rgba(0,0,0,${scanlineOpacity}) 1px,transparent 1px,transparent 2px);`;
    host.appendChild(scanlines);
    let cancelled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });
    return {
      finished,
      cancel() {
        if (cancelled) {
          return;
        }
        cancelled = true;
        if (scanlines.parentNode) {
          scanlines.parentNode.removeChild(scanlines);
        }
        host.style.position = previous.position;
        host.style.textShadow = previous.textShadow;
        host.style.animation = previous.animation;
        resolveFinished();
      }
    };
  }

  // src/index.js
  var version = "0.2.0";
  return __toCommonJS(index_exports);
})();
