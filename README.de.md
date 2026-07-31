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

Die Effekte gibt es in vier Gruppen:

- **Text-Effekte** laufen auf einem simplen `<pre>`-Block, indem sie nur dessen Textinhalt
  umschreiben - kein Canvas, der Text bleibt markierbar, Box-Drawing-Zeichen bleiben
  ausgerichtet, und die Farbe wird von deinem Element geerbt (ideal für eine ohnehin
  grüne Konsole).
- **Canvas-Effekte** legen temporär ein Canvas über das Element für freie 2D-Bewegung der
  Zeichen (Feuerwerk, Schwarzes Loch, Regen, ...), blenden es aus und geben den
  unveränderten Text frei.
- **Stil-Effekte** (`crt`, `colorshift`, `highlight`) färben oder beleuchten das Element an
  Ort und Stelle, ohne den Text je anzufassen - sie legen sich sauber über eine bereits
  sichtbare Konsole.
- **Art-Effekte** (`aura`) sind die Ausnahme: sie lesen keinen Text von der Seite, sie
  erzeugen ihn. Aus einem beliebigen Unicode-Zeichen wird eine ASCII-Figur mit einem
  bewegten Ring aus Zeichen, und die Animation läuft, bis du sie abbrichst.

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
| `wipe(el, opts)` | Eine gerade Wellenfront fegt in gewählter Richtung über den Block und lässt den Text zurück. |
| `slice(el, opts)` | Jede Zeile wird halbiert; die beiden Hälften schieben sich zusammen, bis sie in der Mitte aneinanderstoßen. |
| `waves(el, opts)` | Ein wogender Wellenkamm rollt über den Block und löst den Text auf, während er vorbeizieht. |

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
| `binarypath(el, opts)` | Zeichen kommen als Ströme aus `0`/`1` herein und wandern im rechten Winkel an ihren Platz, dann lösen sie sich auf. |
| `crumble(el, opts)` | Der Text zerbröselt zu verstreutem Staub, dann wird der Staub aufgesaugt und formt sich neu. |
| `orbittingvolley(el, opts)` | Vier kreisende Werfer feuern die Zeichen nach innen und bauen den Text aus der Mitte heraus auf. |
| `smoke(el, opts)` | Eine driftende Rauchwand rollt über den Block und lässt die Zeichen eingefärbt zurück. |
| `spotlights(el, opts)` | Scheinwerfer suchen den dunklen Block ab, laufen in der Mitte zusammen und fluten ihn, um den Text zu enthüllen. |
| `synthgrid(el, opts)` | Ein Neon-Gitter wächst aus der Mitte, die Zeichen füllen sich diagonal auf, dann blendet das Gitter aus. |
| `thunderstorm(el, opts)` | Blitze schlagen nacheinander in den Block ein und beleuchten den Text Streifen für Streifen. |

### Stil-Effekte (ohne Text-Neuschreiben)

Diese färben oder beleuchten das Element an Ort und Stelle - sie fassen den `textContent`
nie an und legen sich sauber über eine bereits sichtbare Konsole:

| Effekt | Was er macht |
| --- | --- |
| `crt(el, opts)` | Dauerhafte CRT-Behandlung - Phosphor-Glow, Scanlines, leichtes Flicker. `cancel()` entfernt sie. |
| `colorshift(el, opts)` | Dauerhafter animierter Farbverlauf, der ständig über die Glyphen gleitet. `cancel()` entfernt ihn. |
| `highlight(el, opts)` | Lässt einen einzelnen Glanzstreifen über den Text laufen und stellt danach die Originalfarben wieder her. |

### Art-Effekte (der Text wird erzeugt)

`aura` funktioniert gleich in zwei Punkten anders als alle anderen Effekte. Er liest nicht den
Text des Elements, sondern rastert ein Unicode-Zeichen auf einem Offscreen-Canvas, übersetzt
die Zellen in eine Zeichenrampe und legt einen bewegten Ring aus Terminalzeichen um die Figur.
Wie `crt` ist er dauerhaft - er läuft, bis `cancel()` ihn beendet.

