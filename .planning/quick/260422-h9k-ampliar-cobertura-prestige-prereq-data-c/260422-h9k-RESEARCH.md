# Quick Task 260422-h9k — Research

**Domain:** Prestige-class prerequisite override data (apps/planner/src/features/level-progression/prestige-prereq-data.ts)
**Scope:** 5 prestige classes (harper, campeondivino, weaponmaster, warlock, swashbuckler)
**Confidence:** MEDIUM–HIGH (mappings verified against committed catalogs; one unresolvable skill gap)

## Summary

Five prestige classes currently fall through to "Requisitos en revisión" because `PRESTIGE_PREREQ_OVERRIDES` has no entry for them. Their `cls_pres_*.2da` extracts are locally available (`.planning/phases/05-skills-derived-statistics/server-extract/`). I verified the canonical-ID mappings for every skill, feat and class ID referenced in those 2DA files against `apps/planner/src/data/compiled-feats.ts` + `compiled-skills.ts` + `compiled-classes.ts`.

**Primary recommendation:** Ship 5 new overrides with the mappings below. Skip one harper skill prereq (Discipline, not in Puerta's player skill catalog). Treat warlock + swashbuckler as "ScriptVar-only ⇒ always reachable" via empty decoded-prereqs object (option c). Accept the pre-existing first-wins dedupe: `class:harper` override applies only to the Arcano variant; the Divino variant is silently dropped by `dedupeCompiledClassesByCanonicalId` in class-fixture.ts and does not reach the picker.

## Locked Constraints (from CLAUDE.md + CONTEXT)

- Planner stays framework-agnostic in rules-engine layer. All data changes live in apps/planner/src/features/level-progression/prestige-prereq-data.ts — no rules-engine schema change.
- Canonical-ID shape `/^[a-z-]+:[A-Za-z0-9._-]+$/` (`packages/rules-engine/src/contracts/canonical-id.ts`). All IDs below comply.
- `DecodedPrereqs` shape fixed in `prestige-gate.ts:29-60`. Do not introduce new prereq kinds; encode what the shape supports and omit the rest with a comment.
- Spanish-first surface: override `skillName` / `featName` / `className` fields must use Spanish display labels (matches existing overrides).

## Canonical ID Mappings (verified against compiled-*.ts)

### Skills (from SKILL column in cls_pres_*.2da)

| 2DA index | Base-NWN label | Puerta canonical ID | Display name | Verified |
|---:|---|---|---|---|
| 3 | Discipline | **NOT IN CATALOG** | — | ❌ Discipline is NOT in Puerta player skill catalog (38 skills, no `skill:disciplina`). Only appears as a category value. |
| 7 | Lore | `skill:saberotros` | "Saber (otros)" | ✅ compiled-skills.ts:441 |
| 14 | Search | `skill:buscar` | "Buscar" | ✅ compiled-skills.ts:341 |
| 23 | Bluff | `skill:engaar` | "Engañar" | ✅ compiled-skills.ts:558 (slug drops 'n' due to UTF-8/Latin-1 misdecode of ñ; ID is stable artifact) |
| 24 | Intimidate | `skill:intimidar` | "Intimidar" | ✅ compiled-skills.ts:580 |

**Discipline resolution:** Document as OPEN-QUESTION in PLAN; OMIT from override with explicit `// SKILL 3 (Discipline) omitted: not present in Puerta skill catalog` comment. Alternative — pair with product decision to either (a) map to `skill:saberotros` as a proxy (WRONG: different semantic) or (b) drop entirely (recommended — harper becomes slightly more permissive but no false negatives block legitimate builds). The cls_pres_harper.2da in server-extract is likely the base Bioware version and Puerta's real server may have removed this gate.

### Feats (from FEAT / FEATOR columns)

| 2DA index | Label | Canonical ID | Display | Verified |
|---:|---|---|---|---|
| 0 | Alertness | `feat:alertness` | "Alerta" | ✅ compiled-feats.ts:42500, sourceRow 0 |
| 10 | Dodge | `feat:dodge` | "Esquiva" | ✅ sourceRow 10 (line 42594) |
| 22 | IronWill | `feat:ironwill` | "Voluntad de hierro" | ✅ sourceRow 22 (line 42682) |
| 26 | Mobility | `feat:mobility` | "Movilidad" | ✅ sourceRow 26 (line 42717) |
| 389 | Expertise | `feat:periciaencombate` | "Pericia en combate" | ⚠️ sourceRow **1223** in compiled catalog (line 56494), not 389 — catalog and server-extract disagree on row numbering but canonical semantic identity is unambiguous |
| 867 | FEAT_WHIRLWIND_ATTACK | `feat:feat-whirlwind-attack` | "Ataque de torbellino" | ✅ sourceRow 867 (line 52865) |

### Weapon Focus feats (FEATOR groups — weaponmaster + campeondivino)

Verified by batch grep against `compiled-feats.ts` sourceRow column:

| 2DA idx | Label | Canonical ID | Display |
|---:|---|---|---|
| 43 | WeapFocClub | `feat:weapfocclub` | "Soltura con un arma (clava)" |
| 90 | WeapFocDagger | `feat:weapfocdagger` | "Soltura con un arma (daga)" |
| 94 | WeapFocLgMace | `feat:weapfoclgmace` | "Soltura con un arma (maza)" |
| 95 | WeapFocMorn | `feat:weapfocmorn` | "Soltura con un arma (maza de armas)" |
| 96 | WeapFocStaff | `feat:weapfocstaff` | "Soltura con un arma (bastón)" |
| 97 | WeapFocSpear | `feat:weapfocwspear` | "Soltura con un arma (lanza)" |
| 98 | WeapFocSickle | `feat:weapfocsickle` | "Soltura con un arma (hoz)" |
| 100 | WeapFocUnArm | `feat:weapfocunarm` | "Soltura con un arma (impacto sin arma)" |
| 103 | WeapFocShortSword | `feat:weapfocshortsword` | "Soltura con un arma (espada corta)" |
| 104 | WeapFocRapier | `feat:weapfocrapier` | "Soltura con un arma (estoque)" |
| 105 | WeapFocScim | `feat:weapfocscim` | "Soltura con un arma (cimitarra)" |
| 106 | WeapFocLSw | `feat:weapfoclsw` | "Soltura con un arma (espada larga)" |
| 107 | WeapFocGSw | `feat:weapfocgsw` | "Soltura con un arma (espadón)" |
| 108 | WeapFocHAxe | `feat:weapfochaxe` | "Soltura con un arma (hacha de mano)" |
| 110 | WeapFocBAxe | `feat:weapfocbaxe` | "Soltura con un arma (hacha de batalla)" |
| 111 | WeapFocGAxe | `feat:weapfocgaxe` | "Soltura con un arma (gran hacha)" |
| 112 | WeapFocHalb | `feat:weapfochalb` | "Soltura con un arma (alabarda)" |
| 113 | WeapFocLgHam | `feat:weapfoclgham` | "Soltura con un arma (martillo ligero)" |
| 114 | WeapFocLgFlail | `feat:weapfoclgflail` | "Soltura con un arma (mangual ligero)" |
| 115 | WeapFocWHam | `feat:weapfocwham` | "Soltura con un arma (martillo de guerra)" |
| 116 | WeapFocHFlail | `feat:weapfochflail` | "Soltura con un arma (mangual pesado)" |
| 117 | WeapFocKama | `feat:weapfockama` | "Soltura con un arma (kama)" |
| 118 | WeapFocKukri | `feat:weapfockukri` | "Soltura con un arma (kukri)" |
| 121 | WeapFocScy | `feat:weapfocscy` | "Soltura con un arma (guadaña)" |
| 122 | WeapFocKatana | `feat:weapfockatana` | "Soltura con un arma (katana)" |
| 123 | WeapFocBSw | `feat:weapfocbsw` | "Soltura con un arma (espada bastarda)" |
| 125 | WeapFocDMace | `feat:weapfocdmace` | "Soltura con un arma (maza terrible)" |
| 126 | WeapFocDAxe | `feat:weapfocdaxe` | "Soltura con un arma (hacha doble)" |
| 127 | WeapFoc2Sw | `feat:weapfoc2sw` | "Soltura con un arma (espada de dos hojas)" |
| 952 | WeapFocDWAxe | `feat:feat-weapon-focus-dwaxe` | "Soltura con un arma (hacha de guerra enana)" |
| 993 | WeapFocWhip | `feat:feat-weapon-focus-whip` | "Soltura con un arma (látigo)" |
| 1072 | WeapFocTrident | `feat:feat-weapon-focus-trident` | "Soltura con un arma (tridente)" |

**Missing from catalog (omit from overrides):**

| 2DA idx | Label | Status |
|---:|---|---|
| 2056 | WeapFocLance | ❌ not in compiled-feats (Puerta likely disabled Lance weapon type) |
| 2070 | FEAT_WEAPON_FOCUS_1HCONCUSSION | ❌ not in compiled-feats — these are **category master feats** (grouping: weapon "1H Concussion" = all 1-handed bludgeons). Bioware auto-sets them when any member WeapFoc is taken. Puerta filters them from player catalog. |
| 2071 | FEAT_WEAPON_FOCUS_1HEDGED | ❌ same as above |
| 2072 | FEAT_WEAPON_FOCUS_2HANDED | ❌ same as above |
| 2073 | FEAT_WEAPON_FOCUS_POLEARM | ❌ same as above |

**Recommendation:** omit all 5 missing FEATOR entries. The weaponmaster FEATOR list is a disjunction — as long as we keep ≥1 member (32 of 37 verified above), the gate correctly unlocks when the player has ANY of the 32 real per-weapon Weapon Focus feats. For campeondivino, this is riskier — only Unarmed (100) survives among its 5-entry FEATOR list; concussion/edged/2h/polearm masters are all missing. Campeondivino's "any Weapon Focus" disjunction would effectively require **feat:weapfocunarm** specifically. DOCUMENT as D-03 (see Plan Decisions) — probably the right move is to substitute the 4 category masters with their constituent per-weapon feats (the same 32 we have for weaponmaster would cover this).

### Classes (CLASSNOT column) — CLASSNOT 75-79

Referenced row indices in the Puerta classes.2da (server-extract):

| 2DA idx | Label | In player catalog? | Action |
|---:|---|---|---|
| 75 | Harper_Mage | ❌ NPC-only (PlayerClass=0 implied by row shape) | OMIT |
| 76 | Harper_Priest | ❌ NPC-only | OMIT |
| 77 | Harper_Paragon | ❌ NPC-only | OMIT |
| 78 | Harper_Master | ❌ NPC-only | OMIT |
| 79 | Commoner | ❌ NPC-only (Plebeyo) | OMIT |

**Recommendation:** Drop all 5 CLASSNOT entries from harper/campeondivino/weaponmaster overrides. A player cannot multiclass into non-player classes, so these gates can never trigger — encoding them adds noise without semantic value. Documented as D-04.

## Target class ID confirmation

All 5 class IDs compile as valid `CanonicalId` (template literal shape `${EntityKind}:${string}`) and match compiled-classes.ts entries:

| class id | sourceRow | Label | Duplicate? |
|---|---:|---|---|
| `class:harper` | 28, 54 | "Agente Custodio (Arcano)" / "Agente Custodio (Divino)" | ⚠️ YES — first-wins dedupe keeps row 28 (Arcano); row 54 dropped (class-fixture.ts:284-300). Override applies to Arcano only. See Decision D-05. |
| `class:campeondivino` | 32 | "Campeón divino" | no |
| `class:weaponmaster` | 33 | "Maestro de armas" | no |
| `class:warlock` | 57 | "Brujo" | no |
| `class:swashbuckler` | 58 | "Espadachin" | no |

## ScriptVar Strategy (warlock + swashbuckler)

Their 2DA has a SINGLE requirement: `ScriptVar VAR PRC_AllowWarlock/Swash`. No BAB, skill, feat, race or class prereqs. Server gates entry via script variable check at runtime; planner cannot reproduce that semantic.

### Option Matrix

| Option | Implementation | UX behavior | Pros | Cons |
|---|---|---|---|---|
| (a) new `server-gate` BlockerKind | Add `'server-gate'` to BlockerKind union in prestige-gate.ts + new decodedPrereqs field `serverGated?: { reason: string }` + render logic + override `{ serverGated: { reason: '…' } }` | Row shows "blocked — Requisito de servidor: contacta DM" | Honest — server gate is real; sets user expectation | Schema change in rules-engine; cross-package edit violates "minimal surface" for quick task |
| (b) no override | Skip these 2 classes | Row stays "Requisitos en revisión" | Zero code change | Misleading — implies missing data, not server policy; same UX as enriched=false branch |
| (c) empty override | `'class:warlock': {}` and `'class:swashbuckler': {}` | Row shows reachable, no blockers | Minimal change (2 lines); matches canon "no static gates" | Hides server-side gate; player could build invalid char and fail on import into server |

### Recommendation: **option (c) for now; note option (a) as follow-up**

Rationale: the quick-task scope is explicitly "ampliar cobertura de prestige-prereq-data". Options (a) requires cross-package edits (BlockerKind union + label function + render) and likely its own plan. Option (b) leaves misleading "data missing" copy in place. Option (c) accurately reflects "no static prereqs Puerta could gate via 2DA" and matches actual canon — warlock and swashbuckler ARE accessible at L2+ to any character per Bioware rules; the ScriptVar is a setting-specific toggle, not a per-character gate.

**Risk mitigation:** Add a code comment citing "ScriptVar PRC_AllowWarlock — server-side gate, not planner-side" so future readers don't think the data is missing. File an OPEN-QUESTION in STATE.md for product: "Do you want a separate 'server-gated' blocker type for warlock/swashbuckler?"

## Prereq tables to drop into prestige-prereq-data.ts

### class:harper

```typescript
'class:harper': {
  minSkillRanks: [
    skill('skill:engaar', 6, 'Engañar'),
    skill('skill:buscar', 4, 'Buscar'),
    skill('skill:saberotros', 6, 'Saber (otros)'),
    // NOTE: SKILL 3 (Discipline/Disciplina) omitted — not in Puerta player skill catalog.
    // OPEN QUESTION: product to confirm drop vs. proxy-remap.
  ],
  requiredFeats: [
    feat('feat:alertness', 'Alerta'),
    feat('feat:ironwill', 'Voluntad de hierro'),
  ],
  // NOTE: ScriptVar X1_AllowHarper (server gate) + CLASSNOT 75-78 (NPC-only harper variants)
  // omitted — not reachable from planner state.
  // KNOWN LIMITATION: compiled-classes.ts emits class:harper twice (Arcano sourceRow 28,
  // Divino sourceRow 54); first-wins dedupe in class-fixture.ts keeps only Arcano.
},
```

### class:campeondivino

```typescript
'class:campeondivino': {
  minBab: 7,
  requiredAnyFeatGroups: [
    // Original FEATOR: 2070 (1HConcussion), 2071 (1HEdged), 2072 (2Handed), 2073 (Polearm), 100 (Unarmed)
    // The 4 category masters (2070-2073) are not in Puerta's feat catalog; expanded
    // to individual per-weapon Weapon Focus feats that cover those categories + unarmed.
    [
      // Unarmed (100)
      feat('feat:weapfocunarm', 'Soltura con un arma (impacto sin arma)'),
      // 1H Concussion (2070) → clubs/maces/warhammers/morningstars
      feat('feat:weapfocclub', 'Soltura con un arma (clava)'),
      feat('feat:weapfoclgmace', 'Soltura con un arma (maza)'),
      feat('feat:weapfoclgham', 'Soltura con un arma (martillo ligero)'),
      feat('feat:weapfocwham', 'Soltura con un arma (martillo de guerra)'),
      feat('feat:weapfocmorn', 'Soltura con un arma (maza de armas)'),
      feat('feat:weapfocdmace', 'Soltura con un arma (maza terrible)'),
      // 1H Edged (2071) → longsword/shortsword/rapier/scimitar/kukri/katana/bastard/sickle
      feat('feat:weapfoclsw', 'Soltura con un arma (espada larga)'),
      feat('feat:weapfocshortsword', 'Soltura con un arma (espada corta)'),
      feat('feat:weapfocrapier', 'Soltura con un arma (estoque)'),
      feat('feat:weapfocscim', 'Soltura con un arma (cimitarra)'),
      feat('feat:weapfockukri', 'Soltura con un arma (kukri)'),
      feat('feat:weapfockatana', 'Soltura con un arma (katana)'),
      feat('feat:weapfocbsw', 'Soltura con un arma (espada bastarda)'),
      feat('feat:weapfocsickle', 'Soltura con un arma (hoz)'),
      feat('feat:weapfocdagger', 'Soltura con un arma (daga)'),
      feat('feat:weapfockama', 'Soltura con un arma (kama)'),
      feat('feat:feat-weapon-focus-whip', 'Soltura con un arma (látigo)'),
      // 2-Handed (2072) → greatsword/great-axe/battle-axe/hand-axe/two-bladed/double-axe/dwaxe
      feat('feat:weapfocgsw', 'Soltura con un arma (espadón)'),
      feat('feat:weapfocgaxe', 'Soltura con un arma (gran hacha)'),
      feat('feat:weapfocbaxe', 'Soltura con un arma (hacha de batalla)'),
      feat('feat:weapfochaxe', 'Soltura con un arma (hacha de mano)'),
      feat('feat:weapfoc2sw', 'Soltura con un arma (espada de dos hojas)'),
      feat('feat:weapfocdaxe', 'Soltura con un arma (hacha doble)'),
      feat('feat:feat-weapon-focus-dwaxe', 'Soltura con un arma (hacha de guerra enana)'),
      // Polearm (2073) → halberd/staff/spear/scythe/trident/flails
      feat('feat:weapfochalb', 'Soltura con un arma (alabarda)'),
      feat('feat:weapfocstaff', 'Soltura con un arma (bastón)'),
      feat('feat:weapfocwspear', 'Soltura con un arma (lanza)'),
      feat('feat:weapfocscy', 'Soltura con un arma (guadaña)'),
      feat('feat:weapfoclgflail', 'Soltura con un arma (mangual ligero)'),
      feat('feat:weapfochflail', 'Soltura con un arma (mangual pesado)'),
      feat('feat:feat-weapon-focus-trident', 'Soltura con un arma (tridente)'),
    ],
  ],
  // NOTE: ScriptVar X2_AllowDivcha + CLASSNOT 79 (Commoner) omitted — server/NPC scope.
},
```

### class:weaponmaster

```typescript
'class:weaponmaster': {
  minBab: 5,
  minSkillRanks: [
    skill('skill:intimidar', 4, 'Intimidar'),
  ],
  requiredFeats: [
    feat('feat:dodge', 'Esquiva'),
    feat('feat:mobility', 'Movilidad'),
    feat('feat:periciaencombate', 'Pericia en combate'),
    feat('feat:feat-whirlwind-attack', 'Ataque de torbellino'),
  ],
  requiredAnyFeatGroups: [
    // Original FEATOR: ~40 individual weapon focuses + 4 category masters (2070-2073).
    // Keeping individual weapon focuses (32 verified); category masters omitted
    // (not in catalog). The 4 missing masters were redundant with individual feats anyway.
    [
      feat('feat:weapfocdagger', 'Soltura con un arma (daga)'),
      feat('feat:weapfoclgmace', 'Soltura con un arma (maza)'),
      feat('feat:weapfocmorn', 'Soltura con un arma (maza de armas)'),
      feat('feat:weapfocstaff', 'Soltura con un arma (bastón)'),
      feat('feat:weapfocwspear', 'Soltura con un arma (lanza)'),
      feat('feat:weapfocsickle', 'Soltura con un arma (hoz)'),
      feat('feat:weapfocshortsword', 'Soltura con un arma (espada corta)'),
      feat('feat:weapfocrapier', 'Soltura con un arma (estoque)'),
      feat('feat:weapfocscim', 'Soltura con un arma (cimitarra)'),
      feat('feat:weapfoclsw', 'Soltura con un arma (espada larga)'),
      feat('feat:weapfocgsw', 'Soltura con un arma (espadón)'),
      feat('feat:weapfochaxe', 'Soltura con un arma (hacha de mano)'),
      feat('feat:weapfocbaxe', 'Soltura con un arma (hacha de batalla)'),
      feat('feat:weapfocgaxe', 'Soltura con un arma (gran hacha)'),
      feat('feat:weapfochalb', 'Soltura con un arma (alabarda)'),
      feat('feat:weapfoclgham', 'Soltura con un arma (martillo ligero)'),
      feat('feat:weapfoclgflail', 'Soltura con un arma (mangual ligero)'),
      feat('feat:weapfocwham', 'Soltura con un arma (martillo de guerra)'),
      feat('feat:weapfochflail', 'Soltura con un arma (mangual pesado)'),
      feat('feat:weapfockama', 'Soltura con un arma (kama)'),
      feat('feat:weapfockukri', 'Soltura con un arma (kukri)'),
      feat('feat:weapfocscy', 'Soltura con un arma (guadaña)'),
      feat('feat:weapfockatana', 'Soltura con un arma (katana)'),
      feat('feat:weapfocbsw', 'Soltura con un arma (espada bastarda)'),
      feat('feat:weapfocdmace', 'Soltura con un arma (maza terrible)'),
      feat('feat:weapfocdaxe', 'Soltura con un arma (hacha doble)'),
      feat('feat:weapfoc2sw', 'Soltura con un arma (espada de dos hojas)'),
      feat('feat:weapfocclub', 'Soltura con un arma (clava)'),
      feat('feat:feat-weapon-focus-dwaxe', 'Soltura con un arma (hacha de guerra enana)'),
      feat('feat:feat-weapon-focus-whip', 'Soltura con un arma (látigo)'),
      feat('feat:feat-weapon-focus-trident', 'Soltura con un arma (tridente)'),
    ],
  ],
  // NOTE: ScriptVar X2_AllowWM + CLASSNOT 79 (Commoner) + FEATOR 2056 (Lance) + FEATOR 2070-2073
  // (category masters) omitted — not present in Puerta planner catalog.
},
```

### class:warlock

```typescript
'class:warlock': {
  // Only requirement in cls_pres_warlok.2da is ScriptVar PRC_AllowWarlock — a server-side
  // gate not reproducible from planner state. Empty decodedPrereqs object marks the row
  // as enriched with zero blockers → reachable: true at L2+. See Decision D-02 in PLAN.
},
```

### class:swashbuckler

```typescript
'class:swashbuckler': {
  // Only requirement in cls_pres_swash.2da is ScriptVar PRC_AllowSwash — server-side
  // gate not reproducible from planner state. Empty decodedPrereqs object → reachable: true
  // at L2+. See Decision D-02 in PLAN.
},
```

## Proposed Decisions for PLAN

| # | Decision | Rationale |
|---|---|---|
| D-01 | Use existing `DecodedPrereqs` shape. No new `BlockerKind` in prestige-gate.ts. | Minimal-surface quick task; no cross-package edits. |
| D-02 | `class:warlock` + `class:swashbuckler` get empty override `{}` | Matches canon (no static prereqs); makes enriched=true; fail-open is correct because server gates these via script, not 2DA. |
| D-03 | Skip SKILL 3 (Discipline) for harper | Not in Puerta skill catalog; no proxy with correct semantics. Logs as product OPEN-QUESTION. |
| D-04 | Drop all CLASSNOT 75-79 entries | Target NPC classes cannot appear in player classLevels; gate can never trigger. |
| D-05 | Accept first-wins dedupe; override targets Arcano variant only | Pre-existing tech-debt (class-fixture.ts:284-300) not this plan's scope. |
| D-06 | Campeondivino FEATOR expands 4 missing category masters to their constituent per-weapon feats | Preserves semantic: "any Weapon Focus (melee or unarmed)". Omitting would leave only `feat:weapfocunarm`, too restrictive. |
| D-07 | Weaponmaster FEATOR drops the 4 category masters (2070-2073) + Lance (2056) silently | Individual weapon focuses in the same list already cover the same weapons; masters were redundant even in-game. |

## Open Questions for Product

1. **Discipline skill gap:** Does Puerta's real ruleset require Discipline for Agente Custodio Arcano/Divino? If yes, we need to either reinstate `skill:disciplina` in the extractor or remove the requirement from the local server-extract/cls_pres_harper.2da. Recommended: drop prereq (planner can't check what player skill catalog doesn't list).
2. **Warlock/Swashbuckler server gate:** Do we surface "Requisito de servidor — contacta DM" as a separate blocker kind in a future plan, or is "reachable without static prereqs" accurate enough?
3. **Extractor sync:** `.planning/phases/05-skills-derived-statistics/server-extract/skills.2da` is the base NWN file (28 rows); Puerta catalog emits 38 skills. Next `pnpm extract` on Puerta's real nwsync should update server-extract with the Spanish-labeled file. Not in this quick's scope.

## Provenance

| Claim | Source | Confidence |
|---|---|---|
| 2DA prereq column contents (BAB/SKILL/FEAT/FEATOR/VAR/CLASSNOT) | `.planning/phases/05-skills-derived-statistics/server-extract/cls_pres_*.2da` (verified 5 files) | HIGH |
| Feat canonical IDs | `apps/planner/src/data/compiled-feats.ts` — grep by `"sourceRow": N` with context window | HIGH for rows 0/10/22/26/43/90/94-98/100/103-127/867/952/993/1072; HIGH for row 389 via label match (catalog uses sourceRow 1223 but label unambiguously maps to "Pericia en combate") |
| Weapon Focus family (32 entries verified) | Batch grep in compiled-feats.ts | HIGH |
| Missing feats (2056, 2070-2073) | Full-text grep returned zero matches for WEAPON_FOCUS_{1HCONCUSSION,1HEDGED,2HANDED,POLEARM,LANCE} in compiled-feats.ts | HIGH |
| Skill ID mappings (7, 14, 23, 24) | Direct grep in compiled-skills.ts by Spanish label | HIGH |
| Skill 3 (Discipline) missing | Enumerated all 38 skill IDs in compiled-skills.ts — none is `skill:disciplina` or contains "Disciplina"/"Discipline" in label | HIGH |
| CLASSNOT 75-79 not player classes | `.planning/phases/05-skills-derived-statistics/server-extract/classes.2da` rows 75-79 (Harper_Mage/Priest/Paragon/Master, Commoner) — none have entries in compiled-classes.ts | HIGH |
| class:harper dedupe behavior | `apps/planner/src/features/level-progression/class-fixture.ts:270-306` (first-wins, drops Divino variant sourceRow 54) | HIGH |
| CanonicalId shape accepts any `class:*` slug | `packages/rules-engine/src/contracts/canonical-id.ts:18` template literal type | HIGH |
