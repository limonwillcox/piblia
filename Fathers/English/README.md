# English Fathers texts (by volume)

Public-domain Schaff / Roberts–Donaldson dumps from [CCEL](https://www.ccel.org/), kept **by volume** for now. Work-level splitting and catalog wiring come later.

| Folder | Series | Volumes |
| --- | --- | --- |
| `ANF/` | Ante-Nicene Fathers | I–X (already on hand; X is the bibliographic synopsis) |
| `NPNF1/` | Nicene and Post-Nicene Fathers, Series I | I–VIII Augustine, IX–XIV Chrysostom |
| `NPNF2/` | Nicene and Post-Nicene Fathers, Series II | I–XIV |

Filenames follow `Volume N.   Title`. On Windows, `:` in titles is stored as ` -`.

`Augustine_English/` is a separate Confessions working copy and is not part of the volume dump.

Re-download:

```powershell
node scripts/ccel-english/download.mjs
```
