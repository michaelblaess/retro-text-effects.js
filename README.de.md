# retro-text-effects.js

<p align="center">
  <img src="docs/flags/gb.svg" height="13" alt=""> <a href="README.md">English</a> ·
  <img src="docs/flags/de.svg" height="13" alt=""> <b>Deutsch</b>
</p>

---

Retro-Terminal-Texteffekte für den Browser - **decrypt**, **print**, **matrix**,
**matrix2**, **overflow**, **crt** - als eine einzige, abhängigkeitsfreie Datei, die
du in jede Seite einbinden kannst.

Die meisten Effekte laufen auf einem simplen `<pre>`-Block, indem sie nur dessen
Textinhalt umschreiben - kein Canvas, der Text bleibt markierbar, Box-Drawing-Zeichen
bleiben ausgerichtet, und die Farbe wird von deinem Element geerbt (ideal für eine
ohnehin grüne Konsole). Zwei Effekte gehen darüber hinaus: `matrix2` ist ein
Canvas-Overlay für den klassischen Fallende-Glyphen-Look, und `crt` legt eine
dauerhafte Scanline-/Glow-/Flicker-Behandlung über ein beliebiges Element.

## Schnellstart

```html
<pre id="log">=== System bereit ===</pre>

<script src="retro-text-effects.min.js"></script>
<script>
  RetroTextEffects.decrypt('#log');
</script>
```

Mehr ist es nicht: ein Script-Tag stellt `window.RetroTextEffects` bereit, dann rufst
du einen Effekt mit einem Element oder einem CSS-Selektor auf.

## Effekte

| Effekt | Was er macht |
| --- | --- |
| `decrypt(el, opts)` | Zellen flackern durch Zufallsglyphen und rasten auf den Zieltext ein. |
| `print(el, opts)` | Enthüllt den Text in Leserichtung mit wanderndem Druckkopf. |
| `matrix(el, opts)` | Jede Spalte löst sich von oben nach unten hinter einer fallenden Glyphe auf (reiner Text). |
| `matrix2(el, opts)` | Canvas-Overlay: Katakana-Regen über dem Element, blendet aus und gibt den Text frei. |
| `overflow(el, opts)` | Zeilen scrollen und mischen sich, dann ordnen sie sich. |
| `crt(el, opts)` | Dauerhafte CRT-Behandlung - Phosphor-Glow, Scanlines, leichtes Flicker. `cancel()` entfernt sie. |

Jeder Effekt gibt einen kleinen Controller zurück:

```js
const fx = RetroTextEffects.print('#log', { cps: 80, onDone: () => {} });
fx.cancel();        // vorzeitig stoppen
await fx.finished;  // wird aufgeloest, wenn die Animation endet
```

### Gemeinsame Optionen

| Option | Typ | Default | Gilt für |
| --- | --- | --- | --- |
| `speed` | number | `1` | alle |
| `fps` | number | `30` | alle |
| `onDone` | function | - | alle |
| `glyphs` | string | eingebauter Pool | `decrypt`, `matrix` |
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

## Offline / self-hosted einsetzen

Der Build ist eine einzige, self-contained Datei ohne Abhängigkeiten und ohne
externe Requests - es gibt nichts zu hotlinken. Lade `retro-text-effects.min.js`
aus den [Releases](https://github.com/michaelblaess/retro-text-effects.js/releases)
und binde sie mit einem einfachen Script-Tag ein:

```html
<script src="retro-text-effects.min.js"></script>
<script>
  RetroTextEffects.decrypt('#log');
</script>
```

Das funktioniert überall, wo du eine statische JS-Datei ausliefern kannst - statische
Seiten, Offline-Apps oder eine servergerenderte View, in die du sie als lokales Asset
einbindest.

## Aus dem Quellcode bauen

```bash
npm install
npm run lint
npm run build   # -> dist/retro-text-effects.js + dist/retro-text-effects.min.js
```

Öffne `demo/index.html` im Browser für den Showroom.

## Lizenz

[Apache-2.0](LICENSE). Inspiriert von der Terminal-Bibliothek
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) - dies ist
eine eigenständige Neuimplementierung für den Browser, kein Port ihres Codes.
