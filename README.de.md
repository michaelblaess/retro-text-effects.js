# retro-text-effects.js

<p align="center">
  <img src="docs/flags/gb.svg" height="13" alt=""> <a href="README.md">English</a> ·
  <img src="docs/flags/de.svg" height="13" alt=""> <b>Deutsch</b>
</p>

---

Ein **Browser-Port von [TerminalTextEffects (TTE)](https://github.com/ChrisBuilds/terminaltexteffects)**,
der Python-Terminal-Effekt-Bibliothek - neu gebaut in abhängigkeitsfreiem Vanilla-JavaScript,
ausgeliefert als eine einzige Datei, die du in jede Seite einbinden kannst.

**[Live-Demo](https://michaelblaess.github.io/retro-text-effects.js/)** - jeder Effekt
läuft direkt im Browser.

Die Effekte gibt es in zwei Gruppen:

- **Text-Effekte** laufen auf einem simplen `<pre>`-Block, indem sie nur dessen Textinhalt
  umschreiben - kein Canvas, der Text bleibt markierbar, Box-Drawing-Zeichen bleiben
  ausgerichtet, und die Farbe wird von deinem Element geerbt (ideal für eine ohnehin
  grüne Konsole).
- **Canvas-Effekte** legen temporär ein Canvas über das Element für freie 2D-Bewegung der
  Zeichen (Feuerwerk, Schwarzes Loch, Regen, ...), blenden es aus und geben den
  unveränderten Text frei.

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

### Text-Effekte (ohne Canvas)

Diese schreiben nur den `textContent` des Elements um, Frame für Frame:

| Effekt | Was er macht |
| --- | --- |
| `decrypt(el, opts)` | Zellen flackern durch Zufallsglyphen und rasten auf den Zieltext ein. |
| `print(el, opts)` | Enthüllt den Text in Leserichtung mit wanderndem Druckkopf. |
| `matrix(el, opts)` | Jede Spalte löst sich von oben nach unten hinter einer fallenden Glyphe auf. |
| `overflow(el, opts)` | Zeilen scrollen und mischen sich, dann ordnen sie sich. |
| `errorcorrect(el, opts)` | Zeichenpaare starten vertauscht und tauschen sich eines nach dem anderen zurück. |
| `randomsequence(el, opts)` | Die Zeichen erscheinen nacheinander in völlig zufälliger Reihenfolge. |
| `middleout(el, opts)` | Der Text wächst aus der Mitte des Blocks nach außen. |
| `sweep(el, opts)` | Ein Rauschband fegt von links nach rechts und lässt den Text zurück. |
| `pour(el, opts)` | Der Text füllt sich von unten wie eine Flüssigkeit, in Schlangenlinien. |
| `slide(el, opts)` | Die Zeilen schieben sich als Blöcke herein, abwechselnd von links und rechts. |
| `burn(el, opts)` | Eine Glutfront mit ausgefranster Kante frisst sich durch den Block und brennt den Text ein. |
| `vhstape(el, opts)` | Störbänder verschieben Zeilen und streuen Rauschen, bis das Tracking steht. |
| `crt(el, opts)` | Dauerhafte CRT-*Stil*-Behandlung - Phosphor-Glow, Scanlines, leichtes Flicker. `cancel()` entfernt sie. |

### Canvas-Effekte

Diese legen temporär ein Canvas über das Element, bewegen die Zeichen frei in 2D
und blenden dann aus, um den unveränderten Text freizugeben:

| Effekt | Was er macht |
| --- | --- |
| `matrix2(el, opts)` | Der klassische Fallende-Glyphen-Schirm: Katakana-Regen, dann Reveal (Canvas-Zwilling von `matrix`). |
| `decrypt2(el, opts)` | Canvas-Zwilling von `decrypt`: der Text taucht hell aus gedimmtem Chiffretext auf. |
| `print2(el, opts)` | Canvas-Zwilling von `print`: glühender Druckkopf mit Nachglühen auf frischen Zeichen. |
| `overflow2(el, opts)` | Canvas-Zwilling von `overflow`: der Block rotiert subpixel-glatt vorbei und bremst auf den Text ein. |
| `beams(el, opts)` | Helle Beams fegen über Zeilen und Spalten, dann bringt ein Wipe den Text auf volle Helligkeit. |
| `rain(el, opts)` | Jedes Zeichen fällt von oben senkrecht an seinen Platz. |
| `bouncyballs(el, opts)` | Zeichen fallen als bunte Bälle und springen in Position. |
| `bubbles(el, opts)` | Jedes Zeichen schwebt in einer eigenen Blase herab und platzt an seinem Platz. |
| `scattered(el, opts)` | Zeichen starten verstreut und gleiten an ihren Platz. |
| `expand(el, opts)` | Der ganze Text bricht aus der Mitte nach außen auf. |
| `spray(el, opts)` | Eine Düse in der Ecke sprüht die Zeichen in Bögen auf den Block. |
| `swarm(el, opts)` | Die Zeichen kommen in wuselnden Schwärmen an und setzen sich bereichsweise. |
| `fireworks(el, opts)` | Raketen steigen auf, explodieren in Funken und schleudern ihre Zeichen in den Text. |
| `blackhole(el, opts)` | Zeichen spiralen in eine Singularität und brechen dann zurück in den Text aus. |
| `rings(el, opts)` | Zeichen kreisen auf konzentrischen Ringen und zerstreuen sich dann an ihre Plätze. |
| `unstable(el, opts)` | Der Text zittert, explodiert Richtung Ränder und setzt sich wieder zusammen. |
| `laseretch(el, opts)` | Ein Laserstrahl brennt den Text ein und wirft fallende Funken ab. |

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
| `onDone` | function | - | alle |
| `fps` | number | `30` | Text-Effekte (Canvas-Effekte laufen delta-getaktet auf rAF) |
| `glyphs` | string | eingebauter Pool | `decrypt`, `decrypt2`, `matrix`, `matrix2`, `sweep` |
| `preserveWhitespace` | boolean | `true` | `decrypt` |
| `cps` | number | `60` | `print`, `print2` |
| `head` | string | `█` | `print` |
| `cycles` | number | `3` | `overflow`, `overflow2` |
| `ratio` | number | `0.1` | `errorcorrect` (Anteil vertauschter Paare) |
| `band` | number | `6` | `sweep` (Breite des Rauschbands) |
| `duration` | number (ms) | `1500` | `matrix2` |
| `fontSize` | number | `20` | `matrix2` |
| `color` | string | `#00ff00` / `#33ff33` | `matrix2`, `crt` |
| `scanlineOpacity` | number | `0.15` | `crt` |
| `glow` | boolean | `true` | `crt` |
| `flicker` | boolean | `true` | `crt` |

Alle übrigen Canvas-Effekte nehmen `speed` und `onDone`; Schrift, Farbe und Zeichenraster
werden vom Ziel-Element gelesen, damit die Übergabe an den echten Text nahtlos ist.
`glyphs` verstehen zusätzlich `decrypt2` und `matrix2`.

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

[Apache-2.0](LICENSE). Dies ist ein Browser-Port von
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) (Python, MIT) -
die Effekte wurden für das DOM von Grund auf neu gebaut, kein Code wurde kopiert.
