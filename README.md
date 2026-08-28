# Fathers Gateway

A static mock of a **searchable public-domain Church Fathers library**, laid out like [Bible Gateway](https://www.biblegateway.com/): search bar, writings list, a reading column, and page options.

Texts are public-domain excerpts from the Ante-Nicene Fathers and Nicene and Post-Nicene Fathers series. This is not affiliated with Bible Gateway or HarperCollins Christian Publishing.

## Live site

Public repo: [limonwillcox/piblia](https://github.com/limonwillcox/piblia). GitHub Pages deploys from `main`.

Until DNS is pointed, the site is at **https://limonwillcox.github.io/piblia/**.

Custom domain **piblia.com** is already set in `CNAME`. At your registrar, use:

**Apex `piblia.com` (A records)**

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**`www.piblia.com` (CNAME)**

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `limonwillcox.github.io` |

Optional IPv6 AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

After DNS propagates, GitHub will issue HTTPS for `piblia.com`. Enforce HTTPS in **Settings → Pages**.

## Run it locally

```powershell
npx --yes http-server -p 8080 -c-1
```

Then open http://127.0.0.1:8080/

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
