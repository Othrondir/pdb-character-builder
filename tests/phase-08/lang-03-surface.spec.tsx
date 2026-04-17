// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { PlannerFooter } from '@planner/components/shell/planner-footer';
import { formatDatasetLabel, RULESET_VERSION } from '@planner/data/ruleset-version';
import { shellCopyEs } from '@planner/lib/copy/es';

describe('LANG-03: footer dataset surface', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the formatted dataset label', () => {
    render(createElement(PlannerFooter));
    expect(screen.getByText(formatDatasetLabel())).toBeInTheDocument();
  });

  it('formatDatasetLabel output contains ruleset version and an ISO date', () => {
    const label = formatDatasetLabel();
    expect(label).toMatch(/Ruleset v\d+\.\d+\.\d+/);
    expect(label).toMatch(/Dataset \d{4}-\d{2}-\d{2}/);
    expect(label).toContain(RULESET_VERSION);
  });

  it('footer exposes the aria-label from shellCopyEs.footer', () => {
    render(createElement(PlannerFooter));
    const footer = screen.getByLabelText(shellCopyEs.footer.datasetAria);
    expect(footer).toBeInTheDocument();
  });
});
