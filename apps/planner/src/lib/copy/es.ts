export const shellCopyEs = {
  footer: {
    datasetAria: 'Versión del ruleset y del dataset en uso',
  },
  resumen: {
    heading: 'Resumen del personaje',
    datasetHeadingAria: 'Versión del ruleset y del dataset de esta build',
    progressionBlockHeading: 'Progresión',
    skillsBlockHeading: 'Habilidades',
    // Phase 12.9-02 / R6 tidy: the old identity-block heading key, the attribute
    // column-label keys, and the ability-label subtree were dropped alongside the
    // identity + attrs table deletion (D-03 + D-08). Repo-wide grep confirmed zero
    // consumers outside the prior declaration site.
    columnLabels: {
      level: 'Nivel',
      className: 'Clase',
      bab: 'BAB',
      fortitude: 'Fort.',
      reflex: 'Ref.',
      will: 'Vol.',
      generalFeat: 'Dote general',
      classFeat: 'Dote de clase',
      skill: 'Habilidad',
      ranks: 'Rangos',
      abilityMod: 'Mod. atr.',
      skillTotal: 'Total',
    },
    emptyNamePlaceholder: 'Sin nombre',
    notAvailable: '—',
    actions: {
      save: 'Guardar',
      load: 'Cargar',
      export: 'Exportar JSON',
      import: 'Importar JSON',
      share: 'Compartir',
    },
    loadingState: 'Cargando slots…',
    noSlotsMessage: 'No hay builds guardadas todavía.',
    emptyState: {
      heading: 'Todavía no hay ficha que mostrar',
      body: 'Elige raza y alineamiento en Construcción para ver la ficha completa de tu personaje. Mientras tanto puedes cargar una build guardada o importar un JSON.',
    },
  },
  persistence: {
    saveDialog: {
      title: 'Guardar build',
      body: 'Escribe un nombre para esta build. Usaremos ese nombre como identificador del slot.',
      nameLabel: 'Nombre',
      namePlaceholder: 'mi paladín tier-1',
      confirm: 'Guardar',
      cancel: 'Cancelar',
    },
    overwriteDialog: {
      title: 'El nombre ya existe',
      body: 'Ya hay una build guardada con ese nombre. ¿Quieres sobrescribirla?',
    },
    loadDialog: {
      title: 'Cargar build',
      body: 'Selecciona una build guardada. Reemplazará el estado actual.',
      cancel: 'Cancelar',
    },
    importError: 'El archivo no se pudo importar: {reason}',
    importSuccess: 'Build importada correctamente.',
    saveSuccess: 'Build "{name}" guardada.',
    loadSuccess: 'Build "{name}" cargada.',
    privateModeUnavailable: 'Guardado local no disponible en este modo del navegador.',
    incompleteBuild:
      'Completa raza y alineamiento antes de guardar, exportar o compartir la build.',
    versionMismatch: {
      title: 'Versión incompatible',
      body: 'Esta build usa una versión de reglas o dataset distinta a la que usa este planner. No se puede cargar con exactitud — las reglas pueden haber cambiado y la build dejaría de ser legal.',
      rulesetLabel: 'Ruleset',
      datasetLabel: 'Dataset',
      note: 'Descarga el JSON para conservar la build tal cual, o cancela para mantener tu construcción actual.',
      downloadJson: 'Descargar JSON',
      cancel: 'Cancelar',
    },
    shareError: {
      title: 'URL no válida',
      emptyPayload: 'La URL de compartir no contiene una build.',
      invalidPayload: 'La URL de compartir no se pudo leer. Pide al remitente una versión nueva.',
      returnHome: 'Volver',
    },
    shareLoading: 'Cargando build compartida…',
    shareSuccess: 'Build compartida cargada.',
    shareFallback: 'Build demasiado grande para URL. Descarga el JSON para compartirla.',
  },
  appTitle: 'Planificador de personaje',
  subtitle: 'Puerta de Baldur · Neverwinter Nights EE',
  primaryAction: 'Continuar construcción',
  menuLabel: 'Abrir navegación',
  closeMenuLabel: 'Cerrar navegación',
  summaryToggleLabel: 'Mostrar u ocultar resumen',
  summaryHeading: 'Resumen del personaje',
  summaryFields: {
    character: 'Personaje',
    targetLevel: 'Nivel objetivo',
    dataset: 'Conjunto de datos',
    skillBlockedLevels: 'Niveles bloqueados',
    skillConfiguredLevel: 'Habilidades hasta',
    skillRemainingPoints: 'Restantes en habilidades',
    skillSpentPoints: 'Gastados en habilidades',
    validation: 'Validación',
    planState: 'Estado del plan',
  },
  summaryValues: {
    character: 'Sin configuración',
    targetLevel: '1-16',
    dataset: 'pendiente',
    validation: 'No evaluada',
    planState: 'Base de interfaz',
  },
  foundation: {
    blockedChoice:
      'Elección bloqueada: completa el paso anterior o cambia la opción marcada para continuar.',
    confirmOrigin: 'Confirmar origen',
    currentStateBody:
      'Define el origen para desbloquear la base del personaje.',
    currentStateHeading: 'Estado actual',
    lockedAbilitiesBody:
      'Selecciona raza, subraza y alineamiento en Construcción para desbloquear Atributos.',
    lockedAbilitiesHeading: 'El origen del personaje sigue incompleto',
    planStates: {
      blocked: 'Origen incompleto',
      invalid: 'Base en conflicto',
      ready: 'Origen definido',
    },
    remainingPoints: 'Puntos restantes',
    resetBase:
      'Reiniciar base: se perderán el origen y las características iniciales.',
    spentPoints: 'Puntos gastados',
    stepHints: {
      alignmentLocked: 'La alineación se activa después de elegir la raza.',
      subraceLocked: 'La subraza se activa después de elegir la raza.',
    },
    steps: {
      alignment: 'Alineamiento',
      race: 'Raza',
      subrace: 'Subraza',
    },
  },
  attributes: {
    // Phase 12.6 (D-07, UI-SPEC § Copywriting Contract) — ATTR-01 R3 fail-closed
    pointBuyMissing: (raceLabel: string) =>
      `Curva punto-compra no disponible para ${raceLabel}`,
    pointBuyMissingBody:
      'El servidor aún no tiene una curva de coste publicada para esta raza. Cambia de raza para seguir o contacta con el DM.',
  },
  progression: {
    abilityHeading: 'Aumento de característica',
    abilityHelper:
      'Este nivel concede un aumento de característica que se reflejará en Atributos.',
    classSectionHeading: 'Clase del nivel',
    // Phase 12.4-06 — class-picker two-section render (SPEC R1 / D-01).
    classSectionBase: 'Clases básicas',
    classSectionPrestige: 'Clases de prestigio',
    // Phase 12.4-06 — threshold-only prereq evidence copy (D-02).
    // Labels are primary-rendered by `reachableAtLevelN`
    // (packages/rules-engine/src/progression/prestige-gate.ts); these
    // templates stay here as the UI-layer contract and grep anchor.
    prestigePrereqTemplates: {
      l1Only: 'Disponible a partir del nivel 2',
      bab: 'Requiere BAB ≥ {N}',
      skillRankSingular: 'Requiere 1 rango de {skillName}',
      skillRankPlural: 'Requiere {N} rangos de {skillName}',
      feat: 'Requiere dote: {featName}',
      classLevelSingular: 'Requiere 1 nivel de {className}',
      classLevelPlural: 'Requiere {N} niveles de {className}',
      unvetted: 'Requisitos en revisión',
      // Phase 12.8-02 (D-08) — UI-layer contract for the six new evaluator
      // branches. Helper functions in prestige-gate.ts emit these strings
      // inline; these keys stay as the Spanish-first grep anchor (LANG-01).
      arcaneSpellLevelSingular: 'Requiere lanzar 1 nivel de conjuro arcano',
      arcaneSpellLevelPlural: 'Requiere lanzar conjuros arcanos de nivel {N}',
      spellLevelSingular: 'Requiere lanzar 1 nivel de conjuro',
      spellLevelPlural: 'Requiere lanzar conjuros de nivel {N}',
      excludedClass: 'Incompatible con {className}',
      anyFeatGroupSingle: 'Requiere dote: {featName}',
      anyFeatGroupMulti: 'Requiere una de estas dotes: {featNames}',
      anyRace: 'Requiere raza: {raceNames}',
      anyClassLevel: 'Requiere {classLevelList}',
    },
    editOrigin: 'Editar origen',
    foundationStripHeading: 'Base del personaje',
    gainsHeading: 'Ganancias del nivel',
    levelLabel: 'Nivel',
    levelSheetHeading: 'Hoja del nivel',
    planStates: {
      empty: 'Sin progresión',
      inProgress: 'Progresión en curso',
      invalid: 'Ruta inválida',
      ready: 'Lista para habilidades',
      repair: 'Progresión en reparación',
    },
    placeholderBody: 'Selecciona una clase para empezar la progresión.',
    railHeading: 'Progresión 1-20',
    repairCallout:
      'Este nivel se conserva, pero depende de corregir decisiones anteriores.',
    requirementsHeading: 'Requisitos de entrada',
    statuses: {
      blocked: 'Bloqueada',
      illegal: 'Inválida',
      legal: 'Legal',
      pending: 'Pendiente',
    },
    // Phase 12.4-09 — LevelEditorActionBar dynamic advance button (SPEC R2, CONTEXT D-06).
    // Three mutually-exclusive label states driven by selectLevelCompletionState +
    // computeAdvanceLabel (feat deficit > skill deficit > enabled continue). Plural-aware.
    advanceButton: {
      continueTemplate: 'Continuar al nivel {N}',
      deficitFeatsSingular: 'Falta 1 dote que asignar en este nivel',
      deficitFeatsPluralTemplate: 'Faltan {N} dotes que asignar en este nivel',
      deficitSkillsSingular: 'Falta 1 punto de habilidad por gastar',
      deficitSkillsPluralTemplate: 'Faltan {N} puntos de habilidad por gastar',
    },
    // Phase 12.6 (UI-SPEC § Copywriting Contract) — PROG-04 R5+R6 scan-surface copy
    legalityLabels: {
      legal: 'Nivel válido',
      incomplete: 'Nivel incompleto',
      invalid: 'Nivel inválido',
      locked: 'Nivel bloqueado',
    },
    pillEmpty: {
      class: 'Sin clase',
    },
    pillTemplate: {
      feats: '{chosen}/{slots} dotes',
      skills: '{spent}/{budget} pts',
    },
    lockedRowAriaTemplate: 'Nivel {N} bloqueado — completa el nivel anterior',
    rowAriaTemplate: 'Nivel {N}, {classLabel}, {legalityLabel}',
    // Phase 12.7-03 (F1 R5, D-12) — row-pill "Nivel N" prefix.
    // Template-fn form mirrors shellCopyEs.attributes.pointBuyMissing
    // (line 148) — single-param string interpolation. Gap between this
    // strong + adjacent pills is rendered by .level-progression-row__header
    // CSS `gap: var(--space-sm)` (app.css:2191) so textContent carries
    // whitespace between tokens without any new CSS.
    rowLevelPrefix: (level: number) => `Nivel ${level}`,
  },
  skills: {
    availablePointsLabel: 'Puntos disponibles',
    capLabel: 'Tope',
    classLabel: 'Clase',
    classSkillLabel: 'Clase',
    crossClassSkillLabel: 'Transclase',
    decreaseRankLabel: 'Reducir rango',
    emptyStateBody:
      'Completa una progresión válida en Construcción para repartir rangos por nivel.',
    emptyStateHeading: 'Las habilidades siguen bloqueadas',
    errorState:
      'Reparto bloqueado: revisa la clase, la Inteligencia o la restricción marcada y corrige el nivel anterior para continuar.',
    increaseRankLabel: 'Aumentar rango',
    invalidLevelHint: 'El reparto de este nivel supera los límites permitidos.',
    invalidRankHint: 'Ajusta el rango para mantener el reparto dentro del límite legal.',
    lockedBody:
      'Completa una progresión válida en Construcción para repartir rangos por nivel.',
    nextCostLabel: 'Siguiente coste',
    railHeading: 'Habilidades 1-16',
    rankLabel: 'Rango',
    remainingPointsLabel: 'Puntos restantes',
    repairCallout:
      'Este nivel conserva sus rangos, pero depende de corregir decisiones anteriores.',
    repairRailLabel: 'Depende del nivel',
    sheetHeading: 'Hoja de habilidades',
    spentPointsLabel: 'Puntos gastados',
    statsAllocatedSkillsLabel: 'Habilidades con rangos',
    statsCapsCostsHeading: 'Topes y costes',
    statsDescription:
      'Lectura técnica del snapshot activo de habilidades: totales, topes, costes y bloqueos sin edición.',
    statsPenaltiesHeading: 'Penalizaciones y bloqueos',
    statsTotalsHeading: 'Totales',
    trainedOnlyLabel: 'Solo entrenada',
    // Phase 12.4-05 — R4 Habilidades class/transclase section split (SPEC R4, CONTEXT D-09).
    sectionClassHeading: 'Habilidades de clase',
    sectionClassCostHint: '· coste 1 pt/rango',
    sectionCrossClassHeading: 'Habilidades transclase',
    sectionCrossClassCostHint: '· coste 2 pts/rango',
    planStates: {
      empty: 'Sin reparto de habilidades',
      inProgress: 'Habilidades en curso',
      ready: 'Habilidades listas',
      repair: 'Habilidades en reparacion',
    },
  },
  feats: {
    classFeatStepTitle: 'Dote de clase',
    classFeatConfirm: 'Confirmar dote de clase',
    detailPanelHint: 'Selecciona una dote para ver sus requisitos y detalles.',
    emptyStateBody: 'Completa una progresion valida en Construccion para seleccionar dotes por nivel.',
    emptyStateBodyPerLevel: 'Selecciona una clase para este nivel antes de asignar dotes.',
    emptyStateHeading: 'Las dotes siguen bloqueadas',
    errorState: 'Seleccion no permitida: revisa los requisitos marcados y corrige el paso anterior.',
    generalFeatStepTitle: 'Dote general',
    generalFeatConfirm: 'Confirmar dote general',
    noSearchResults: 'Ninguna dote coincide con la busqueda.',
    planStates: {
      empty: 'Sin dotes seleccionadas',
      inProgress: 'Dotes en curso',
      ready: 'Dotes listas',
      repair: 'Dotes en reparacion',
    },
    prereqPrefix: 'Requiere:',
    prereqFulfilled: '(cumplido)',
    prereqFeatNotTaken: '(no tomada)',
    prereqFeatTaken: '(tomada)',
    prereqNoneMet: '(ninguna tomada)',
    removeFeatTitle: 'Quitar dote',
    removeFeatBody: 'Quitar {featName} invalidara {dependentFeatName} en el nivel {level}. Continuar?',
    removeFeatConfirm: 'Quitar dote',
    removeFeatCancel: 'Cancelar',
    searchPlaceholder: 'Buscar dotes...',
    sectionClassFeats: 'Dotes de clase',
    sectionGeneralFeats: 'Dotes generales',
    availableHeading: 'Disponibles',
    unavailableHeading: 'No disponibles',
    sheetTabTotal: '{count} dotes',
    sheetTabInvalid: '{count} invalidas',
    autoGrantedLabel: 'Automatica',
    slotPromptClassAvailable: 'Dote de clase disponible.',
    slotPromptGeneralAvailable: 'Dote general disponible.',
    slotPromptGeneralAvailablePluralTemplate: '{N} dotes generales disponibles.',
    generalFeatBonusStepTitleTemplate: 'Dote general {N}',
    generalSlotSummaryTemplate: '{chosen}/{slots} dotes generales elegidas',
    slotStatusCurrent: 'Ahora',
    slotStatusPending: 'Pendiente',
    slotStatusChosen: 'Elegida',
    slotStatusEmpty: 'Sin elegir',
    // Phase 12.4-07 — Dotes selectability states + slot counter + collapse
    // (SPEC R5 / CONTEXT D-03 + D-04). Template copy is rendered directly by
    // the feat-board selector; pill / reason labels emitted per row state.
    slotCounterTemplate: 'Dotes del nivel {N}: {chosen}/{slots}',
    blockedPills: {
      prereq: 'Bloqueada',
      alreadyTakenTemplate: 'Tomada en N{level}',
      budget: 'Sin slots',
    },
    blockedReasons: {
      prereqFeatTemplate: 'Requiere dote: {featName}',
      prereqAbilityTemplate: 'Requiere {abilityLabel} {N}',
      prereqBabTemplate: 'Requiere BAB ≥ {N}',
      prereqSkillRankSingularTemplate: 'Requiere 1 rango de {skillName}',
      prereqSkillRankPluralTemplate: 'Requiere {N} rangos de {skillName}',
      prereqClassLevelSingularTemplate: 'Requiere 1 nivel de {className}',
      prereqClassLevelPluralTemplate: 'Requiere {N} niveles de {className}',
      prereqFortSaveTemplate: 'Requiere Fortaleza ≥ {N}',
      prereqCharacterLevelTemplate: 'Requiere nivel de personaje ≥ {N}',
      prereqOrFeatsTemplate: 'Requiere una de: {featNames}',
      prereqGeneric: 'Requisitos no cumplidos',
      budgetExhausted: 'Sin slots disponibles en este nivel',
    },
    modifySelectionLabel: 'Modificar selección',
    // Phase 12.8-03 (D-05, UAT-2026-04-23 F4) — per-chip deselect aria label.
    // Spanish-first per LANG-01. Rendered as `${deselectChipAriaLabel}: ${featLabel}`
    // on each × button inside <FeatSummaryCard> so screen readers announce
    // the feat name being cleared.
    deselectChipAriaLabel: 'Quitar selección',
    // Phase 12.4-08 — parameterized feat-family fold + inline expander
    // (SPEC R7 / CONTEXT D-05). Pill reads `{N} objetivos` or `1 objetivo`;
    // expander legend reads `Elige {paramLabel}` (`habilidad`, `escuela de
    // magia`, `arma`) fed by the extractor `parameterizedFeatFamily.paramLabel`.
    // UAT-2026-04-24 E9 — pill copy reads "Seleccionar tipo" instead of
    // the previous "{N} objetivos" — user feedback in Dotes sweep said
    // the "objetivos" framing was opaque. Count is dropped; the expander
    // legend still lists every target.
    familyPillSingular: 'Seleccionar tipo',
    familyPillPluralTemplate: 'Seleccionar tipo',
    familyLegendPrefix: 'Elige',
  },
  stepper: {
    heading: 'Creacion de personajes',
    originHeading: 'Origen',
    progressionHeading: 'Progresion',
    originSteps: {
      race: 'Raza',
      alignment: 'Alineamiento',
      attributes: 'Atributos',
    },
    levelSubSteps: {
      class: 'Clase',
      skills: 'Habilidades',
      feats: 'Dotes',
    },
    sheetTabs: {
      stats: 'Estadisticas',
      skills: 'Habilidades',
      feats: 'Dotes',
    },
    characterSheetHeading: 'Hoja de personaje',
    emptySheetHeading: 'La hoja aun esta vacia',
    emptySheetBody: 'Empieza seleccionando una raza para definir la base de tu personaje.',
    blockedStepHint: 'Completa el paso anterior para desbloquear esta opcion.',
    levelEmptyHint: 'Selecciona una clase para empezar este nivel.',
    errorState: 'Seleccion no permitida: revisa los requisitos marcados y corrige el paso anterior.',
    progressionUnlock: {
      heading: 'La progresion sigue bloqueada',
      intro: 'Completa raza, alineamiento y atributos antes de abrir la progresion.',
      goToStep: 'Ir a {step}',
    },
    resetOriginLabel: 'Reiniciar origen',
    resetOriginConfirm: 'Se perderan el origen y los atributos iniciales. Continuar?',
    resetLevelLabel: 'Reiniciar nivel',
    resetLevelConfirm: 'Se perderan las decisiones de este nivel. Continuar?',
    resetAllLabel: 'Reiniciar todo',
    resetAllConfirm: 'Se perdera toda la construccion del personaje. Continuar?',
    resumenLabel: 'Resumen',
    openNav: 'Menú',
    closeNav: 'Cerrar menú',
    jugarLabel: 'Jugar',
    reiniciarLabel: 'Reiniciar',
    cancelarLabel: 'Cancelar',
    stepTitles: {
      race: 'Selecciona la raza de tu personaje',
      alignment: 'Selecciona el alineamiento del personaje',
      attributes: 'Ajusta las caracteristicas iniciales',
      class: 'Selecciona la clase del nivel',
      skills: 'Distribuir puntos de habilidad',
      feats: 'Selecciona las dotes del nivel',
    },
  },
  emptyStateHeading: 'La hoja aún está vacía',
  emptyStateBody:
    'Empieza en Construcción para fijar la base del personaje y desbloquear el resto del planificador.',
  sections: {
    build: {
      description:
        'Base del personaje, identidad y hitos principales de la construcción.',
      heading: 'Construcción',
      highlights: ['Base del personaje', 'Ruta principal', 'Marcadores iniciales'],
      label: 'Construcción',
    },
    skills: {
      description:
        'Editor por nivel para repartir rangos, revisar topes y reparar bloqueos sin salir de la hoja activa.',
      heading: 'Habilidades',
      highlights: ['Habilidades 1-16', 'Hoja de habilidades', 'Reparación preservada'],
      label: 'Habilidades',
    },
    abilities: {
      description:
        'Panel base para atributos, aumentos y prerequisitos derivados.',
      heading: 'Atributos',
      highlights: ['Valores base', 'Aumentos', 'Dependencias futuras'],
      label: 'Atributos',
    },
    stats: {
      description:
        'Vista técnica de solo lectura para seguir topes, costes y bloqueos del snapshot de habilidades.',
      heading: 'Estadísticas técnicas',
      highlights: ['Totales', 'Topes y costes', 'Penalizaciones activas'],
      label: 'Estadísticas',
    },
    summary: {
      description:
        'Espacio final para revisar la construcción completa antes de compartirla.',
      heading: 'Resumen',
      highlights: ['Vista global', 'Checklist final', 'Preparado para compartir'],
      label: 'Resumen',
    },
    utilities: {
      description:
        'Caja de utilidades futura para importación, exportación y soporte de datos.',
      heading: 'Utilidades',
      highlights: ['Importar', 'Exportar', 'Herramientas futuras'],
      label: 'Utilidades',
    },
  },
} as const;

export type PlannerSectionCopy =
  (typeof shellCopyEs.sections)[keyof typeof shellCopyEs.sections];

export type PlannerStepperCopy = typeof shellCopyEs.stepper;
