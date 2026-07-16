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
    beams: () => beams,
    blackhole: () => blackhole,
    bouncyballs: () => bouncyballs,
    bubbles: () => bubbles,
    burn: () => burn,
    crt: () => crt,
    decrypt: () => decrypt,
    decrypt2: () => decrypt2,
    errorcorrect: () => errorcorrect,
    expand: () => expand,
    fireworks: () => fireworks,
    laseretch: () => laseretch,
    matrix: () => matrix,
    matrix2: () => matrix2,
    middleout: () => middleout,
    overflow: () => overflow,
    overflow2: () => overflow2,
    pour: () => pour,
    print: () => print,
    print2: () => print2,
    rain: () => rain,
    randomsequence: () => randomsequence,
    rings: () => rings,
    scattered: () => scattered,
    slide: () => slide,
    spray: () => spray,
    swarm: () => swarm,
    sweep: () => sweep,
    unstable: () => unstable,
    version: () => version,
    vhstape: () => vhstape
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

  // src/effects/errorcorrect.js
  function errorcorrect(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const ratio = options.ratio || 0.1;
    const grid = toLines(finalText).map(toCells);
    const positions = [];
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r].length; c += 1) {
        if (!isBlank(grid[r][c])) {
          positions.push({ r, c });
        }
      }
    }
    const shuffled = positions.slice().sort(() => Math.random() - 0.5);
    const pairTotal = Math.max(1, Math.floor(positions.length * ratio));
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length && pairs.length < pairTotal; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    const work = grid.map((row) => row.slice());
    for (const [a, b] of pairs) {
      const tmp = work[a.r][a.c];
      work[a.r][a.c] = work[b.r][b.c];
      work[b.r][b.c] = tmp;
    }
    const render = () => work.map((row) => row.join("")).join("\n");
    setText(element, render());
    let index = 0;
    let tick = 0;
    const ticksPerSwap = Math.max(1, Math.round(4 / speed));
    return createLoop(
      () => {
        tick += 1;
        if (tick % ticksPerSwap === 0 && index < pairs.length) {
          const [a, b] = pairs[index];
          const tmp = work[a.r][a.c];
          work[a.r][a.c] = work[b.r][b.c];
          work[b.r][b.c] = tmp;
          index += 1;
          setText(element, render());
        }
        if (index >= pairs.length) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/randomsequence.js
  function randomsequence(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const order = [];
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r].length; c += 1) {
        if (!isBlank(grid[r][c])) {
          order.push({ r, c });
        }
      }
    }
    order.sort(() => Math.random() - 0.5);
    const work = grid.map((row) => row.map((ch) => isBlank(ch) ? ch : " "));
    const perTick = Math.max(1, Math.round(order.length / 75 * speed));
    let revealed = 0;
    return createLoop(
      () => {
        for (let i = 0; i < perTick && revealed < order.length; i += 1) {
          const cell = order[revealed];
          work[cell.r][cell.c] = grid[cell.r][cell.c];
          revealed += 1;
        }
        if (revealed >= order.length) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, work.map((row) => row.join("")).join("\n"));
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/middleout.js
  function middleout(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const height = Math.max(1, grid.length);
    const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
    const centerR = (height - 1) / 2;
    const centerC = (width - 1) / 2;
    const totalTicks = Math.max(1, Math.round(40 / speed));
    let tick = 0;
    const render = (front) => grid.map((row, r) => {
      let out = "";
      for (let c = 0; c < row.length; c += 1) {
        const dist = Math.max(
          Math.abs(r - centerR) / Math.max(1, height / 2),
          Math.abs(c - centerC) / Math.max(1, width / 2)
        );
        out += dist <= front ? row[c] : " ";
      }
      return out;
    }).join("\n");
    return createLoop(
      () => {
        tick += 1;
        const front = tick / totalTicks;
        if (front >= 1) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render(front));
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/sweep.js
  function sweep(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;
    const band = options.band || 6;
    const grid = toLines(finalText).map(toCells);
    const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
    const totalTicks = Math.max(1, Math.round(50 / speed));
    let tick = 0;
    const render = (front) => grid.map((row) => {
      let out = "";
      for (let c = 0; c < row.length; c += 1) {
        if (isBlank(row[c])) {
          out += row[c];
        } else if (c < front - band) {
          out += row[c];
        } else if (c < front) {
          out += pick(glyphs);
        } else {
          out += " ";
        }
      }
      return out;
    }).join("\n");
    return createLoop(
      () => {
        tick += 1;
        const front = (width + band) * tick / totalTicks;
        if (front >= width + band) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, render(front));
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/pour.js
  function pour(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const order = [];
    for (let r = grid.length - 1; r >= 0; r -= 1) {
      const row = grid[r];
      const leftToRight = (grid.length - 1 - r) % 2 === 0;
      for (let i = 0; i < row.length; i += 1) {
        const c = leftToRight ? i : row.length - 1 - i;
        if (!isBlank(row[c])) {
          order.push({ r, c });
        }
      }
    }
    const work = grid.map((row) => row.map((ch) => isBlank(ch) ? ch : " "));
    const perTick = Math.max(1, Math.round(order.length / 70 * speed));
    let filled = 0;
    return createLoop(
      () => {
        for (let i = 0; i < perTick && filled < order.length; i += 1) {
          const cell = order[filled];
          work[cell.r][cell.c] = grid[cell.r][cell.c];
          filled += 1;
        }
        if (filled >= order.length) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, work.map((row) => row.join("")).join("\n"));
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/slide.js
  function slide(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
    const step = Math.max(1, Math.round(width / 30 * speed));
    const rows = grid.map((cells, r) => ({
      cells,
      fromLeft: r % 2 === 0,
      offset: width + randInt(0, Math.round(width / 3))
    }));
    const renderRow = (row) => {
      if (row.offset <= 0) {
        return row.cells.join("");
      }
      if (row.fromLeft) {
        const visible = Math.max(0, row.cells.length - row.offset);
        return row.cells.slice(row.cells.length - visible).join("");
      }
      const pad = Math.min(row.offset, width);
      return " ".repeat(pad) + row.cells.join("").slice(0, Math.max(0, width - pad));
    };
    return createLoop(
      () => {
        let moving = 0;
        for (const row of rows) {
          if (row.offset > 0) {
            row.offset = Math.max(0, row.offset - step);
            if (row.offset > 0) {
              moving += 1;
            }
          }
        }
        if (moving === 0) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        setText(element, rows.map(renderRow).join("\n"));
        return true;
      },
      { fps: options.fps || 30 }
    );
  }

  // src/effects/burn.js
  function burn(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const height = grid.length;
    const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
    const fronts = [];
    for (let c = 0; c < width; c += 1) {
      fronts.push({ y: -Math.random() * 3, rate: (0.25 + Math.random() * 0.35) * speed });
    }
    const render = () => grid.map((row, r) => {
      let out = "";
      for (let c = 0; c < row.length; c += 1) {
        if (isBlank(row[c])) {
          out += row[c];
        } else if (r < fronts[c].y - 1) {
          out += row[c];
        } else if (r <= fronts[c].y) {
          out += pick(BLOCKS);
        } else {
          out += " ";
        }
      }
      return out;
    }).join("\n");
    return createLoop(
      () => {
        let burning = 0;
        for (const front of fronts) {
          front.y += front.rate;
          if (front.y <= height + 1) {
            burning += 1;
          }
        }
        if (burning === 0) {
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

  // src/effects/vhstape.js
  function vhstape(target, options = {}) {
    const element = resolveTarget(target);
    const finalText = getText(element);
    const speed = options.speed || 1;
    const grid = toLines(finalText).map(toCells);
    const height = Math.max(1, grid.length);
    const totalTicks = Math.max(1, Math.round(80 / speed));
    let tick = 0;
    const renderGlitched = (bandCount) => {
      const glitchedRows = /* @__PURE__ */ new Map();
      for (let b = 0; b < bandCount; b += 1) {
        const startRow = randInt(0, Math.max(0, height - 1));
        const bandHeight = randInt(1, 2);
        const shift = randInt(-6, 6);
        for (let r = startRow; r < Math.min(height, startRow + bandHeight); r += 1) {
          glitchedRows.set(r, shift);
        }
      }
      return grid.map((row, r) => {
        if (!glitchedRows.has(r)) {
          return row.join("");
        }
        const shift = glitchedRows.get(r);
        let out = "";
        for (let c = 0; c < row.length; c += 1) {
          const source = row[c - shift];
          const ch = source === void 0 ? " " : source;
          out += Math.random() < 0.18 ? pick(DEFAULT_GLYPHS) : ch;
        }
        return out;
      }).join("\n");
    };
    return createLoop(
      () => {
        tick += 1;
        if (tick >= totalTicks) {
          setText(element, finalText);
          if (options.onDone) {
            options.onDone();
          }
          return false;
        }
        const intensity = 1 - tick / totalTicks;
        const bandCount = Math.max(1, Math.round(intensity * 4));
        setText(element, renderGlitched(bandCount));
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
      textShadow: host.style.textShadow,
      animation: host.style.animation
    };
    if (glow) {
      host.style.textShadow = `0 0 5px ${toGlow(color, 0.5)}, 0 0 10px ${toGlow(color, 0.3)}`;
    }
    if (flicker) {
      host.style.animation = "rte-crt-flicker 0.15s infinite alternate";
    }
    const parent = host.parentNode || host;
    const previousParentPosition = parent.style.position;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const scanlines = document.createElement("div");
    scanlines.style.cssText = `position:absolute;left:${host.offsetLeft}px;top:${host.offsetTop}px;width:${host.offsetWidth}px;height:${host.offsetHeight}px;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(0,0,0,${scanlineOpacity}) 0px,rgba(0,0,0,${scanlineOpacity}) 1px,transparent 1px,transparent 2px);`;
    parent.appendChild(scanlines);
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
        parent.style.position = previousParentPosition;
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

  // src/effects/decrypt2.js
  var TICK_MS = 33;
  function decrypt2(target, options = {}) {
    const speed = options.speed || 1;
    const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;
    return animateStage(target, options, (stage) => {
      const cells = stage.targets.map((t) => ({
        t,
        flips: Math.max(1, Math.round(randInt(6, 34) / speed)),
        current: pick(glyphs)
      }));
      let doneTicks = 0;
      return (elapsed) => {
        const ticks = Math.floor(elapsed / TICK_MS);
        while (doneTicks < ticks) {
          doneTicks += 1;
          for (const cell of cells) {
            if (cell.flips > 0) {
              cell.flips -= 1;
              cell.current = cell.flips === 0 ? cell.t.ch : pick(glyphs);
            }
          }
        }
        stage.clear();
        let unresolved = 0;
        for (const cell of cells) {
          if (cell.flips > 0) {
            unresolved += 1;
            stage.ctx.globalAlpha = 0.55;
            stage.drawChar(cell.current, cell.t.x, cell.t.y);
            stage.ctx.globalAlpha = 1;
          } else {
            stage.drawChar(cell.t.ch, cell.t.x, cell.t.y);
          }
        }
        return unresolved > 0;
      };
    });
  }

  // src/effects/print2.js
  function print2(target, options = {}) {
    const speed = options.speed || 1;
    const cps = (options.cps || 60) * speed;
    return animateStage(target, options, (stage) => {
      const cells = stage.targets;
      return (elapsed) => {
        stage.clear();
        const revealed = Math.min(cells.length, Math.floor(elapsed / 1e3 * cps));
        for (let i = 0; i < revealed; i += 1) {
          const age = revealed - i;
          if (age <= 4) {
            stage.ctx.save();
            stage.ctx.shadowColor = "#ffffff";
            stage.ctx.shadowBlur = 10 - age * 2;
            stage.drawChar(cells[i].ch, cells[i].x, cells[i].y, age <= 2 ? "#ffffff" : stage.color);
            stage.ctx.restore();
          } else {
            stage.drawChar(cells[i].ch, cells[i].x, cells[i].y);
          }
        }
        if (revealed < cells.length) {
          const head = cells[revealed];
          stage.ctx.save();
          stage.ctx.shadowColor = "#ffffff";
          stage.ctx.shadowBlur = 12;
          stage.drawChar("\u2588", head.x, head.y, "#ffffff");
          stage.ctx.restore();
        }
        return revealed < cells.length;
      };
    });
  }

  // src/effects/overflow2.js
  function overflow2(target, options = {}) {
    const speed = options.speed || 1;
    const cycles = options.cycles || 3;
    return animateStage(target, options, (stage) => {
      const rowMap = /* @__PURE__ */ new Map();
      for (const t of stage.targets) {
        if (!rowMap.has(t.y)) {
          rowMap.set(t.y, []);
        }
        rowMap.get(t.y).push(t);
      }
      const rows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0]).map((entry) => ({ y: entry[0], cells: entry[1] }));
      const blockHeight = Math.max(stage.cellH, rows.length * stage.cellH);
      const totalScroll = cycles * blockHeight;
      const duration = 1800 / speed;
      return (elapsed) => {
        stage.clear();
        const progress = clamp01(elapsed / duration);
        const scroll = (1 - easeOutCubic(progress)) * totalScroll;
        for (const row of rows) {
          let y = row.y + scroll;
          const top = rows[0].y;
          y = top + ((y - top) % blockHeight + blockHeight) % blockHeight;
          for (const cell of row.cells) {
            stage.drawChar(cell.ch, cell.x, y);
          }
        }
        return progress < 1;
      };
    });
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

  // src/effects/beams.js
  function beams(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const rowYs = Array.from(new Set(stage.targets.map((t) => t.y))).sort((a, b) => a - b);
      const colXs = Array.from(new Set(stage.targets.map((t) => t.x))).sort((a, b) => a - b).filter((x, i) => i % 4 === 0);
      const sweeps = [];
      for (const y of rowYs) {
        sweeps.push({
          axis: "row",
          pos: y,
          dir: Math.random() < 0.5 ? 1 : -1,
          head: 0,
          delay: randInt(0, Math.round(1100 / speed)),
          velocity: (500 + Math.random() * 500) * speed,
          length: stage.width
        });
      }
      for (const x of colXs) {
        sweeps.push({
          axis: "col",
          pos: x,
          dir: Math.random() < 0.5 ? 1 : -1,
          head: 0,
          delay: randInt(0, Math.round(1100 / speed)),
          velocity: (400 + Math.random() * 400) * speed,
          length: stage.height
        });
      }
      const lit = /* @__PURE__ */ new Set();
      let wipeStart = 0;
      const wipeDuration = 700 / speed;
      return (elapsed, dt) => {
        stage.clear();
        let sweeping = 0;
        for (const sweep2 of sweeps) {
          if (elapsed < sweep2.delay) {
            sweeping += 1;
            continue;
          }
          if (sweep2.head < sweep2.length + 60) {
            sweep2.head += sweep2.velocity * dt / 1e3;
            sweeping += 1;
          }
          const headPos = sweep2.dir === 1 ? sweep2.head : sweep2.length - sweep2.head;
          for (const t of stage.targets) {
            if (lit.has(t)) {
              continue;
            }
            if (sweep2.axis === "row" && t.y === sweep2.pos) {
              if (sweep2.dir === 1 && t.x <= headPos || sweep2.dir === -1 && t.x >= headPos) {
                lit.add(t);
              }
            } else if (sweep2.axis === "col" && t.x === sweep2.pos) {
              if (sweep2.dir === 1 && t.y <= headPos || sweep2.dir === -1 && t.y >= headPos) {
                lit.add(t);
              }
            }
          }
          if (sweep2.head < sweep2.length + 60) {
            for (let i = 0; i < 3; i += 1) {
              const offset = i * stage.cellW * sweep2.dir;
              stage.ctx.globalAlpha = 1 - i * 0.3;
              if (sweep2.axis === "row") {
                stage.drawChar(pick(DEFAULT_GLYPHS), headPos - offset, sweep2.pos, "#ffffff");
              } else {
                stage.drawChar(pick(DEFAULT_GLYPHS), sweep2.pos, headPos - i * stage.cellH * sweep2.dir, "#ffffff");
              }
              stage.ctx.globalAlpha = 1;
            }
          }
        }
        if (sweeping === 0 && wipeStart === 0) {
          wipeStart = elapsed;
        }
        const wipeFront = wipeStart === 0 ? -1 : clamp01((elapsed - wipeStart) / wipeDuration) * stage.height;
        for (const t of stage.targets) {
          if (!lit.has(t)) {
            continue;
          }
          if (t.y <= wipeFront) {
            stage.drawChar(t.ch, t.x, t.y);
          } else {
            stage.ctx.globalAlpha = 0.35;
            stage.drawChar(t.ch, t.x, t.y);
            stage.ctx.globalAlpha = 1;
          }
        }
        return sweeping > 0 || wipeStart === 0 || wipeFront < stage.height;
      };
    });
  }

  // src/effects/bubbles.js
  function bubbles(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const radius = Math.max(6, stage.cellH * 0.7);
      const all = stage.targets.map((t) => ({
        t,
        y: t.y - stage.height * (0.2 + Math.random() * 0.8) - randInt(20, 120),
        v: (50 + Math.random() * 90) * speed,
        phase: Math.random() * Math.PI * 2,
        color: pick(SPARK_COLORS),
        poppedAt: -1
      }));
      return (elapsed, dt) => {
        stage.clear();
        let floating = 0;
        for (const bubble of all) {
          if (bubble.poppedAt < 0) {
            bubble.y += bubble.v * dt / 1e3;
            if (bubble.y >= bubble.t.y) {
              bubble.y = bubble.t.y;
              bubble.poppedAt = elapsed;
            }
          }
          if (bubble.poppedAt < 0) {
            floating += 1;
            const sway = Math.sin(elapsed / 350 + bubble.phase) * stage.cellW * 0.8;
            const x = bubble.t.x + sway;
            stage.ctx.strokeStyle = bubble.color;
            stage.ctx.globalAlpha = 0.6;
            stage.ctx.lineWidth = 1;
            stage.ctx.beginPath();
            stage.ctx.arc(x + stage.cellW / 2, bubble.y + stage.cellH / 2, radius, 0, Math.PI * 2);
            stage.ctx.stroke();
            stage.ctx.globalAlpha = 1;
            stage.drawChar(bubble.t.ch, x, bubble.y);
          } else {
            const since = elapsed - bubble.poppedAt;
            if (since < 250) {
              const grow = since / 250;
              stage.ctx.strokeStyle = bubble.color;
              stage.ctx.globalAlpha = 1 - grow;
              stage.ctx.beginPath();
              stage.ctx.arc(
                bubble.t.x + stage.cellW / 2,
                bubble.t.y + stage.cellH / 2,
                radius * (1 + grow),
                0,
                Math.PI * 2
              );
              stage.ctx.stroke();
              stage.ctx.globalAlpha = 1;
              floating += 1;
            }
            stage.drawChar(bubble.t.ch, bubble.t.x, bubble.t.y);
          }
        }
        return floating > 0;
      };
    });
  }

  // src/effects/spray.js
  function spray(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const nozzleX = 0;
      const nozzleY = stage.height;
      const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
      const spreadDuration = 1600 / speed;
      const flightDuration = 450 / speed;
      const parts = shuffled.map((t, i) => ({
        t,
        start: i / Math.max(1, shuffled.length - 1) * spreadDuration,
        // Kontrollpunkt fuer den Bogen: seitlich versetzt zwischen Duese und Ziel
        cx: (nozzleX + t.x) / 2 + (Math.random() - 0.5) * stage.width * 0.4,
        cy: Math.min(nozzleY, t.y) - Math.random() * stage.height * 0.3
      }));
      return (elapsed) => {
        stage.clear();
        let flying = 0;
        for (const part of parts) {
          const progress = clamp01((elapsed - part.start) / flightDuration);
          if (elapsed < part.start) {
            flying += 1;
            continue;
          }
          if (progress < 1) {
            flying += 1;
            const e = easeOutCubic(progress);
            const inv = 1 - e;
            const x = inv * inv * nozzleX + 2 * inv * e * part.cx + e * e * part.t.x;
            const y = inv * inv * nozzleY + 2 * inv * e * part.cy + e * e * part.t.y;
            stage.drawChar(part.t.ch, x, y, "#ffffff");
          } else {
            stage.drawChar(part.t.ch, part.t.x, part.t.y);
          }
        }
        return flying > 0;
      };
    });
  }

  // src/effects/swarm.js
  var SWARM_SIZE = 36;
  function swarm(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
      const groups = [];
      for (let i = 0; i < shuffled.length; i += SWARM_SIZE) {
        const chars = shuffled.slice(i, i + SWARM_SIZE);
        const centroidX = chars.reduce((sum, t) => sum + t.x, 0) / chars.length;
        const centroidY = chars.reduce((sum, t) => sum + t.y, 0) / chars.length;
        const edge = Math.floor(Math.random() * 4);
        const startX = edge === 0 ? -40 : edge === 1 ? stage.width + 40 : Math.random() * stage.width;
        const startY = edge === 2 ? -40 : edge === 3 ? stage.height + 40 : Math.random() * stage.height;
        groups.push({
          chars: chars.map((t) => ({
            t,
            jitterPhase: Math.random() * Math.PI * 2,
            jitterAmp: 10 + Math.random() * 25
          })),
          startX,
          startY,
          centroidX,
          centroidY,
          // Kontrollpunkt fuer die geschwungene Bahn
          cx: Math.random() * stage.width,
          cy: Math.random() * stage.height,
          delay: groups.length * 420 / speed,
          duration: 1300 / speed
        });
      }
      return (elapsed) => {
        stage.clear(0.4);
        let moving = 0;
        for (const group of groups) {
          const progress = clamp01((elapsed - group.delay) / group.duration);
          if (elapsed < group.delay) {
            moving += 1;
            continue;
          }
          if (progress < 1) {
            moving += 1;
          }
          const e = easeOutCubic(progress);
          const inv = 1 - e;
          const swarmX = inv * inv * group.startX + 2 * inv * e * group.cx + e * e * group.centroidX;
          const swarmY = inv * inv * group.startY + 2 * inv * e * group.cy + e * e * group.centroidY;
          for (const member of group.chars) {
            const wobble = member.jitterAmp * (1 - e);
            const jx = Math.cos(elapsed / 120 + member.jitterPhase) * wobble;
            const jy = Math.sin(elapsed / 150 + member.jitterPhase) * wobble;
            const offsetX = (member.t.x - group.centroidX) * e;
            const offsetY = (member.t.y - group.centroidY) * e;
            stage.drawChar(member.t.ch, swarmX + offsetX + jx, swarmY + offsetY + jy);
          }
        }
        return moving > 0;
      };
    });
  }

  // src/effects/unstable.js
  function unstable(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const cx = stage.width / 2;
      const cy = stage.height / 2;
      const shakeDuration = 500 / speed;
      const explodeDuration = 450 / speed;
      const gatherDuration = 900 / speed;
      const parts = stage.targets.map((t) => {
        const dx = t.x - cx;
        const dy = t.y - cy;
        const len = Math.max(1, Math.hypot(dx, dy));
        const throwDist = 180 + Math.random() * 260;
        return {
          t,
          ex: t.x + dx / len * throwDist,
          ey: t.y + dy / len * throwDist
        };
      });
      return (elapsed) => {
        stage.clear();
        if (elapsed < shakeDuration) {
          const intensity = elapsed / shakeDuration * 4;
          for (const part of parts) {
            const jx = (Math.random() - 0.5) * intensity;
            const jy = (Math.random() - 0.5) * intensity;
            stage.drawChar(part.t.ch, part.t.x + jx, part.t.y + jy);
          }
          return true;
        }
        const sinceShake = elapsed - shakeDuration;
        if (sinceShake < explodeDuration) {
          const e2 = easeOutCubic(clamp01(sinceShake / explodeDuration));
          for (const part of parts) {
            const x = part.t.x + (part.ex - part.t.x) * e2;
            const y = part.t.y + (part.ey - part.t.y) * e2;
            stage.drawChar(part.t.ch, x, y, "#ffffff");
          }
          return true;
        }
        const progress = clamp01((sinceShake - explodeDuration) / gatherDuration);
        const e = easeOutCubic(progress);
        for (const part of parts) {
          const x = part.ex + (part.t.x - part.ex) * e;
          const y = part.ey + (part.t.y - part.ey) * e;
          stage.drawChar(part.t.ch, x, y);
        }
        return progress < 1;
      };
    });
  }

  // src/effects/rings.js
  function rings(target, options = {}) {
    const speed = options.speed || 1;
    return animateStage(target, options, (stage) => {
      const cx = stage.width / 2;
      const cy = stage.height / 2;
      const maxRadius = Math.min(stage.width, stage.height) * 0.42;
      const ringCount = Math.max(2, Math.min(6, Math.floor(maxRadius / (stage.cellH * 1.5))));
      const spinDuration = 1500 / speed;
      const disperseDuration = 850 / speed;
      const parts = stage.targets.map((t, i) => {
        const ring = i % ringCount;
        return {
          t,
          radius: maxRadius * ((ring + 1) / ringCount),
          angle: i / Math.max(1, stage.targets.length) * Math.PI * 2 * ringCount,
          // Innere Ringe drehen schneller, Richtung alternierend
          rotation: (1.2 - ring * 0.15) * (ring % 2 === 0 ? 1 : -1)
        };
      });
      return (elapsed, dt) => {
        stage.clear(0.35);
        const dtS = dt * speed / 1e3;
        if (elapsed < spinDuration) {
          for (const part of parts) {
            part.angle += part.rotation * dtS;
            const x = cx + Math.cos(part.angle) * part.radius;
            const y = cy + Math.sin(part.angle) * part.radius * 0.6;
            stage.drawChar(part.t.ch, x, y);
          }
          return true;
        }
        const progress = clamp01((elapsed - spinDuration) / disperseDuration);
        const e = easeOutCubic(progress);
        for (const part of parts) {
          const ringX = cx + Math.cos(part.angle) * part.radius;
          const ringY = cy + Math.sin(part.angle) * part.radius * 0.6;
          const x = ringX + (part.t.x - ringX) * e;
          const y = ringY + (part.t.y - ringY) * e;
          stage.drawChar(part.t.ch, x, y);
        }
        return progress < 1;
      };
    });
  }

  // src/index.js
  var version = "0.4.1";
  return __toCommonJS(index_exports);
})();
