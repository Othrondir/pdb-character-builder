import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@data-extractor': path.resolve(__dirname, 'packages/data-extractor/src'),
      '@planner': path.resolve(__dirname, 'apps/planner/src'),
      '@rules-engine': path.resolve(__dirname, 'packages/rules-engine/src'),
    },
  },
  test: {
    environmentMatchGlobs: [
      ['tests/phase-02/**/*.spec.{ts,tsx}', 'jsdom'],
      ['tests/phase-08/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.4/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.6/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.7/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.8/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-12.9/**/*.spec.tsx', 'jsdom'],
      ['tests/phase-14/**/*.spec.tsx', 'jsdom'],
    ],
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    // Phase 12.8-01 (revision BLOCKER 1) — Vitest default excludes cover
    // dependency trees + build output + VCS metadata. Raw `exclude: [...]`
    // would override rather than append; spreading the defaults preserves
    // them while adding the Playwright-only glob.
    exclude: [...configDefaults.exclude, 'tests/**/*.e2e.spec.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
