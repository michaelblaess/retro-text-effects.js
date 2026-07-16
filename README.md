# retro-text-effects.js

<p align="center">
  <img src="docs/flags/gb.svg" height="13" alt=""> <b>English</b> ·
  <img src="docs/flags/de.svg" height="13" alt=""> <a href="README.de.md">Deutsch</a>
</p>

---

Retro terminal text effects for the browser - **decrypt**, **print**, **matrix**,
**matrix2**, **overflow**, **crt** - shipped as a single, dependency-free file you
can drop into any page.

Most effects run on a plain `<pre>` block by rewriting its text content - no canvas,
so the text stays selectable, box-drawing characters stay aligned, and the colour is
inherited from your element (perfect for an already-green console). Two effects step
outside that: `matrix2` is a canvas overlay for the classic falling-glyph look, and
`crt` lays a persistent scanline/glow/flicker treatment over any element.

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

| Effect | What it does |
| --- | --- |
| `decrypt(el, opts)` | Cells flicker through random glyphs, then lock onto the final text. |
| `print(el, opts)` | Reveals the text in reading order with a moving print head. |
| `matrix(el, opts)` | Each column resolves top-to-bottom behind a falling bright glyph (pure text). |
| `matrix2(el, opts)` | Canvas overlay: katakana rain over the element, fading out to reveal the text. |
| `overflow(el, opts)` | Rows scroll and reshuffle, then settle into order. |
| `crt(el, opts)` | Persistent CRT treatment - phosphor glow, scanlines, faint flicker. `cancel()` removes it. |

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
| `fps` | number | `30` | all |
| `onDone` | function | - | all |
| `glyphs` | string | built-in pool | `decrypt`, `matrix` |
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

[Apache-2.0](LICENSE). Inspired by the terminal library
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) - this is an
independent reimplementation for the browser, not a port of its code.
