# Church history cinematic redesign

Date: 2026-09-02  
Status: approved for planning

## Goal

Turn Act I of `/church-history/` (Pentecost → Nicaea) into one continuous full-viewport black theatre: no dead space between shots, chrome covered unless the pointer hits the top or side edges, and shot copy/art updated for Nero, Decius, Milan, and Nicaea.

The timeline below the cinematic remains the crawlable source of truth. Scenes stay decorative (`aria-hidden`).

## Architecture

### Single theatre

- Replace the current stack of independent sticky `.ch-scene` stages with **one sticky full-viewport stage** for the whole Act.
- One scroll progress (`--p` or equivalent) runs across the entire Act track and drives shot swaps and in-shot timings.
- **Fade in** only at the start of the Act; **fade out** only at the end. Mid-sequence shots do not fade the black ground.
- While the theatre is active, black covers the **header and sidebar** (and the rest of the viewport), not only the content column under the header.

### Chrome reveal

- Pointer in a **top or side hit zone** → chrome pops back (header / rail usable).
- Leave the hit zone → black covers again for the rest of the sequence.
- **Mobile:** no sidebar; only a top-edge zone reveals the header.
- `prefers-reduced-motion`: static posters; no blackout / hover theatre behavior.
- Existing skip link still jumps past the sequence to `#pre-nicene`.

### SEO / data model

- Keep separate timeline eras accurate.
- Move the cinematic slot from **Milvian Bridge (312)** to **Edict of Milan (313)**.
- Milvian remains timeline-only (battle / chi-rho narrative).
- Milan cinematic caption: Constantine legalizes Christianity in the sense of the Edict of Milan (free exercise / end of persecution) — not “state religion.” Exact caption wording: **“Constantine legalizes Christianity”** with date **AD 313**; lower lettering may name the Edict of Milan if space allows.

## Shot list

| Order | Era / scene id | Changes |
| --- | --- | --- |
| 1 | Pentecost | Unchanged art; first-shot fade-in owns the theatre entrance. |
| 2 | Acts book | Linger ~1s on **Acts 2**, then chapter run, linger ~1s on **Acts 28**. |
| 3 | Nero | Replace “Rome burns” city/fire with Caesar stickman (olive branch → devil horns), occupied crosses spring up on gesture. Caption: **Rome Under Nero** / AD 64 / **the church grows under persecution**. |
| 4 | Jerusalem | Hold stars at brightest ~1s before they fall; temple fall stays. |
| 5 | Apostolic Fathers | Unchanged. |
| 6 | Decius persecution | Caption: **Sacrifice to idols, or die** / AD 250 / keep existing lower sense + **Under Decius**. Art: Origen · Cyprian · Fabian in the same scroll-icon style as Apostolic Fathers (replace whip/spear/cross/lion). |
| 7 | Great Persecution | Add lower lettering **Under Emperor Diocletian**. |
| 8 | Milan (was Milvian slot) | Constantine stick-Caesar matching Nero’s figure language, but grows a **halo**. Caption as above. |
| 9 | Nicaea | Keep council art; add subtext: **The Arian Heresy is struck down at the Council of Nicaea.** |

### Shared figure language

Nero and Constantine share one stick-Caesar vocabulary (laurel/olive, stance, line weight) so the horns → halo rhyme reads clearly.

## Interaction details

- Hit zones: thin strips along the top (header height-ish) and left (rail width-ish); do not steal clicks from the stage center.
- When revealed, restore header/rail opacity and pointer events so navigation works.
- Theatre exit (scroll past Act or leave page): remove blackout class and hit-zone listeners.

## Out of scope

- Post-Nicaea cinematic shots.
- Changing timeline body copy beyond what’s required to attach `scene` to Milan and drop it from Milvian.
- Graphic redesign of Pentecost, Acts book, Apostolic Fathers, or Great Persecution artwork beyond the caption add for Diocletian.
- Making Christianity “the state religion” copy (that is later than Milan).

## Success criteria

- Scrolling Act I feels like one continuous black sequence with no page-background flash between shots.
- Fade in once at entry; fade out once at exit.
- Hovering top/side reveals chrome; leaving covers it again.
- Acts 2 / Acts 28 / Jerusalem stars each hold about a second at their peak.
- Nero / Milan / Decius / Nicaea match the shot list copy and art.
- Timeline still states each fact once for crawlers and no-JS readers.
