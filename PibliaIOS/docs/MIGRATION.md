# Web phone → Swift map

| Web (archived) | Swift |
| --- | --- |
| `js/ios.js` top bar | `ReadView` toolbar |
| Bottom tabs | `RootTabs` |
| Chi-Rho / `fg-mode` | `@AppStorage("fg-latin")` |
| Focus cross | `@AppStorage("fg-focus")` |
| Liber picker | sheet in `ReadView` |
| Bookmark ribbon | bookmark button + Liber dots |
| `js/parallel.js` L/R cycle | Goal 3 — not in this skeleton |
| Notes pane | Goal 3 |
| KJV `Bibles/KJV` | Goal 3, bundle JSON in the app |
| Highlights `fg-hl-*` | Goal 2 or later |
| Search page | Goal 4 |

Corpus today: `SampleCorpus.swift` (Liber I only). Full Confessions still live in `js/confessions-data.js` on the site. Goal 1 should copy that JSON into `Piblia/Resources/`.
