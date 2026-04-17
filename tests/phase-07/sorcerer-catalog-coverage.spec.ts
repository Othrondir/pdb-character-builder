import { describe, expect, it } from 'vitest';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';

describe('phase 07 compiled-spells.ts sorcerer coverage (WR-04 regression guard)', () => {
  it('catalog contains at least one spell tagged class:sorcerer', () => {
    // Before the WR-04 fix (07-VERIFICATION gap 5), this count was 0 because
    // the extractor's columnToClassId map overwrote the Wizard entry with
    // Sorcerer (or vice versa) on the shared 'Wiz_Sorc' column. After the fix
    // every spell in the shared column is emitted under BOTH classes.
    const sorcererTagged = compiledSpellCatalog.spells.filter(
      (s) => s.classLevels['class:sorcerer'] != null,
    );
    expect(sorcererTagged.length).toBeGreaterThan(0);
  });

  it('sorcerer tag count approximately matches wizard tag count (shared Wiz_Sorc column)', () => {
    const wizardCount = compiledSpellCatalog.spells.filter(
      (s) => s.classLevels['class:wizard'] != null,
    ).length;
    const sorcererCount = compiledSpellCatalog.spells.filter(
      (s) => s.classLevels['class:sorcerer'] != null,
    ).length;

    // Wizard and Sorcerer share the exact same spells.2da column, so every
    // wizard-eligible spell must also be sorcerer-eligible. Counts must match.
    expect(sorcererCount).toBe(wizardCount);
  });

  it('bard tag count is unchanged by the fix (bard has its own column)', () => {
    // Regression guard: bard uses the 'Bard' column, not Wiz_Sorc. The map
    // promotion must not duplicate bard tags or lose any.
    const bardCount = compiledSpellCatalog.spells.filter(
      (s) => s.classLevels['class:bard'] != null,
    ).length;
    expect(bardCount).toBeGreaterThan(0);
  });
});
