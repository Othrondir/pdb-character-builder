# Phase 06: Feats & Proficiencies - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 06-feats-proficiencies
**Areas discussed:** Seleccion de dotes por nivel, Feedback de prerrequisitos, Competencias y overrides Puerta, Coherencia con decisiones previas

---

## Seleccion de dotes por nivel

| Option | Description | Selected |
|--------|-------------|----------|
| Solo elegibles | Mostrar solo las dotes que el build puede tomar en ese nivel. Reduce 1487 a ~20-50 opciones reales. | ✓ |
| Todas con estado | Mostrar todas con las no elegibles bloqueadas/gris con razon del bloqueo. | |
| Filtro toggle | Por defecto solo elegibles, con toggle para ver bloqueadas. | |

**User's choice:** Solo elegibles
**Notes:** Keeps the list clean and manageable given 1,487 total feats.

| Option | Description | Selected |
|--------|-------------|----------|
| Clase vs General | Dos secciones: 'Dotes de clase' y 'Dotes generales'. Replica NWN1. | ✓ |
| Por categoria tematica | Agrupar por tipo: Combate, Magia, Habilidad, Metamagia, etc. | |
| Lista plana con busqueda | Sin agrupacion, con campo de busqueda. | |

**User's choice:** Clase vs General
**Notes:** Faithful to NWN1's slot distinction. Maps directly to classFeatLists.list field.

| Option | Description | Selected |
|--------|-------------|----------|
| Seleccion secuencial | Primero dote de clase, luego general. Dos pasos claros. | ✓ |
| Seleccion simultanea | Ambos slots en la misma pantalla lado a lado. | |
| Slot unico con indicador | Una sola lista unificada con badge por tipo de slot. | |

**User's choice:** Seleccion secuencial
**Notes:** Matches NWN1 flow where class feat and general feat are separate selection moments.

| Option | Description | Selected |
|--------|-------------|----------|
| Nombre + prereqs en linea | Cada dote muestra nombre y prereqs cumplidos debajo. | ✓ |
| Nombre solo, detalle al lado | Lista solo nombres, DetailPanel muestra al seleccionar. | |
| Iconos de categoria | Nombre + icono de tipo sin detalles inline. | |

**User's choice:** Nombre + prereqs en linea
**Notes:** Inline prereq display gives immediate context without extra clicks.

| Option | Description | Selected |
|--------|-------------|----------|
| Resumen en gains, no seleccionable | Auto-granted aparecen en resumen de gains, no como slot. | ✓ |
| Pre-seleccionadas en la lista | Aparecen en la lista ya marcadas/locked. | |
| Seccion separada 'Otorgadas' | Seccion visual aparte arriba de la lista de seleccion. | |

**User's choice:** Resumen en gains, no seleccionable
**Notes:** Leverages existing level-gains.ts features[] field. No UI slot consumed.

---

## Feedback de prerrequisitos

| Option | Description | Selected |
|--------|-------------|----------|
| Buscador + razon de bloqueo | Campo de busqueda; dotes no elegibles aparecen bloqueadas con razon exacta. | ✓ |
| Panel 'Por que no puedo...' | Boton que abre panel con todas las dotes filtradas y razones. | |
| Toggle ver bloqueadas | Switch que muestra/oculta dotes bloqueadas en la lista. | |

**User's choice:** Buscador + razon de bloqueo
**Notes:** Fulfills FEAT-02 without cluttering the default eligible-only view. Search-based exploration.

| Option | Description | Selected |
|--------|-------------|----------|
| Inline bajo el nombre | Dote gris con texto rojo/ambar debajo con cada prereq fallido. | ✓ |
| En el DetailPanel al seleccionar | Panel lateral muestra tabla de prereqs con checkmarks. | |
| Tooltip al hover | Hover muestra tooltip con prereqs fallidos. | |

**User's choice:** Inline bajo el nombre
**Notes:** No extra click needed to see why a feat is blocked. Visible in search results directly.

---

## Competencias y overrides Puerta

| Option | Description | Selected |
|--------|-------------|----------|
| Override en feat catalog | Competencias son feats en el catalogo. Verificar extractor las capturo. | ✓ |
| Archivo override manual | JSON manual separado para competencias custom. | |
| Mixto: catalog + manual override | Catalogo para extractor, manual para scripts/foro. | |

**User's choice:** Override en feat catalog
**Notes:** Proficiencies should already be in the extracted 2DA data. Single source of truth.

| Option | Description | Selected |
|--------|-------------|----------|
| Dentro de las dotes | Competencias son dotes normales en la lista y sheet. NWN1 style. | ✓ |
| Seccion dedicada en sheet | Sub-seccion separada: Armas, Armaduras, Escudos. | |
| Tab aparte en el sheet | Tab nuevo 'Competencias' en el character sheet. | |

**User's choice:** Dentro de las dotes
**Notes:** Matches NWN1 where proficiencies are just feats. No separate UI treatment.

---

## Coherencia con decisiones previas

| Option | Description | Selected |
|--------|-------------|----------|
| Marcar invalida, no borrar | Dote invalidada sigue seleccionada pero marcada invalida/roja con razon. | ✓ |
| Borrar automaticamente | Dotes invalidadas se eliminan, jugador re-elige. | |
| Advertir sin bloquear | Warning en resumen pero permite build con dotes invalidas. | |

**User's choice:** Marcar invalida, no borrar
**Notes:** Consistent with Phase 4 progression revalidation pattern. Preserves player work.

| Option | Description | Selected |
|--------|-------------|----------|
| Rail + sheet + resumen | Severidad proyectada a rail, sheet tab, y summary strip. | ✓ |
| Solo en el step de dotes | Solo visible al abrir sub-step de dotes del nivel. | |
| Notificacion global | Banner/toast persistente arriba avisando dotes invalidadas. | |

**User's choice:** Rail + sheet + resumen
**Notes:** Same severity projection pattern as skills and progression. Consistent across the app.

---

## Claude's Discretion

- Category number to label mapping
- Search field implementation details
- Prerequisite evaluation function signature
- Visual treatment of section headers
- Prerequisite display format (icons vs text vs both)

## Deferred Ideas

None — discussion stayed within phase scope.
