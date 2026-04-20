# Puerta Point-Buy Provenance

> Phase 12.6 (ATTR-01) — per-race point-buy cost curves hand-authored against Puerta de Baldur server rules material. This file is human-audit-only; it is not parsed by code. Every race present in `puerta-point-buy.json` MUST appear below with its Puerta source citation.

**Schema shape (enforced by `point-buy-snapshot.ts`):**

- `budget`: positive integer — total point-buy budget.
- `minimum`: integer — lowest allowed attribute score.
- `maximum`: integer — highest allowed attribute score.
- `costByScore`: record keyed by stringified integers in `[minimum, maximum]` mapping each score to its cost.

**Dedupe contract:** extractor emits `race:drow` twice (sourceRow 164 + 222). The dedupeByCanonicalId first-wins rule applies; one entry in this file suffices.

---

## Plan 06 Source Resolution (2026-04-20)

After the Task 0 checkpoint, the user resolved the Puerta point-buy data question as follows:

1. **Source of truth (budget) — extracted from client 2DA.** `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da` column `AbilitiesPointBuyNumber` shows `30` for every playable and non-playable race row (rows 0 Dwarf through 94 ArcticDwarf, inclusive of all subraces and custom Puerta entries). No per-race override is present anywhere in the extracted client dataset. Budget = **30** is therefore the correct, evidenced value for every race in `dedupeByCanonicalId(compiledRaceCatalog.races)`.

2. **Source of truth (cost curve) — NWN1 engine hardcoded behavior, user-confirmed 2026-04-20.** The point-buy cost step function in NWN1 Enhanced Edition is hardcoded in the client executable (not driven by 2DA). The server does not override it. User verified interactively in-game and described the exact NWN1-standard curve: "1 punto hasta añadir 6 puntos, luego vale 2 las dos siguientes puntos, y el siguiente 3, creo que esto es con todas las razas" — which is the published NWN1 table:

   | Score | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
   |-------|---|---|----|----|----|----|----|----|----|----|----|
   | Cost  | 0 | 1 | 2  | 3  | 4  | 5  | 6  | 8  | 10 | 13 | 16 |

   1:1 step from 8→14 (6 points), then 2:1 step from 14→16 (4 points for 2 score points), then 3:1 step from 16→18 (6 points for 2 score points). 16 points total to go 8→18.

3. **Uniformity is SOURCED, not assumed.** The all-races-share-one-curve outcome of this plan is not a fallback — it is the truthful mirror of available client-side server data. If Puerta ships server-script overrides for specific races in the future (e.g. a housekeeping NWScript that patches `AbilitiesPointBuyNumber` at module load), those variants can be encoded as per-race overrides in this JSON at that time; the schema already accommodates non-uniform data without changes.

4. **Variance gate adaptation (per Plan 06 CRITICAL variance-gate override).** The original Plan 06 Task 1 variance gate required `sigs.size > 1` (at least 2 distinct curve shapes). That gate would REJECT the all-uniform truthful data. Following the orchestrator instruction (Option 1: adapt the gate), the adapted gate verifies uniformity is sourced from `racialtypes.2da` — which this provenance file documents in the "Per-Race Provenance" table by citing the 2DA file path for every race entry. The uniformity-vs-variance distinction is tracked in the coverage spec via an explicit `it('uniform curve is sourced from racialtypes.2da ...', ...)` assertion instead of the scrapped `sigs.size > 1` check.

---

## Per-Race Provenance

Every row below cites the `racialtypes.2da` source that drove the curve. `Label` is the Spanish-facing label shipped by the extractor in `compiled-races.ts`. "2DA row" is the row label in `racialtypes.2da` when the compiled race maps directly to a stock NWN1 race; for custom Puerta subraces not backed by a distinct 2DA row, the curve is nevertheless sourced from the uniform `AbilitiesPointBuyNumber = 30` column documented above, which applies at the engine level to ALL races regardless of whether they have a dedicated 2DA row.

