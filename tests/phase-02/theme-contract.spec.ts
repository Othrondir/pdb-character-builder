import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fontsCss = readFileSync(
  new URL('../../apps/planner/src/styles/fonts.css', import.meta.url),
  'utf8',
);
const tokensCss = readFileSync(
  new URL('../../apps/planner/src/styles/tokens.css', import.meta.url),
  'utf8',
);
const appCss = readFileSync(
  new URL('../../apps/planner/src/styles/app.css', import.meta.url),
  'utf8',
);

describe('planner theme contract', () => {
  it('defines the approved fonts and NWN1 token names', () => {
    expect(fontsCss).toContain('@fontsource/cormorant-garamond');
    expect(fontsCss).toContain('@fontsource/spectral');
    expect(tokensCss).toContain('--color-parchment: #e3d8c1');
    expect(tokensCss).toContain('--color-ink: #2f241d');
    expect(tokensCss).toContain('--color-bronze: #9f7a31');
    expect(tokensCss).toContain('--font-display: "Cormorant Garamond"');
  });

  it('applies shared shell classes for the routed planner frame', () => {
    expect(appCss).toContain('.planner-shell');
    expect(appCss).toContain('.planner-panel');
    expect(appCss).toContain('.shell-reveal');
    expect(appCss).toContain('.section-fade');
  });
});
