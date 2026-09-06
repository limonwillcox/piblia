# Josephus Works — Design

**Date:** 2026-09-06  
**Status:** Approved

## Goal

Ship Flavius Josephus’s works in the Piblia library on Josephus’s own author shelf, using the Gutenberg Whiston texts already in the repo. No chapter/book navigation polish in this pass.

## Scope

### Include (Whiston / attributed)

1. Antiquities of the Jews  
2. The Wars of the Jews  
3. Against Apion  
4. The Life of Flavius Josephus  
5. Discourse to the Greeks Concerning Hades (keep; authorship disputed)

### Exclude

- The Works of Flavius Josephus: An Index (not a treatise)  
- Selections from Josephus (Thackeray anthology; duplicates core works)  
- Arguments of Celsus, Porphyry, and the Emperor Julian… (not a Josephus work; no Josephus treatise to split out)

## Behavior

- **Discovery:** Place the five texts as `.txt` under `Fathers/English/Josephus_English/` so the existing English-works loader picks them up.
- **Chunking:** Force each work to a single blob unit. Sections/books do not matter yet.
- **Author:** `josephus` — Flavius Josephus, c. 37–c. 100. Library author packing already gives each author their own shelf row(s).
- **Series label:** Whiston (not Schaff).
- **Hades inspect overlay:** At the top of the notes/blurb area, bold red text: `BE AWARE: Authorship Disputed`. Otherwise identical to other inspect overlays.
- **Gutenberg wrappers:** Strip Project Gutenberg header/footer when copying into `Josephus_English` so the reader does not open on the license block. No other cleanup.

## Out of scope

- Book/chapter navigation for Antiquities / Wars / Apion  
- Separate “Josephus” period in the Church Fathers period taxonomy  
- Latin/Greek parallels  
- Selections / Index / Celsus anthology

## Success criteria

1. Catalog includes author `josephus` and exactly those five works.  
2. Opening any of the five from the shelf shows readable English text.  
3. Josephus’s spines appear only under his author shelf.  
4. Hades inspect overlay shows the disputed-authorship warning; other Josephus works do not.
