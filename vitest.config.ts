import path from 'node:path';
import { defineConfig } from 'vitest/config';

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
    ],
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
});
