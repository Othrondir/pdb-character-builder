---
status: complete
phase: 06-feats-proficiencies
source: [06-VERIFICATION.md]
started: 2026-04-16T16:35:00Z
updated: 2026-04-18T00:00:00Z
closed_by: 11-uat-openwork-closure
---

## Current Test

[all signed off — Phase 11 UAT closure]

## Tests

### 1. Visual feat selection flow with class bonus and general feat steps
expected: FeatBoard renders with 'Dotes de clase' and 'Dotes generales' sections; sequential flow (class bonus first, then general) works; prerequisite summary text visible inline on each feat
result: [PASS] Humano + Guerrero L1: FeatBoard rendered H3 "Dotes de clase" + H3 "Dotes generales" sections (DOM-verified). Banner flipped "DOTE DE CLASE" → "DOTE GENERAL" after picking `Impacto sin arma mejorado`, confirming sequential flow. Prerequisite summaries visible inline (e.g. `Sutileza con un arma [BAB +1]`, `Competencia con arma exótica (espada bastarda) [Fuerza 13, BAB +1]`).

### 2. Search with accent-insensitive matching and blocked feat reasons
expected: Typing 'Poder' in search field shows matching feats; blocked feats appear with red/amber failure reasons inline below the name; accent variations match correctly
result: [PASS] Typing `Poder` (no accent) matched `Rabia poderosa`, `Ataque poderoso`, `Furia poderosa`, `Poder de Conjuro I..IV`. Blocked feats showed Spanish reasons inline: `Requiere: Fuerza 21 (tienes 16)`, `Requiere: Constitucion 21 (tienes 16)`, `Requiere: Furia Furia (tienes (no tomada))`, `Requiere: Nivel epico Nivel 21+ (tienes Nivel 1)`, `Requiere: Poder de Conjuro I (tienes (no tomada))`. Typing `arma` matched `Combate con dos armas mejorado`, `Impacto sin arma mejorado`, `Combate con dos armas`, `Sutileza con un arma`, `Soltura con un arma (clava)`, `Competencia con arma sencilla (danzarín sombrío)`, `Competencia con arma (sencilla)`; blocked reasons `Requiere: BAB +9 (tienes +1)`, `Requiere: Ambidextrismo Ambidextrismo (tienes (no tomada))` visible.

### 3. Character sheet Dotes tab shows all feats across levels
expected: Tab shows auto-granted + selected feats grouped by level with slot labels and invalid markers
result: [PASS] Dotes tab in HOJA DE PERSONAJE showed count `55 dotes` for Guerrero L1 grouped under `NIVEL 1` header. Every row carried a slot label (`Automatica` for class-granted feats). Manually selected `Sutileza con un arma` appeared as a `Dote de clase` row. Class/subclass-specific entries included `(PB) Varita de emociones`, `(PB) Bolsa de dados`, `(PB) Herramientas del jugador`, `(PB) Guardar personaje`, `(PB) Ausente`, `Competencia con armadura (ligera)`.

### 4. Revalidation markers when upstream class change invalidates feats
expected: Changing class at level 1 marks previously valid feats as invalid/red with reason; rail shows error
result: [PASS] Swapping L1 class Guerrero → Mago flipped `Sutileza con un arma` to `feat-sheet-tab__row is-illegal` with red border + dim tint; Spanish reason shown inline `Dote de clase  BAB: +0` (Mago L1 BAB = 0, prereq `Ataque base +1`). Dotes-tab counter flipped from `55 dotes` to `22 dotes - 1 invalidas`, surfacing the error at sheet level.

### 5. Proficiency feats visible and selectable like normal feats
expected: Weapon/armor/shield proficiency feats appear in the feat list grouped by category
result: [PASS] Search `Competencia con` surfaced weapon, armor, and shield proficiency feats as first-class list entries: `Competencia con escudo`, `Competencia con arma (sencilla)`, `Competencia con arma sencilla (danzarín sombrío|druida|monje|asesino|mago)`, `Competencia con arma (criatura)`, `Competencia con arma exótica (espada bastarda|espada de dos hojas|maza terrible|...)`, `Competencia con armadura (ligera|intermedia|pesada)`. Legal entries selectable; exotic-weapon variants blocked inline with `Requiere: BAB +1 (tienes +0)`; heavy armor blocked with chained `Requiere: Competencia con armadura (intermedia) Competencia con armadura (intermedia) (tienes (no tomada))`.

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

(none — all scenarios signed off under Phase 11)

## Sign-off — 2026-04-18 (Phase 11)

Signed off via scripted browser walk-through against dev server `http://localhost:5173`
(ruleset `v1.0.0`, dataset `2026-04-17 (cf6e8aad)`). Tests driven through MCP Chrome
automation: Humano + Legal bueno + Atributos (FUE 16 / DES 12 / CON 16 / INT 12 /
SAB 9 / CAR 9, 30/30 pts) + Guerrero L1 as the canonical path; class swap to Mago
used for the revalidation scenario. DOM evidence (H3 section headers, CSS class
`feat-sheet-tab__row is-illegal`, invalid counter `22 dotes - 1 invalidas`,
inline `Requiere: …` reasons) captured at sign-off.

Requirements closed: FEAT-01, FEAT-02, FEAT-03, FEAT-04.
