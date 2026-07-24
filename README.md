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

The effects come in three groups:

- **Text effects** run on a plain `<pre>` block by rewriting its text content - no canvas,
  the text stays selectable, box-drawing characters stay aligned, and the colour is inherited
  from your element (perfect for an already-green console).
- **Canvas effects** lay a temporary canvas over the element for free 2D character motion
  (fireworks, black hole, rain, ...), then fade it out and reveal the untouched text below.
- **Style effects** (`crt`, `colorshift`, `highlight`) recolour or light the element in place
  without ever touching the text, so they layer cleanly over an already-visible console.

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
| `errorcorrect(el, opts)` | Character pairs start swapped in the wrong place and swap back one by one. |
| `randomsequence(el, opts)` | The characters appear one after another in completely random order. |
| `middleout(el, opts)` | The text grows from the centre of the block outward. |
| `sweep(el, opts)` | A noisy band sweeps left to right and leaves the resolved text behind. |
| `pour(el, opts)` | The text fills up from the bottom row like a liquid, snaking back and forth. |
| `slide(el, opts)` | The rows slide in as blocks, alternating from the left and the right. |
| `burn(el, opts)` | An ember front with a ragged edge eats through the block and burns the text in. |
| `vhstape(el, opts)` | Glitch bands shift rows sideways and sprinkle noise until the tracking settles. |
| `wipe(el, opts)` | A straight wavefront sweeps across in a chosen direction and leaves the resolved text behind. |
| `slice(el, opts)` | Each row is cut in half; the two pieces slide inward until they butt together in the middle. |
| `waves(el, opts)` | An undulating crest rolls across the block and resolves the text as it passes. |

### Canvas effects

These lay a temporary canvas over the element, animate the characters in free 2D
motion, then fade out and reveal the untouched text:

| Effect | What it does |
| --- | --- |
| `matrix2(el, opts)` | The classic falling-glyph screen: katakana rain, then reveal (canvas twin of `matrix`). |
| `decrypt2(el, opts)` | Canvas twin of `decrypt`: the resolved text emerges bright from dimmed ciphertext. |
| `print2(el, opts)` | Canvas twin of `print`: a glowing print head with a hot afterglow on fresh characters. |
| `overflow2(el, opts)` | Canvas twin of `overflow`: the block spins past sub-pixel-smooth and decelerates onto the text. |
| `beams(el, opts)` | Bright beams sweep the rows and columns, then a wipe brings the text to full brightness. |
| `rain(el, opts)` | Every character falls from above straight into its place. |
| `bouncyballs(el, opts)` | Characters drop in as coloured balls and bounce into position. |
| `bubbles(el, opts)` | Every character floats down in its own bubble, swaying, and pops into place. |
| `scattered(el, opts)` | Characters start scattered across the stage and glide to their spot. |
| `expand(el, opts)` | The whole text bursts outward from the centre. |
| `spray(el, opts)` | A nozzle in the corner sprays the characters onto the block in curved arcs. |
| `swarm(el, opts)` | The characters arrive in wobbling swarms that settle area by area. |
| `fireworks(el, opts)` | Rockets launch, explode into sparks and throw their characters to the text. |
| `blackhole(el, opts)` | Characters spiral into a singularity, then erupt back out to the text. |
| `rings(el, opts)` | Characters orbit on concentric spinning rings, then disperse to their positions. |
| `unstable(el, opts)` | The text shakes, explodes towards the edges and reassembles. |
| `laseretch(el, opts)` | A laser beam traces the text in and throws off falling sparks. |
| `binarypath(el, opts)` | Characters enter as streams of `0`/`1` and travel to their spot at right angles, then resolve. |
| `crumble(el, opts)` | The text crumbles into scattered dust, then the dust is vacuumed up and reforms. |
| `orbittingvolley(el, opts)` | Four orbiting launchers fire the characters inward, filling the text from the centre out. |
| `smoke(el, opts)` | A wall of drifting smoke rolls across and leaves the characters colourised behind it. |
| `spotlights(el, opts)` | Spotlights sweep the dark block, converge on the centre and flood it to reveal the text. |
| `synthgrid(el, opts)` | A neon grid grows from the centre, the characters fill in diagonally, then the grid fades. |
| `thunderstorm(el, opts)` | Lightning bolts strike the block one after another, lighting up the text slab by slab. |

### Style effects (no text rewrite)

These recolour or light the element in place - they never touch the `textContent`,
so they layer cleanly over an already-visible console:

| Effect | What it does |
| --- | --- |
| `crt(el, opts)` | Persistent CRT treatment - phosphor glow, scanlines, faint flicker. `cancel()` removes it. |
| `colorshift(el, opts)` | Persistent animated gradient that keeps sliding across the glyphs. `cancel()` removes it. |
| `highlight(el, opts)` | Runs a single specular highlight across the text, then restores the original colours. |

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
| `glyphs` | string | built-in pool | `decrypt`, `decrypt2`, `matrix`, `matrix2`, `sweep` |
| `preserveWhitespace` | boolean | `true` | `decrypt` |
| `cps` | number | `60` | `print`, `print2` |
| `head` | string | `█` | `print` |
| `cycles` | number | `3` | `overflow`, `overflow2` |
| `ratio` | number | `0.1` | `errorcorrect` (share of swapped pairs) |
| `band` | number | `6` | `sweep` (width of the noise band) |
| `duration` | number (ms) | `1500` | `matrix2` |
| `fontSize` | number | `20` | `matrix2` |
| `color` | string | `#00ff00` / `#33ff33` | `matrix2`, `crt`, `synthgrid`, `highlight` |
| `scanlineOpacity` | number | `0.15` | `crt` |
| `glow` | boolean | `true` | `crt` |
| `flicker` | boolean | `true` | `crt` |
| `direction` | string | `diagonal` / `right` | `wipe` (`left`/`right`/`up`/`down`/`diagonal`), `highlight` (`left`/`right`) |
| `amplitude` | number | `4` | `waves` (how far the crest bends per row) |
| `colors` | string[] | retro palette | `colorshift` |

All other canvas effects take `speed` and `onDone`; font, colour and character grid
are read from the target element so the hand-off to the real text is seamless.
`glyphs` is also accepted by `decrypt2` and `matrix2`.

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
