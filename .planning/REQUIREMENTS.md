# Requirements: NWN 1 Character Builder

**Defined:** 2026-03-29
**Core Value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.

## v1 Requirements

### Idioma e identidad del producto

- [x] **LANG-01**: El usuario puede usar toda la interfaz principal del planner en espanol.
- [x] **LANG-02**: El usuario ve en espanol los nombres y descripciones de clases, dotes, conjuros, dominios y reglas custom de Puerta de Baldur.
- [x] **LANG-03**: El usuario puede identificar que una build esta ligada a un conjunto concreto de datos/reglas del servidor.

### Flujo del planner

- [x] **FLOW-01**: El usuario puede navegar un flujo de pantallas equivalente al builder de NWN2DB para construir su personaje.
- [x] **FLOW-02**: El usuario puede trabajar con vistas separadas al menos para build, habilidades, conjuros, caracteristicas, estadisticas y resumen.
- [x] **FLOW-03**: El usuario puede volver a cualquier decision previa sin perder coherencia en la build.

### Identidad del personaje

- [x] **CHAR-01**: El usuario puede elegir raza y subraza de entre las soportadas por el servidor.
- [x] **CHAR-02**: El usuario puede elegir alineamiento de forma compatible con las restricciones del servidor.
- [ ] ~~**CHAR-03**: El usuario puede elegir deidad cuando la build lo requiera.~~ _Descoped v1 → v2 (2026-04-18) — servidor Puerta gestiona deidades via scripts, no 2DA; catálogo de deidades del extractor emite null; no existe picker end-to-end ni setter en foundation store._
- [x] **CHAR-04**: El usuario puede ver restricciones o incompatibilidades provocadas por raza, subraza, alineamiento o deidad.

### Caracteristicas y progresion base

- [x] **ABIL-01**: El usuario puede definir las caracteristicas iniciales segun las reglas de creacion soportadas por el planner.
- [x] **ABIL-02**: El usuario puede asignar aumentos de caracteristica en los niveles que correspondan.
- [x] **PROG-01**: El usuario puede construir una progresion completa desde nivel 1 hasta nivel 16.
- [x] **PROG-02**: El usuario puede subir y bajar niveles sin romper el estado interno de la build.
- [x] **PROG-03**: El usuario puede ver la progresion nivel a nivel de su personaje.

### Clases y clases de prestigio

- [x] **CLAS-01**: El usuario puede elegir clases basicas y clases de prestigio soportadas por Puerta de Baldur.
- [x] **CLAS-02**: El usuario puede ver y cumplir los prerrequisitos de entrada de cada clase o clase de prestigio.
- [x] **CLAS-03**: El planner bloquea selecciones ilegales segun las reglas de multiclase del servidor, incluidos bloques minimos por clase y excepciones conocidas.
- [x] **CLAS-04**: El usuario puede ver que aptitudes, hitos o elecciones relevantes gana en cada nivel de clase.

### Habilidades

- [x] **SKIL-01**: El usuario puede asignar rangos de habilidad por nivel segun la clase elegida y las reglas del servidor.
- [x] **SKIL-02**: El planner calcula y hace cumplir maximos, costes y restricciones de habilidades clase/transclase cuando aplique.
- [x] **SKIL-03**: El planner bloquea excepciones de habilidades del servidor, como las restricciones conocidas por armadura pesada u otras reglas explicitadas.

### Dotes y competencias

- [x] **FEAT-01**: El usuario puede elegir dotes generales, dotes custom y dotes de clase disponibles en el servidor.
- [x] **FEAT-02**: El usuario puede ver prerrequisitos incumplidos y razones exactas por las que una dote no es legal.
- [x] **FEAT-03**: El planner modela las competencias con armas, armaduras y escudos segun la version custom del servidor.
- [x] **FEAT-04**: El planner modela divisiones o cambios custom de competencias y dotes que difieren del NWN base.

### Conjuros y dominios

- [ ] ~~**MAGI-01**: El usuario puede elegir dominios de clerigo soportados por Puerta de Baldur, incluidos los custom.~~ _Descoped v1 → v2 (superseded by Phase 07.2) — domain picker eliminado; extractor conserva catálogo tras flag `EMIT_MAGIC_CATALOGS=1`._
- [ ] ~~**MAGI-02**: El usuario puede ver como los dominios, clases y progreso del personaje afectan a los conjuros disponibles.~~ _Descoped v1 → v2 (superseded by Phase 07.2) — UI de selección de conjuros eliminada._
- [ ] ~~**MAGI-03**: El usuario puede elegir conjuros, conjuros conocidos u otras selecciones magicas relevantes segun su clase y nivel.~~ _Descoped v1 → v2 (superseded by Phase 07.2) — pestaña Conjuros eliminada._
- [ ] ~~**MAGI-04**: El planner usa la lista de conjuros custom y revisados del servidor en lugar de limitarse al NWN base.~~ _Descoped v1 → v2 (superseded by Phase 07.2) — extractor conserva catálogo tras flag `EMIT_MAGIC_CATALOGS=1`, runtime no lo consume._

### Validacion y explicaciones

- [x] **VALI-01**: El planner bloquea builds ilegales en lugar de permitirlas con simples avisos.
- [ ] **VALI-02**: El usuario recibe explicaciones precisas y legibles cuando una eleccion es invalida. _Non-magic shipped via Phase 06 (FeatBoard prereq checklist, skill repair reasons, class prereq rail); magic portion descoped por Phase 07.2; pendiente reclasificación explícita en Phase 9._
- [x] **VALI-03**: El planner recalcula automaticamente la build completa cuando cambia cualquier decision.
- [x] **VALI-04**: El planner evita marcar una build como valida cuando falten datos o exista conflicto entre fuentes de reglas.