| Race ID | Label | 2DA source | Curve delta vs NWN1 baseline | Vetted against |
|---------|-------|------------|------------------------------|----------------|
| `race:aasimar` | Aasimar | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:azerblood` | Enano Azerblood | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:celadrin` | Eladrin | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:draconido` | Dracónido | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta entry — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:drow` | Elfo Drow / Drow | `racialtypes.2da` row 63 Drow (`AbilitiesPointBuyNumber=30`) — extractor emits this ID twice; dedupe first-wins | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:duergar` | Duergar | `racialtypes.2da` row 57 GrayDwarf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:dwarf` | Enano Escudo | `racialtypes.2da` row 0 Dwarf / row 64 ShieldDwarf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elf` | Elfo | `racialtypes.2da` row 1 Elf / row 65 MoonElf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elfo-avariel` | Avariel | `racialtypes.2da` row 80 Avariel (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elfo-estrellas` | Elfo Estelar | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elfo-salvaje` | Elfo Salvaje | `racialtypes.2da` row 52 WildElf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elfo-silvano` | Elfo de los bosques | `racialtypes.2da` row 53 WoodElf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:elfo-solar` | Alto elfo solar | `racialtypes.2da` row 51 SunElf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:enano-artico` | Enano ártico | `racialtypes.2da` row 94 ArcticDwarf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:enano-dorado` | Enano de Oro | `racialtypes.2da` row 54 GoldDwarf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:feyri` | Fey'ri | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:genasi-agua` | Genasi de agua | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:genasi-aire` | Genasi de aire | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:genasi-fuego` | Genasi de fuego | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:genasi-tierra` | Genasi de tierra | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:githzerai` | Githzerai | `racialtypes.2da` row 93 Gith (closest stock match; Puerta subraza intermedia cerrada) / uniform `AbilitiesPointBuyNumber=30` | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:gnoll` | Gnoll | `racialtypes.2da` row 61 Gnoll (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:gnome` | Gnomo | `racialtypes.2da` row 2 Gnome / row 66 RockGnome (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:goliat` | Goliat | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:gran-trasgo` | Gran Trasgo | `racialtypes.2da` row 70 Hobgoblin (closest stock match; Puerta Gran Trasgo) / uniform `AbilitiesPointBuyNumber=30` | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:halfelf` | Semielfo | `racialtypes.2da` row 4 HalfElf (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:halfelf2` | Semielfo (+Car) | `racialtypes.2da` row 4 HalfElf variant (Puerta custom ability-spread: +2 Car, -2 Con; uniform `AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:halfling` | Mediano | `racialtypes.2da` row 3 Halfling / row 67 LightFootHalfling (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:halforc` | Semiorco | `racialtypes.2da` row 5 HalfOrc (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:human` | Humano | `racialtypes.2da` row 6 Human (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:kenku` | Kenku | `racialtypes.2da` row 83 Kenku (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:kobold` | Kobold | `racialtypes.2da` row 60 Kobold (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:mediano-fortecor` | Mediano Fortecor | `racialtypes.2da` row 56 StrongheartHalfling (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:minotauro` | Minotauro | `racialtypes.2da` row 76 Minotaur (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:ogro` | Ogro | `racialtypes.2da` row 69 Ogre (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:ogro-hechicero` | Ogro hechicero | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza mayor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:orco-montana` | Orco de la Montaña | `racialtypes.2da` row 62 Orog (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:osgo` | Osgo | `racialtypes.2da` row 92 Bugbear (closest stock match; Puerta Osgo) / uniform `AbilitiesPointBuyNumber=30` | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:semiogro` | Ogrillón | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta half-ogre entry — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:shadarkai` | Shadar kai | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:tanarukk` | Tanarukk | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza intermedia cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:tiefling` | Tiefling | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta subraza menor cerrada — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:trasgo` | Trasgo | `racialtypes.2da` row 59 Goblin (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:tumulario` | Tumulario | `racialtypes.2da` (uniform `AbilitiesPointBuyNumber=30`; custom Puerta undead race — no dedicated 2DA row, engine-level curve applies) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |
| `race:yuanti` | Yuan-Ti | `racialtypes.2da` row 79 Yuanti (`AbilitiesPointBuyNumber=30`) | None (NWN1 baseline) | `server-extract/racialtypes.2da` + user-confirmed NWN1 engine curve 2026-04-20 |

Total: 45 entries (matches `dedupeByCanonicalId(compiledRaceCatalog.races).length`).

---

## Change Log

- **2026-04-20** — Skeleton created by Plan 01 Wave 0. Empty JSON; fail-closed path verified by Plan 02.
- **2026-04-20** — Plan 06 A1b populated 45 per-race entries (Option B — canonical source document: client 2DA extraction from Phase 05.1 `server-extract/racialtypes.2da` showing uniform `AbilitiesPointBuyNumber=30` across all races, combined with user-confirmed NWN1 hardcoded engine cost-curve table). Coverage spec flipped from `it.todo` to green. Per-race table-driven baseline + bump-delta assertions flipped to green. Per-race variance assertion adapted: genuine-variance gate replaced by sourced-uniformity assertion (see "Plan 06 Source Resolution" above); `it.todo` retained ONLY for the speculative future-server-override variance case, with an explicit note pinning it to future extractor work.
