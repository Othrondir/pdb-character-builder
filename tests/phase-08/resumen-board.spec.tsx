// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { ResumenViewModel } from '@planner/features/summary/resumen-selectors';

// We mock useResumenViewModel so we can drive deterministic view-model snapshots.
vi.mock('@planner/features/summary/resumen-selectors', () => {
  return {
    useResumenViewModel: () => currentModel,
  };
});

// Mock persistence to avoid actual IndexedDB calls in the shallow render tests.
vi.mock('@planner/features/persistence', () => ({
  downloadBuildAsJson: vi.fn(),
  importBuildFromFile: vi.fn(),
  projectBuildDocument: vi.fn(() => ({})),
  hydrateBuildDocument: vi.fn(),
  JsonImportError: class extends Error {},
  listSlots: vi.fn(async () => []),
  saveSlot: vi.fn(async () => undefined),
  loadSlot: vi.fn(async () => null),
  slotExists: vi.fn(async () => false),
  // 08-02 share surface
  encodeSharePayload: vi.fn(() => ''),
  exceedsBudget: vi.fn(() => false),
  buildShareUrl: vi.fn(() => ''),
  diffRuleset: vi.fn(() => null),
}));

import { ResumenBoard } from '@planner/features/summary/resumen-board';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

let currentModel: ResumenViewModel;

const DEFAULT_MODEL: ResumenViewModel = {
  identity: {
    name: shellCopyEs.resumen.emptyNamePlaceholder,
    raceLabel: 'Humano',
    subraceLabel: null,
    alignmentLabel: 'Legal bueno',
    datasetLabel: 'Ruleset v1.0.0 · Dataset 2026-04-17 (cf6e8aad)',
  },
  attributes: [
    { key: 'str', label: 'Fuerza', total: 14, modifier: 2 },
    { key: 'dex', label: 'Destreza', total: 12, modifier: 1 },
    { key: 'con', label: 'Constitución', total: 14, modifier: 2 },
    { key: 'int', label: 'Inteligencia', total: 10, modifier: 0 },
    { key: 'wis', label: 'Sabiduría', total: 10, modifier: 0 },
    { key: 'cha', label: 'Carisma', total: 10, modifier: 0 },
  ],
  progression: Array.from({ length: 16 }, (_, i) => ({
    level: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16,
    classLabel: null,
    cumulativeBab: null,
    cumulativeFort: null,
    cumulativeRef: null,
    cumulativeWill: null,
    generalFeatLabel: null,
    classFeatLabel: null,
  })),
  skills: [],
};

describe('ResumenBoard', () => {
  beforeEach(() => {
    currentModel = structuredClone(DEFAULT_MODEL);
    // Seed foundation store with a projectable (race + alignment) state so the
    // incomplete-build guard keeps the action-bar buttons enabled. Individual
    // tests that want to verify the disabled-state variant reset explicitly.
    const foundation = useCharacterFoundationStore.getState();
    foundation.resetFoundation();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useCharacterFoundationStore.getState().resetFoundation();
  });

  it('renders 3 blocks labelled via aria-labelledby', () => {
    render(createElement(ResumenBoard));
    // Heading IDs must be unique enough to be found.
    expect(
      document.querySelector('[aria-labelledby="resumen-identity-heading"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[aria-labelledby="resumen-progression-heading"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[aria-labelledby="resumen-skills-heading"]'),
    ).toBeInTheDocument();
  });

  it('renders the 5 action buttons (Compartir enabled after 08-02 Task 3)', () => {
    render(createElement(ResumenBoard));
    const copy = shellCopyEs.resumen.actions;
    expect(screen.getByRole('button', { name: copy.save })).toBeEnabled();
    expect(screen.getByRole('button', { name: copy.load })).toBeEnabled();
    expect(screen.getByRole('button', { name: copy.export })).toBeEnabled();
    // Two buttons match the importar name (the button and the hidden file input's aria-label).
    const importerButtons = screen.getAllByRole('button', { name: copy.import });
    expect(importerButtons.length).toBeGreaterThanOrEqual(1);
    // Compartir is live in Plan 08-02 Task 3 — encodes + copies / falls back to JSON.
    const share = screen.getByRole('button', { name: copy.share });
    expect(share).toBeEnabled();
  });

  it('disables Guardar/Exportar/Compartir when the build is not projectable (Phase 08 Task 4 UAT regression)', () => {
    // Remove the projectable seed from beforeEach — simulates the UAT flow of
    // opening Resumen before picking a race or alignment. The raw ZodError the
    // old code threw from projectBuildDocument must NEVER reach the user; we
    // guard at the UI layer by disabling the action buttons.
    useCharacterFoundationStore.getState().resetFoundation();
    render(createElement(ResumenBoard));
    const copy = shellCopyEs.resumen.actions;
    expect(screen.getByRole('button', { name: copy.save })).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.export })).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.share })).toBeDisabled();
    // Cargar/Importar stay enabled — they HYDRATE stores, so build-incompleteness
    // is precisely the state they exist to recover from.
    expect(screen.getByRole('button', { name: copy.load })).toBeEnabled();
  });

  it('renders em-dash (NOT "0") for every derived-stat cell when helpers are missing', () => {
    render(createElement(ResumenBoard));

    const progressionSection = document.querySelector(
      '[aria-labelledby="resumen-progression-heading"]',
    ) as HTMLElement;
    expect(progressionSection).toBeInTheDocument();

    // Walk every progression row's derived-stat cells (columns BAB/Fort/Ref/Will).
    // With all four helpers null the table MUST render em-dash, not '0'.
    const rows = within(progressionSection).getAllByRole('row');
    // First row is the header; real rows follow.
    const dataRows = rows.slice(1);
    expect(dataRows).toHaveLength(16);

    // For each row the 4 derived cells must be em-dash, NEVER '0'.
    const dashCells = within(progressionSection).getAllByText('—');
    // 4 derived-stat columns × 16 rows = 64 cells, plus classLabel + generalFeat + classFeat
    // = 3 more per row = 48 more cells. Total 112. We only assert >= 64 to be safe.
    expect(dashCells.length).toBeGreaterThanOrEqual(64);

    // Critical SHAR-01 guarantee: NO cell in the progression block renders '0' when
    // all derived helpers are missing.
    const zeroCells = within(progressionSection).queryAllByText('0');
    expect(zeroCells).toHaveLength(0);
  });

  it('renders a real number when cumulativeBab is populated', () => {
    currentModel.progression[3] = {
      ...currentModel.progression[3],
      cumulativeBab: 4,
      cumulativeFort: 1,
      cumulativeRef: 4,
      cumulativeWill: 1,
    };
    render(createElement(ResumenBoard));

    const progressionSection = document.querySelector(
      '[aria-labelledby="resumen-progression-heading"]',
    ) as HTMLElement;

    // At level 4 row, the BAB cell should render '4' not '—'.
    const fourCells = within(progressionSection).getAllByText('4');
    // At least one `4` cell exists for BAB (could also appear in cumulativeRef).
    expect(fourCells.length).toBeGreaterThanOrEqual(1);
  });
});
