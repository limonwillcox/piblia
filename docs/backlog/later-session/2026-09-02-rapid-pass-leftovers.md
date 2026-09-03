# Later session — leftovers from 2026-09-02 rapid pass

Parked here so another session can finish what this pass only partly touched.

## Search / Find (deeper)

**Status.** Partial. Keyword search now sorts hits era → author → work → chapter (Bible-app Find order). UI button says “Find”.

**Still broken / needed:**

- User report: “search basically doesn’t work.” Confirm whether hits miss most Fathers (empty/partial English passage bodies), timeout under load, or UI routing bugs.
- True in-work Find (highlight next match in the open text) like mobile Bible apps — not just a results list page.
- Advanced search UX (filters by father / era / series) if still desired.
- Indexing performance if the full English corpus is too large for a sync scan.

**Touch points:** `server/query.ts`, `server/api.ts`, `server/englishWorks.ts`, `src/pages/SearchPage.tsx`, header find form in `src/components/Layout.tsx`.

## Accounts / OAuth / writable notes

**Status.** Intentionally untouched. Footnotes (Notes rail) stay read-only; personal notes should require login.

**Needed when OAuth lands:**

- Real auth (Google / Microsoft / email).
- Per-user notes store (not only local highlights).
- Gate any “write note” UI behind signed-in state; keep edition footnotes public.

## Optional polish

- Sync `public/css/styles.css` with `src/styles.css` if anything still serves the public copy.
- Mobile header: Writings / Find / Translation row may need another shrink pass on very narrow phones.
- History → Timeline handoff: currently navigates when the cinematic theatre leaves the viewport; consider a short interstitial or “Continue to timeline” affordance if the jump feels abrupt.
- Sitemap / redirects: ensure `/church-history/timeline` is listed and rewrite-friendly on GitHub Pages.