Er ist außerdem der einzige Effekt hier, der **nicht** zum TTE-Port gehört: In
TerminalTextEffects gibt es keine Entsprechung. Die Idee stammt vom animierten ASCII-Geist auf
[ghostty.org](https://ghostty.org/), der Seite des Terminal-Emulators Ghostty. Von Grund auf
für beliebige Zeichen neu gebaut, kein Code von dort übernommen.

| Effekt | Was er macht |
| --- | --- |
| `aura(el, opts)` | Macht aus einem Zeichen eine leuchtende ASCII-Figur mit animierter Aura. Bietet zusätzlich `update()` und `text()`. |
| `asciiArt(zeichen, opts)` | Kein Effekt, sondern eine reine Funktion - gibt die Art als String zurück, fertig für jeden anderen Effekt. |

```js
const geist = RetroTextEffects.aura('#stage', { emoji: '👻', cols: 46 });

geist.update({ variant: 'sonar', motion: 'spin', color: '#35d0ff' });
geist.text();     // die Figur als reiner Text, ohne Aura
geist.cancel();   // beendet ihn und stellt den urspruenglichen Inhalt wieder her

// Oder ohne Animation: die Art in einen beliebigen anderen Effekt kippen
document.querySelector('#stage').textContent = RetroTextEffects.asciiArt('🎃', { cols: 40 });
RetroTextEffects.decrypt('#stage');
```

Sechs Aura-Varianten, aufgelistet in `RetroTextEffects.auraVariants`:

| Variante | Was sie macht |
| --- | --- |
| `shimmer` | Jede Zelle flackert unabhängig - der Klassiker von ghostty.org. |
| `pulse` | Die Helligkeit folgt dem Abstand, die Aura atmet nach außen. |
| `sonar` | Ringe lösen sich nacheinander von der Figur. |
| `orbit` | Ein Lichtbogen kreist um die Figur wie ein Radarstrahl. |
| `updraft` | Ein Rauschfeld driftet nach oben, wie aufsteigende Wärme. |
| `halo` | Ohne Bewegung, nur der gestufte Abstand. |

Drei Bewegungsarten, aufgelistet in `RetroTextEffects.auraMotions`: `off` lässt die Figur
still stehen, `float` neigt sie und lässt sie um ganze Zeilen hüpfen, und `spin` staucht
sie horizontal mit dem Kosinus, was sich wie ein kippender Münzwurf liest. Die Stellungen
werden einmal gerastert und als Schleife abgespielt - eine CSS-Transform würde die Zeichen
selbst mitkippen und das Raster zerstören.

Zwei Dinge sind wichtig zu wissen: Emoji-Fonts sind plattformabhängig, dasselbe Zeichen
sieht unter Windows, macOS und Linux verschieden aus - wer ein festes Ergebnis braucht,
backt die Art mit `asciiArt()` ein. Und `prefers-reduced-motion` wird respektiert: dann
wird die Figur einmal gezeichnet und steht still.

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
| `color` | string | `#00ff00` / `#33ff33` | `matrix2`, `crt`, `synthgrid`, `highlight` |
| `scanlineOpacity` | number | `0.15` | `crt` |
| `glow` | boolean | `true` | `crt` |
| `flicker` | boolean | `true` | `crt` |
| `direction` | string | `diagonal` / `right` | `wipe` (`left`/`right`/`up`/`down`/`diagonal`), `highlight` (`left`/`right`) |
| `amplitude` | number | `4` | `waves` (wie stark der Kamm pro Zeile ausschlägt) |
| `colors` | string[] | Retro-Palette | `colorshift` |
| `emoji` | string | `👻` | `aura` |
| `cols` | number | `40` | `aura`, `asciiArt` (Rasterbreite in Zeichen) |
| `variant` | string | `shimmer` | `aura` |
| `motion` | string | `float` | `aura` (`off`/`float`/`spin`) |
| `width` | number | `4.5` | `aura` (Aura-Breite in Zeilenhöhen) |
| `fit` | boolean | `true` | `aura` (skaliert die Schrift, damit die Figur das Element füllt) |
| `ramp` | string | `·~oxX%$@` | `aura`, `asciiArt` |

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
