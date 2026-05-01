# Quick Task 260501-lj3: Subir aumento de caracteristica

Date: 2026-05-01
Status: complete
Code commit: workspace

## Result

The level-up ability increase block now renders near the top of the expanded
level editor, immediately after the level heading and before the class picker.

This keeps the first free assignment visible before the class-related block,
without changing progression legality, stored values, or ability totals.

## Verification

- `corepack pnpm exec vitest run tests/phase-12.6/level-progression-scan.spec.tsx --reporter=dot`
- `corepack pnpm run typecheck`
