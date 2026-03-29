import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/phase-01/**/*.spec.ts'],
  },
});
