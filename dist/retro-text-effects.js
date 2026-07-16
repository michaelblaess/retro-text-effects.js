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
    blackhole: () => blackhole,
    bouncyballs: () => bouncyballs,
    crt: () => crt,
    decrypt: () => decrypt,
    expand: () => expand,
    fireworks: () => fireworks,
    laseretch: () => laseretch,
    matrix: () => matrix,
    matrix2: () => matrix2,
    overflow: () => overflow,
    print: () => print,
    rain: () => rain,
    scattered: () => scattered,
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

  // src/core/canvas.js
  var SPARK_COLORS = ["#ff5555", "#ffd700", "#66aaff", "#ff66cc", "#66dd88"];
  function easeOutCubic(t) {
    const inv = 1 - t;
    return 1 - inv * inv * inv;
  }
  function clamp01(t) {
    if (t < 0) {
      return 0;
    }
    if (t > 1) {
      return 1;
    }
    return t;
  }
  function createStage(target) {
    const host = resolveTarget(target);
    const finalText = getText(host);
    const parent = host.parentNode || host;
    const previousPosition = parent.style.position;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const style = getComputedStyle(host);
    const fontSize = parseFloat(style.fontSize) || 16;
    const lineHeightRaw = parseFloat(style.lineHeight);
    const cellH = Number.isNaN(lineHeightRaw) ? Math.round(fontSize * 1.4) : lineHeightRaw;
    const padX = parseFloat(style.paddingLeft) || 0;
    const padY = parseFloat(style.paddingTop) || 0;
    const font = `${fontSize}px ${style.fontFamily}`;
    const color = style.color || "#33ff33";
    const width = Math.max(1, host.offsetWidth);
    const height = Math.max(1, host.offsetHeight);
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.cssText = `position:absolute;left:${host.offsetLeft}px;top:${host.offsetTop}px;width:${width}px;height:${height}px;z-index:10;pointer-events:none;`;
    parent.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textBaseline = "top";
    const cellW = ctx.measureText("M").width || fontSize * 0.6;
    const targets = [];
    const rows = toLines(finalText);
    for (let r = 0; r < rows.length; r += 1) {
      const cells = toCells(rows[r]);
      for (let c = 0; c < cells.length; c += 1) {
        if (!isBlank(cells[c])) {
          targets.push({ ch: cells[c], x: padX + c * cellW, y: padY + r * cellH });
        }
      }
    }
    return {
      ctx,
      canvas,
      width,
      height,
      cellW,
      cellH,
      color,
      targets,
      clear(alpha) {
        ctx.fillStyle = alpha === void 0 ? "#000000" : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, width, height);
      },
      drawChar(ch, x, y, fill) {
        ctx.font = font;
        ctx.textBaseline = "top";
        ctx.fillStyle = fill || color;
        ctx.fillText(ch, x, y);
      },
      remove() {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        parent.style.position = previousPosition;
      }
    };
  }
  function animateStage(target, options, setup) {
    const stage = createStage(target);
    const opts = options || {};
    let raf = null;
    let cancelled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });
    function finish() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      stage.remove();
      if (opts.onDone) {
        opts.onDone();
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
        stage.canvas.style.opacity = String(opacity);
        raf = requestAnimationFrame(fade);
      }
      fade();
    }
    stage.clear();
    const frame = setup(stage);
    let start = 0;
    let last = 0;
    function tick(now) {
      if (cancelled) {
        return;
      }
      if (start === 0) {
        start = now;
        last = now;
      }
      const dt = Math.min(64, now - last);
      last = now;
      if (frame(now - start, dt)) {
        raf = requestAnimationFrame(tick);
      } else {
        fadeOut();
      }
    }
    raf = requestAnimationFrame(tick);
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
        stage.remove();
        resolveFinished();
      }
    };
  }

  // src/effects/rain.js
  function rain(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const drops = stage.targets.map((t) => ({
        t,
        y: t.y - stage.height * (0.15 + Math.random() * 0.85) - randInt(0, 200),
        v: (140 + Math.random() * 260) * speed,
        delay: randInt(0, Math.round(1400 / speed)),
        landed: false
      }));
      return (elapsed, dt) => {
        stage.clear();
        let remaining = 0;
        for (const drop of drops) {
          if (!drop.landed && elapsed >= drop.delay) {
            drop.y += drop.v * dt / 1e3;
            if (drop.y >= drop.t.y) {
              drop.y = drop.t.y;
              drop.landed = true;
            }
          }
          if (drop.landed) {
            stage.drawChar(drop.t.ch, drop.t.x, drop.t.y);
          } else {
            remaining += 1;
            if (elapsed >= drop.delay) {
              stage.drawChar(drop.t.ch, drop.t.x, drop.y);
            }
          }
        }
        return remaining > 0;
      };
    });
  }

  // src/effects/bouncyballs.js
  function bouncyballs(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const gravity = 2400;
      const balls = stage.targets.map((t) => ({
        t,
        y: t.y - stage.height * (0.2 + Math.random() * 0.6) - randInt(20, 160),
        vy: 0,
        delay: randInt(0, Math.round(1600 / speed)),
        color: pick(SPARK_COLORS),
        settled: false
      }));
      return (elapsed, dt) => {
        stage.clear();
        const dtS = dt * speed / 1e3;
        let remaining = 0;
        for (const ball of balls) {
          if (!ball.settled && elapsed >= ball.delay) {
            ball.vy += gravity * dtS;
            ball.y += ball.vy * dtS;
            if (ball.y >= ball.t.y) {
              ball.y = ball.t.y;
              ball.vy = -ball.vy * 0.5;
              if (Math.abs(ball.vy) < 120) {
                ball.settled = true;
              }
            }
          }
          if (ball.settled) {
            stage.drawChar(ball.t.ch, ball.t.x, ball.t.y);
          } else {
            remaining += 1;
            if (elapsed >= ball.delay) {
              stage.drawChar("\u25CF", ball.t.x, ball.y, ball.color);
            }
          }
        }
        return remaining > 0;
      };
    });
  }

  // src/effects/scattered.js
  function scattered(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const parts = stage.targets.map((t) => ({
        t,
        sx: Math.random() * stage.width,
        sy: Math.random() * stage.height,
        delay: randInt(0, Math.round(900 / speed)),
        duration: (700 + Math.random() * 700) / speed
      }));
      return (elapsed) => {
        stage.clear();
        let moving = 0;
        for (const part of parts) {
          const progress = clamp01((elapsed - part.delay) / part.duration);
          if (progress < 1) {
            moving += 1;
          }
          const eased = easeOutCubic(progress);
          const x = part.sx + (part.t.x - part.sx) * eased;
          const y = part.sy + (part.t.y - part.sy) * eased;
          stage.drawChar(part.t.ch, x, y);
        }
        return moving > 0;
      };
    });
  }

  // src/effects/expand.js
  function expand(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const cx = stage.width / 2;
      const cy = stage.height / 2;
      const parts = stage.targets.map((t) => ({
        t,
        delay: randInt(0, Math.round(300 / speed)),
        duration: (500 + Math.random() * 500) / speed
      }));
      return (elapsed) => {
        stage.clear();
        let moving = 0;
        for (const part of parts) {
          const progress = clamp01((elapsed - part.delay) / part.duration);
          if (progress < 1) {
            moving += 1;
          }
          const eased = easeOutCubic(progress);
          const x = cx + (part.t.x - cx) * eased;
          const y = cy + (part.t.y - cy) * eased;
          stage.drawChar(part.t.ch, x, y);
        }
        return moving > 0;
      };
    });
  }

  // src/effects/fireworks.js
  var VOLLEY_SIZE = 24;
  function fireworks(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
      const shows = [];
      for (let i = 0; i < shuffled.length; i += VOLLEY_SIZE) {
        const index = shows.length;
        shows.push({
          chars: shuffled.slice(i, i + VOLLEY_SIZE),
          burstX: stage.width * (0.15 + Math.random() * 0.7),
          burstY: stage.height * (0.1 + Math.random() * 0.35),
          launchAt: index * 460 / speed,
          riseDuration: 480 / speed,
          flyDuration: 900 / speed,
          sparkDuration: 650 / speed,
          color: pick(SPARK_COLORS),
          sparks: Array.from({ length: 18 }, () => ({
            angle: Math.random() * Math.PI * 2,
            range: 30 + Math.random() * 70
          }))
        });
      }
      return (elapsed) => {
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
            const rise = easeOutCubic(local / show.riseDuration);
            const y = stage.height - (stage.height - show.burstY) * rise;
            stage.ctx.fillStyle = "#ffffff";
            stage.ctx.fillRect(show.burstX - 1.5, y - 1.5, 3, 6);
            continue;
          }
          const sinceBurst = local - show.riseDuration;
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

  // src/effects/blackhole.js
  function blackhole(target, options = {}) {
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
        consumed: false
      }));
      let exploding = false;
      let explodeStart = 0;
      return (elapsed, dt) => {
        stage.clear(0.3);
        const dtS = dt * speed / 1e3;
        if (!exploding) {
          stage.ctx.fillStyle = "#e0d0ff";
          stage.ctx.beginPath();
          stage.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          stage.ctx.fill();
          let alive = 0;
          for (const part of parts) {
            if (part.consumed) {
              continue;
            }
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

  // src/effects/laseretch.js
  function laseretch(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const cells = stage.targets;
      const totalDuration = 2400 / speed;
      const sparks = [];
      let etchedBefore = 0;
      return (elapsed, dt) => {
        stage.clear();
        const dtS = dt / 1e3;
        const etched = Math.min(cells.length, Math.floor(elapsed / totalDuration * cells.length));
        for (let i = 0; i < etched; i += 1) {
          stage.drawChar(cells[i].ch, cells[i].x, cells[i].y);
        }
        if (etched < cells.length) {
          const head = cells[etched];
          stage.ctx.strokeStyle = "rgba(255, 64, 64, 0.55)";
          stage.ctx.lineWidth = 1.5;
          stage.ctx.beginPath();
          stage.ctx.moveTo(stage.width - 4, -4);
          stage.ctx.lineTo(head.x + stage.cellW / 2, head.y + stage.cellH / 2);
          stage.ctx.stroke();
          stage.ctx.fillStyle = "#ffffff";
          stage.ctx.beginPath();
          stage.ctx.arc(head.x + stage.cellW / 2, head.y + stage.cellH / 2, 2.5, 0, Math.PI * 2);
          stage.ctx.fill();
          for (let i = etchedBefore; i < etched; i += 1) {
            if (Math.random() < 0.35) {
              sparks.push({
                x: cells[i].x + stage.cellW / 2,
                y: cells[i].y + stage.cellH / 2,
                vx: -40 + Math.random() * 80,
                vy: 30 + Math.random() * 120,
                life: 450
              });
            }
          }
        }
        etchedBefore = etched;
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
          stage.ctx.fillStyle = "#ffb347";
          stage.ctx.fillRect(spark.x, spark.y, 2, 2);
          stage.ctx.globalAlpha = 1;
        }
        return etched < cells.length || sparks.length > 0;
      };
    });
  }

  // src/index.js
  var version = "0.3.0";
  return __toCommonJS(index_exports);
})();
