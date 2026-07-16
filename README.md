# retro-text-effects.js

<p align="center">
  <img src="docs/flags/gb.svg" height="13" alt=""> <b>English</b> ·
  <img src="docs/flags/de.svg" height="13" alt=""> <a href="README.de.md">Deutsch</a>
</p>

---

A **browser port of [TerminalTextEffects (TTE)](https://github.com/ChrisBuilds/terminaltexteffects)**,
the Python terminal-effects library - rebuilt in dependency-free vanilla JavaScript and
shipped as a single file you can drop into any page.

**[Live demo](https://michaelblaess.github.io/retro-text-effects.js/)** - every effect runs
right in your browser.

The effects come in two groups:

- **Text effects** run on a plain `<pre>` block by rewriting its text content - no canvas,
  the text stays selectable, box-drawing characters stay aligned, and the colour is inherited
  from your element (perfect for an already-green console).
- **Canvas effects** lay a temporary canvas over the element for free 2D character motion
  (fireworks, black hole, rain, ...), then fade it out and reveal the untouched text below.

## Quick start

```html
<pre id="log">=== System ready ===</pre>

<script src="retro-text-effects.min.js"></script>
<script>
  RetroTextEffects.decrypt('#log');
</script>
```

That is the whole integration: one script tag exposes `window.RetroTextEffects`,
then call an effect with an element or a CSS selector.

## Effects

### Text effects (no canvas)

These only rewrite the element's `textContent`, frame by frame:

| Effect | What it does |
| --- | --- |
| `decrypt(el, opts)` | Cells flicker through random glyphs, then lock onto the final text. |
| `print(el, opts)` | Reveals the text in reading order with a moving print head. |
| `matrix(el, opts)` | Each column resolves top-to-bottom behind a falling bright glyph. |
| `overflow(el, opts)` | Rows scroll and reshuffle, then settle into order. |
| `crt(el, opts)` | Persistent CRT *style* treatment - phosphor glow, scanlines, faint flicker. `cancel()` removes it. |

### Canvas effects

These lay a temporary canvas over the element, animate the characters in free 2D
motion, then fade out and reveal the untouched text:

| Effect | What it does |
| --- | --- |
| `matrix2(el, opts)` | The classic falling-glyph screen: katakana rain, then reveal. |
| `rain(el, opts)` | Every character falls from above straight into its place. |
| `bouncyballs(el, opts)` | Characters drop in as coloured balls and bounce into position. |
| `scattered(el, opts)` | Characters start scattered across the stage and glide to their spot. |
| `expand(el, opts)` | The whole text bursts outward from the centre. |
| `fireworks(el, opts)` | Rockets launch, explode into sparks and throw their characters to the text. |
| `blackhole(el, opts)` | Characters spiral into a singularity, then erupt back out to the text. |
| `laseretch(el, opts)` | A laser beam traces the text in and throws off falling sparks. |

Each effect returns a small controller:

```js
const fx = RetroTextEffects.print('#log', { cps: 80, onDone: () => {} });
fx.cancel();        // stop early
await fx.finished;  // resolves when the animation ends
```

### Common options

| Option | Type | Default | Applies to |
| --- | --- | --- | --- |
| `speed` | number | `1` | all |
| `onDone` | function | - | all |
| `fps` | number | `30` | text effects (canvas effects run delta-timed on rAF) |
| `glyphs` | string | built-in pool | `decrypt`, `matrix`, `matrix2` |
| `preserveWhitespace` | boolean | `true` | `decrypt` |
| `cps` | number | `60` | `print` |
| `head` | string | `█` | `print` |
| `cycles` | number | `3` | `overflow` |
| `duration` | number (ms) | `1500` | `matrix2` |
| `fontSize` | number | `20` | `matrix2` |
| `color` | string | `#00ff00` / `#33ff33` | `matrix2`, `crt` |
| `scanlineOpacity` | number | `0.15` | `crt` |
| `glow` | boolean | `true` | `crt` |
| `flicker` | boolean | `true` | `crt` |

The canvas effects (`rain`, `bouncyballs`, `scattered`, `expand`, `fireworks`,
`blackhole`, `laseretch`) take `speed` and `onDone`; font, colour and character grid
are read from the target element so the hand-off to the real text is seamless.

## Use offline / self-hosted

The build is a single self-contained file with no dependencies and no external
requests, so there is nothing to hotlink. Download `retro-text-effects.min.js`
from the [releases](https://github.com/michaelblaess/retro-text-effects.js/releases)
and include it with a plain script tag:

```html
<script src="retro-text-effects.min.js"></script>
<script>
  RetroTextEffects.decrypt('#log');
</script>
```

That works anywhere you can serve a static JS file - static sites, offline apps,
or a server-rendered view where you drop it in as a local asset.

## Build from source

```bash
npm install
npm run lint
npm run build   # -> dist/retro-text-effects.js + dist/retro-text-effects.min.js
```

Open `demo/index.html` in a browser to see the showroom.

## License

[Apache-2.0](LICENSE). This is a browser port of
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) (Python, MIT) -
the effects were rebuilt from scratch for the DOM, no code was copied.