### Resumen y comparticion

- [x] **SHAR-01**: El usuario puede ver una ficha resumen final clara de la build completa.
- [x] **SHAR-02**: El usuario puede guardar y cargar builds en local.
- [x] **SHAR-03**: El usuario puede exportar e importar builds en formato JSON.
- [x] **SHAR-04**: El usuario puede compartir una build mediante URL.
- [x] **SHAR-05**: Una build compartida por URL o JSON conserva exactamente las decisiones del personaje y la version del dataset usada al crearla.

## v2 Requirements

### Localizacion

- **LANG-04**: El usuario puede cambiar entre espanol e ingles sin perder la coherencia de la build.

### Utilidad avanzada

- **SHAR-06**: El usuario puede imprimir o exportar una ficha en formato listo para compartir fuera de la web.
- **COMP-01**: El usuario puede comparar dos builds lado a lado.
- **DATA-01**: El usuario puede ver un changelog entre versiones de dataset para entender por que una build antigua cambia de validez.

### Contenido ampliado

- **LORE-01**: El usuario puede consultar una enciclopedia interna de clases, dotes y conjuros sin salir del planner.
- **PROG-04**: El usuario puede planificar por encima de nivel 16 cuando el proyecto amplie el alcance.

### Descoped from v1 (2026-04-18)

- **CHAR-03** _(re-evaluar)_: Picker de deidad end-to-end — servidor Puerta gestiona deidades via scripts, no 2DA; extractor emite null. Decisión: diferido a v2.
- **MAGI-01..04** _(superseded by Phase 07.2)_: UI de magia completa eliminada (dominios de clérigo, selección de conjuros, per-level spell view, listas custom). Data-extractor conserva catálogos tras flag `EMIT_MAGIC_CATALOGS=1` para rehabilitación futura.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Integracion directa con el servidor o con el cliente del juego | El producto inicial es un planner standalone |
| Backend, cuentas de usuario o sincronizacion cloud | Debe funcionar como sitio estatico en GitHub Pages |
| Biblioteca publica de builds | El uso inicial es personal y de intercambio directo |
| Edicion colaborativa en tiempo real | No es necesaria para la v1 |
| Copia visual 1:1 de NWN2DB | Solo se busca equivalencia de flujo y pantallas, con estetica propia de NWN1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LANG-01 | Phase 2 → Phase 9 | Pending (verification closure) |
| LANG-02 | Phase 7 → Phase 9 | Pending (verification closure) |
| LANG-03 | Phase 8 | Complete |
| FLOW-01 | Phase 2 → Phase 9 + Phase 10 | Pending (verification closure + attributes→level1 integration fix) |
| FLOW-02 | Phase 2 → Phase 9 | Pending (verification closure) |
| FLOW-03 | Phase 4 | Complete |
| CHAR-01 | Phase 3 | Complete |
| CHAR-02 | Phase 3 | Complete |
| CHAR-03 | — | Descoped v1 → v2 (2026-04-18) |
| CHAR-04 | Phase 3 | Complete |
| ABIL-01 | Phase 3 | Complete |
| ABIL-02 | Phase 4 | Complete |
| PROG-01 | Phase 4 | Complete |
| PROG-02 | Phase 4 | Complete |
| PROG-03 | Phase 4 | Complete |
| CLAS-01 | Phase 4 | Complete |
| CLAS-02 | Phase 4 | Complete |
| CLAS-03 | Phase 4 | Complete |
| CLAS-04 | Phase 4 | Complete |
| SKIL-01 | Phase 5 | Complete |
| SKIL-02 | Phase 5 | Complete |
| SKIL-03 | Phase 5 | Complete |
| FEAT-01 | Phase 6 | Complete |
| FEAT-02 | Phase 6 → Phase 12 | Complete (user-visible class-label bug IN-07 pending Phase 12 fix) |
| FEAT-03 | Phase 6 | Complete |
| FEAT-04 | Phase 6 | Complete |
| MAGI-01 | Phase 7 → — | Descoped v1 → v2 (superseded by Phase 07.2) |
| MAGI-02 | Phase 7 → — | Descoped v1 → v2 (superseded by Phase 07.2) |
| MAGI-03 | Phase 7 → — | Descoped v1 → v2 (superseded by Phase 07.2) |
| MAGI-04 | Phase 7 → — | Descoped v1 → v2 (superseded by Phase 07.2) |
| VALI-01 | Phase 7 | Complete (non-magic; shell aggregate `validationStatus` orphan tracked in Phase 10) |
| VALI-02 | Phase 7 → Phase 9 | Pending (non-magic satisfied; explicit audit pass required) |
| VALI-03 | Phase 7 | Complete |
| VALI-04 | Phase 1 → Phase 9 | Pending (verification closure) |
| SHAR-01 | Phase 8 | Complete |
| SHAR-02 | Phase 8 → Phase 10 | Complete (loadSlot diffRuleset gate added in Phase 10) |
| SHAR-03 | Phase 8 | Complete |
| SHAR-04 | Phase 8 | Complete |
| SHAR-05 | Phase 8 → Phase 10 | Complete (slot-load fail-closed parity in Phase 10) |

**Coverage:**
- v1 requirements: 39 total
- Active in v1: 34 (5 descoped: CHAR-03, MAGI-01, MAGI-02, MAGI-03, MAGI-04)
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-04-18 after milestone v1.0 audit + gap closure plan (Phases 9-12)*
