# Requirements: NWN 1 Character Builder

**Defined:** 2026-03-29
**Core Value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.

## v1 Requirements

### Idioma e identidad del producto

- [ ] **LANG-01**: El usuario puede usar toda la interfaz principal del planner en espanol.
- [ ] **LANG-02**: El usuario ve en espanol los nombres y descripciones de clases, dotes, conjuros, dominios y reglas custom de Puerta de Baldur.
- [ ] **LANG-03**: El usuario puede identificar que una build esta ligada a un conjunto concreto de datos/reglas del servidor.

### Flujo del planner

- [ ] **FLOW-01**: El usuario puede navegar un flujo de pantallas equivalente al builder de NWN2DB para construir su personaje.
- [ ] **FLOW-02**: El usuario puede trabajar con vistas separadas al menos para build, habilidades, conjuros, caracteristicas, estadisticas y resumen.
- [ ] **FLOW-03**: El usuario puede volver a cualquier decision previa sin perder coherencia en la build.

### Identidad del personaje

- [ ] **CHAR-01**: El usuario puede elegir raza y subraza de entre las soportadas por el servidor.
- [ ] **CHAR-02**: El usuario puede elegir alineamiento de forma compatible con las restricciones del servidor.
- [ ] **CHAR-03**: El usuario puede elegir deidad cuando la build lo requiera.
- [ ] **CHAR-04**: El usuario puede ver restricciones o incompatibilidades provocadas por raza, subraza, alineamiento o deidad.

### Caracteristicas y progresion base

- [ ] **ABIL-01**: El usuario puede definir las caracteristicas iniciales segun las reglas de creacion soportadas por el planner.
- [ ] **ABIL-02**: El usuario puede asignar aumentos de caracteristica en los niveles que correspondan.
- [ ] **PROG-01**: El usuario puede construir una progresion completa desde nivel 1 hasta nivel 16.
- [ ] **PROG-02**: El usuario puede subir y bajar niveles sin romper el estado interno de la build.
- [ ] **PROG-03**: El usuario puede ver la progresion nivel a nivel de su personaje.

### Clases y clases de prestigio

- [ ] **CLAS-01**: El usuario puede elegir clases basicas y clases de prestigio soportadas por Puerta de Baldur.
- [ ] **CLAS-02**: El usuario puede ver y cumplir los prerrequisitos de entrada de cada clase o clase de prestigio.
- [ ] **CLAS-03**: El planner bloquea selecciones ilegales segun las reglas de multiclase del servidor, incluidos bloques minimos por clase y excepciones conocidas.
- [ ] **CLAS-04**: El usuario puede ver que aptitudes, hitos o elecciones relevantes gana en cada nivel de clase.

### Habilidades

- [ ] **SKIL-01**: El usuario puede asignar rangos de habilidad por nivel segun la clase elegida y las reglas del servidor.
- [ ] **SKIL-02**: El planner calcula y hace cumplir maximos, costes y restricciones de habilidades clase/transclase cuando aplique.
- [ ] **SKIL-03**: El planner bloquea excepciones de habilidades del servidor, como las restricciones conocidas por armadura pesada u otras reglas explicitadas.

### Dotes y competencias

- [ ] **FEAT-01**: El usuario puede elegir dotes generales, dotes custom y dotes de clase disponibles en el servidor.
- [ ] **FEAT-02**: El usuario puede ver prerrequisitos incumplidos y razones exactas por las que una dote no es legal.
- [ ] **FEAT-03**: El planner modela las competencias con armas, armaduras y escudos segun la version custom del servidor.
- [ ] **FEAT-04**: El planner modela divisiones o cambios custom de competencias y dotes que difieren del NWN base.

### Conjuros y dominios

- [ ] **MAGI-01**: El usuario puede elegir dominios de clerigo soportados por Puerta de Baldur, incluidos los custom.
- [ ] **MAGI-02**: El usuario puede ver como los dominios, clases y progreso del personaje afectan a los conjuros disponibles.
- [ ] **MAGI-03**: El usuario puede elegir conjuros, conjuros conocidos u otras selecciones magicas relevantes segun su clase y nivel.
- [ ] **MAGI-04**: El planner usa la lista de conjuros custom y revisados del servidor en lugar de limitarse al NWN base.

### Validacion y explicaciones

- [ ] **VALI-01**: El planner bloquea builds ilegales en lugar de permitirlas con simples avisos.
- [ ] **VALI-02**: El usuario recibe explicaciones precisas y legibles cuando una eleccion es invalida.
- [ ] **VALI-03**: El planner recalcula automaticamente la build completa cuando cambia cualquier decision.
- [ ] **VALI-04**: El planner evita marcar una build como valida cuando falten datos o exista conflicto entre fuentes de reglas.

### Resumen y comparticion

- [ ] **SHAR-01**: El usuario puede ver una ficha resumen final clara de la build completa.
- [ ] **SHAR-02**: El usuario puede guardar y cargar builds en local.
- [ ] **SHAR-03**: El usuario puede exportar e importar builds en formato JSON.
- [ ] **SHAR-04**: El usuario puede compartir una build mediante URL.
- [ ] **SHAR-05**: Una build compartida por URL o JSON conserva exactamente las decisiones del personaje y la version del dataset usada al crearla.

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
| LANG-01 | Phase ? | Pending |
| LANG-02 | Phase ? | Pending |
| LANG-03 | Phase ? | Pending |
| FLOW-01 | Phase ? | Pending |
| FLOW-02 | Phase ? | Pending |
| FLOW-03 | Phase ? | Pending |
| CHAR-01 | Phase ? | Pending |
| CHAR-02 | Phase ? | Pending |
| CHAR-03 | Phase ? | Pending |
| CHAR-04 | Phase ? | Pending |
| ABIL-01 | Phase ? | Pending |
| ABIL-02 | Phase ? | Pending |
| PROG-01 | Phase ? | Pending |
| PROG-02 | Phase ? | Pending |
| PROG-03 | Phase ? | Pending |
| CLAS-01 | Phase ? | Pending |
| CLAS-02 | Phase ? | Pending |
| CLAS-03 | Phase ? | Pending |
| CLAS-04 | Phase ? | Pending |
| SKIL-01 | Phase ? | Pending |
| SKIL-02 | Phase ? | Pending |
| SKIL-03 | Phase ? | Pending |
| FEAT-01 | Phase ? | Pending |
| FEAT-02 | Phase ? | Pending |
| FEAT-03 | Phase ? | Pending |
| FEAT-04 | Phase ? | Pending |
| MAGI-01 | Phase ? | Pending |
| MAGI-02 | Phase ? | Pending |
| MAGI-03 | Phase ? | Pending |
| MAGI-04 | Phase ? | Pending |
| VALI-01 | Phase ? | Pending |
| VALI-02 | Phase ? | Pending |
| VALI-03 | Phase ? | Pending |
| VALI-04 | Phase ? | Pending |
| SHAR-01 | Phase ? | Pending |
| SHAR-02 | Phase ? | Pending |
| SHAR-03 | Phase ? | Pending |
| SHAR-04 | Phase ? | Pending |
| SHAR-05 | Phase ? | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
