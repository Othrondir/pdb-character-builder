# Quick Task 260425-qzv: alinear auto-dotes por clase con el listado del planner

**Fecha:** 2026-04-25
**Estado:** completado

## Objetivo

Hacer que el listado de dotes seleccionables respete las dotes auto-otorgadas
por clase y nivel ya presentes en `classFeatLists`, de modo que no aparezcan
como picks manuales cuando la clase ya las concede.

## Tareas

1. Derivar auto-grants acumulados desde los datos de `cls_feat_*`.
2. Excluir esas dotes del pool elegible y del picker activo.
3. Cubrir casos de regresión con Brujo y Guerrero en reglas y UI.
