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
  it('defines the NWN1 dark palette and font tokens', () => {
    expect(fontsCss).toContain('@fontsource/cormorant-garamond');
    expect(fontsCss).toContain('@fontsource/spectral');
    expect(tokensCss).toContain('--color-surface: #0a0a0a');
    expect(tokensCss).toContain('--color-gold: #c8a84e');
    expect(tokensCss).toContain('--color-text: #e8d5a0');
    expect(tokensCss).toContain('--font-display: "Cormorant Garamond"');
  });

  it('applies NWN1 frame and button classes', () => {
    expect(appCss).toContain('.planner-shell');
    expect(appCss).toContain('.nwn-frame');
    expect(appCss).toContain('.nwn-button');
    expect(appCss).toContain('.planner-layout');
  });
});
