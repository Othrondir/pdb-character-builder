# Planificador de Fichas para Puerta de Baldur (NWN 1 EE) 
https://puertadebaldur.com

Pequeño proyecto hecho en ratos libres con ayuda de Claude, Codex y Caveman.

El objetivo es crear un planificador web para **Neverwinter Nights 1 Enhanced Edition** centrado en las reglas, clases, dotes, contenido personalizado y excepciones del servidor español **Puerta de Baldur**.

La aplicación está planteada como una **web estática**, sin backend, pensada para poder publicarse en **GitHub Pages** y seguir siendo útil tanto para uso personal como para compartir builds con otros jugadores.

## Qué es este proyecto

Este repositorio contiene una SPA en React para planificar personajes de nivel 1 a 20 con validación estricta. La idea no es solo "hacer una build bonita", sino comprobar que la build sea legal según las reglas del servidor y que pueda compartirse de forma fiable.

La referencia de flujo es NWN2DB, pero la identidad visual y el enfoque están adaptados a NWN1.

## Cómo funciona la web

Funcionalmente, la web está pensada para acompañar la creación de una ficha paso a paso:

1. **Origen del personaje**
   - Selección de raza.
   - Selección de alineamiento.
   - Reparto de atributos iniciales.

2. **Progresión por niveles**
   - Edición de la build del nivel 1 al 16.
   - Selección de clase por nivel.
   - Selección de habilidades por nivel.
   - Selección de dotes por nivel.

3. **Validación estricta**
   - La app bloquea decisiones ilegales en lugar de limitarse a avisar.
   - Se comprueban prerrequisitos de clases, dotes, habilidades y clases de prestigio.
   - También se tienen en cuenta restricciones del servidor y reglas específicas de multiclaseo.

4. **Resumen de personaje**
   - Vista final de identidad, atributos, progresión, dotes y habilidades.
   - Pensado como hoja resumida de la build ya montada.

5. **Persistencia y compartición**
   - Guardado local.
   - Carga de builds guardadas.
   - Importación y exportación en JSON.
   - Compartición mediante URL.

## En qué se apoya

El proyecto está dividido en tres piezas principales:

- `apps/planner`
  - La aplicación web.
- `packages/rules-engine`
  - El motor de reglas y validación.
- `packages/data-extractor`
  - El compilador de datos que transforma datos base de NWN y datos de Puerta de Baldur en datasets consumibles por la web.

La web no parsea assets crudos del juego en el navegador. En runtime solo consume datasets ya compilados.

## Estado actual

El proyecto sigue en desarrollo, pero la base funcional ya está orientada a:

- construir personajes por niveles,
- validar restricciones importantes del servidor,
- mantener una interfaz en español,
- y preparar builds que se puedan revisar y compartir.

## Stack

- Node.js
- pnpm
- TypeScript
- React
- Vite
- Zustand
- Zod
- Dexie
- Vitest

## Desarrollo local

Instalación:

```bash
corepack pnpm install
```

Modo desarrollo:

```bash
corepack pnpm dev:planner
```

Build de producción:

```bash
corepack pnpm build:planner
```

Tests:

```bash
corepack pnpm test
```

## Idea del proyecto

La meta es simple: que un jugador de **Puerta de Baldur** pueda preparar una ficha completa con confianza, detectar errores antes de entrar al servidor y compartir esa build de forma cómoda con otra persona.
