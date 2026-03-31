export const shellCopyEs = {
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
      'Selecciona raza, subraza, alineamiento y deidad en Construcción para desbloquear Atributos.',
    lockedAbilitiesHeading: 'El origen del personaje sigue incompleto',
    noDeity: 'Sin deidad',
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
      deityLocked: 'La deidad se activa después del alineamiento.',
      subraceLocked: 'La subraza se activa después de elegir la raza.',
    },
    steps: {
      alignment: 'Alineamiento',
      deity: 'Deidad',
      race: 'Raza',
      subrace: 'Subraza',
    },
  },
  progression: {
    abilityHeading: 'Aumento de característica',
    abilityHelper:
      'Este nivel concede un aumento de característica que se reflejará en Atributos.',
    classSectionHeading: 'Clase del nivel',
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
    railHeading: 'Progresión 1-16',
    repairCallout:
      'Este nivel se conserva, pero depende de corregir decisiones anteriores.',
    requirementsHeading: 'Requisitos de entrada',
    statuses: {
      blocked: 'Bloqueada',
      illegal: 'Inválida',
      legal: 'Legal',
      pending: 'Pendiente',
    },
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
    trainedOnlyLabel: 'Solo entrenada',
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
        'Vista preparada para el reparto de habilidades por nivel y sus límites.',
      heading: 'Habilidades',
      highlights: ['Rangos por nivel', 'Límites de clase', 'Sincronía futura'],
      label: 'Habilidades',
    },
    spells: {
      description:
        'Marco inicial para conjuros, dominios y decisiones mágicas posteriores.',
      heading: 'Conjuros',
      highlights: ['Selección mágica', 'Dominios', 'Reservado para fase posterior'],
      label: 'Conjuros',
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
        'Resumen técnico preparado para estadísticas derivadas y estado general.',
      heading: 'Estadísticas',
      highlights: ['Resumen técnico', 'Estado derivado', 'Preparado para cálculos'],
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
