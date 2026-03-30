---
phase: 02
slug: spanish-first-planner-shell
status: approved
shadcn_initialized: false
preset: none
created: 2026-03-30
---

# Phase 02 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated locally to satisfy the Phase 2 frontend planning gate.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | none |
| Component library | none |
| Icon library | lucide-react |
| Font | Cormorant Garamond + Spectral |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact controls, chips, tab insets |
| md | 16px | Default content spacing |
| lg | 24px | Panel padding, grouped controls |
| xl | 32px | Layout gaps, section spacing |
| 2xl | 48px | Major shell breaks |
| 3xl | 64px | Hero/header spacing on large screens |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.6 |
| Label | 14px | 600 | 1.3 |
| Heading | 32px | 600 | 1.2 |
| Display | 48px | 700 | 1.0 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#e3d8c1` | Parchment page background, main surfaces |
| Secondary (30%) | `#2f241d` | Navigation rail, framed chrome, deep panels |
| Accent (10%) | `#9f7a31` | Active section markers, key badges, ornamental separators |
| Destructive | `#7a1f1f` | Reset/destructive actions only |

Accent reserved for: active navigation state, dataset/version badges, shell dividers, focused primary CTA border treatment

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Continuar construcción` |
| Empty state heading | `La hoja aún está vacía` |
| Empty state body | `Empieza en Construcción para fijar la base del personaje y desbloquear el resto del planificador.` |
| Error state | `No se ha podido cargar la interfaz. Recarga la página o vuelve a la sección anterior.` |
| Destructive confirmation | `Restablecer planificación`: `Esto borrará la configuración actual del personaje.` |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-30
