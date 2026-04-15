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

describe('phase 05.2 dark NWN1 theme contract', () => {
  describe('tokens.css — dark palette tokens', () => {
    it('defines the dark surface color', () => {
      expect(tokensCss).toContain('--color-surface: #0a0a0a');
    });

    it('defines the gold accent color', () => {
      expect(tokensCss).toContain('--color-gold: #c8a84e');
    });

    it('defines the light-on-dark text color', () => {
      expect(tokensCss).toContain('--color-text: #e8d5a0');
    });

    it('does NOT contain the old parchment token', () => {
      expect(tokensCss).not.toContain('--color-parchment');
    });

    it('does NOT contain the old shadow-panel token', () => {
      expect(tokensCss).not.toContain('--shadow-panel');
    });

    it('does NOT contain the old panel-glow token', () => {
      expect(tokensCss).not.toContain('--color-panel-glow');
    });

    it('defines the 2px outer frame border', () => {
      expect(tokensCss).toContain('--border-frame: 2px solid');
    });

    it('defines the 1px inner frame border', () => {
      expect(tokensCss).toContain('--border-frame-inner: 1px solid');
    });
  });

  describe('app.css — NwnFrame and NwnButton classes', () => {
    it('contains the .nwn-frame class', () => {
      expect(appCss).toContain('.nwn-frame');
    });

    it('contains the .nwn-button class', () => {
      expect(appCss).toContain('.nwn-button');
    });

    it('does NOT contain old border-radius: 22px', () => {
      expect(appCss).not.toContain('border-radius: 22px');
    });

    it('does NOT contain old border-radius: 14px', () => {
      expect(appCss).not.toContain('border-radius: 14px');
    });

    it('does NOT contain hardcoded old parchment #e3d8c1', () => {
      expect(appCss).not.toContain('#e3d8c1');
    });

    it('does NOT contain hardcoded old shadow #c8b89a', () => {
      expect(appCss).not.toContain('#c8b89a');
    });

    it('does NOT contain font-weight: 700', () => {
      expect(appCss).not.toContain('font-weight: 700');
    });

    it('contains the prefers-reduced-motion media query', () => {
      expect(appCss).toContain('prefers-reduced-motion');
    });
  });

  describe('fonts.css — weight contract', () => {
    it('does NOT import the 700 weight', () => {
      expect(fontsCss).not.toContain('700.css');
    });

    it('imports Cormorant Garamond 400 weight', () => {
      expect(fontsCss).toContain('cormorant-garamond/400.css');
    });
  });
});
