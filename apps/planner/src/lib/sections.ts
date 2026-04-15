import { shellCopyEs } from '@planner/lib/copy/es';

export type PlannerSectionId =
  | 'build'
  | 'skills'
  | 'spells'
  | 'abilities'
  | 'stats'
  | 'summary'
  | 'utilities';

export interface PlannerSectionDefinition {
  readonly description: string;
  readonly heading: string;
  readonly highlights: readonly string[];
  readonly id: PlannerSectionId;
  readonly label: string;
  readonly path: string;
}

export const plannerSections: readonly PlannerSectionDefinition[] = [
  {
    ...shellCopyEs.sections.build,
    id: 'build',
    path: '/',
  },
  {
    ...shellCopyEs.sections.skills,
    id: 'skills',
    path: '/skills',
  },
  {
    ...shellCopyEs.sections.spells,
    id: 'spells',
    path: '/spells',
  },
  {
    ...shellCopyEs.sections.abilities,
    id: 'abilities',
    path: '/abilities',
  },
  {
    ...shellCopyEs.sections.stats,
    id: 'stats',
    path: '/stats',
  },
  {
    ...shellCopyEs.sections.summary,
    id: 'summary',
    path: '/summary',
  },
  {
    ...shellCopyEs.sections.utilities,
    id: 'utilities',
    path: '/utilities',
  },
] as const;

/* ── Character Sheet Tab definitions (Plan 03) ───────────── */

export type SheetTab = 'stats' | 'skills' | 'feats' | 'spells';

export interface SheetTabDefinition {
  readonly id: SheetTab;
  readonly label: string;
}

export const sheetTabs: readonly SheetTabDefinition[] = [
  { id: 'stats', label: shellCopyEs.stepper.sheetTabs.stats },
  { id: 'skills', label: shellCopyEs.stepper.sheetTabs.skills },
  { id: 'feats', label: shellCopyEs.stepper.sheetTabs.feats },
  { id: 'spells', label: shellCopyEs.stepper.sheetTabs.spells },
] as const;

export function getSectionById(id: PlannerSectionId): PlannerSectionDefinition {
  return plannerSections.find((section) => section.id === id) ?? plannerSections[0];
}

export function getSectionByPathname(pathname: string): PlannerSectionDefinition {
  const normalizedPath =
    pathname !== '/' && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  return (
    plannerSections.find((section) => section.path === normalizedPath) ??
    plannerSections[0]
  );
}
