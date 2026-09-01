# Fathers Gateway

A searchable public-domain Church Fathers library, laid out like [Bible Gateway](https://www.biblegateway.com/): search bar, writings list, a reading column, and page options.

The live work is Augustine’s *Confessions*: E. B. Pusey’s English (Project Gutenberg eBook #3296) and the Latin *Confessiones*, both read from files under `Fathers/`. This is not affiliated with Bible Gateway or HarperCollins Christian Publishing.

## Run it locally

Requires [pnpm](https://pnpm.io/) (Node 18+).

```powershell
pnpm install
pnpm dev
```

Then open http://127.0.0.1:5173/

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server + catalog/read/search API |
| `pnpm build` | Typecheck and production build into `dist/` |
| `pnpm preview` | Serve the production build (http://127.0.0.1:4173/) |
| `pnpm start` | Same as `pnpm preview` |
| `pnpm test` | Vitest against the shipped parse / search / read functions |
| `pnpm parse-confessions` | Re-parse `Fathers/` Confessions sources |

The React app talks to `/api/catalog`, `/api/works/:id`, `/api/works/:id/chapters/:n`, and `/api/search?q=`. Those handlers live in `server/` so they can later be wrapped by a Cloudflare Worker; this repo does not require a Cloudflare account to run.

## What to click

| Action | What it does |
| --- | --- |
| Search `Confessions 1` | Passage lookup → reader |
| Search `restless` | Keyword results (titles and text only) |
| **Translation** / **Original** | Pusey English or the Latin *Confessiones* |
| Edition chips under search | Appear only after a work is open in Translation, and only for editions that work actually has |
| Split | Latin in a fixed column on the right of the English |
| **Sign in** | Sign in or create account; OAuth buttons are optional stubs |
| Writings list | Era → father → work/chapter |

Reading plans and audio are archived under `archive/`.

## Corpus and ingest

Keep `Fathers/` (English, Latin, Greek) and `Regulations/` as the source texts. Ingest scripts are unchanged in behavior:

- `scripts/parse-confessions.mjs` — English + Latin Confessions → structured books
- `scripts/latin-library/scrape.mjs`, `extract.mjs`, `pd-gate.mjs` — Latin Library harvest
- `scripts/latin-library/test-extract.mjs` — extract-quality check against cached HTML

## Cloudflare (later)

The production build is a static SPA (`dist/`) plus JSON API handlers in `server/api.ts`. A later Cloudflare Pages deploy can serve the SPA with `public/_redirects` (`/* → /index.html`), and a Worker can reuse `server/worker.ts` for `/api/*`. No live Cloudflare account is required to develop or verify this repo.

## Live site

Public repo: [limonwillcox/piblia](https://github.com/limonwillcox/piblia). Custom domain **piblia.com** is set in `CNAME`.
