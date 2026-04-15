import { describe, it, expect } from 'vitest';
import { parseTwoDa } from '@data-extractor/parsers/two-da-parser';
import type { TwoDaTable } from '@data-extractor/parsers/two-da-parser';

/** Minimal valid 2DA content with basic data. */
const BASIC_2DA = `2DA V2.0

      Name         Label        Cost
0     Fighter      FIGHTER      1
1     Wizard       WIZARD       2
2     Rogue        ROGUE        3
`;

/** 2DA with **** null values. */
const NULL_VALUES_2DA = `2DA V2.0

      Name         Label        Desc
0     Fighter      FIGHTER      ****
1     ****         WIZARD       Some
2     Rogue        ****         ****
`;

/** 2DA with quoted values containing spaces. */
const QUOTED_2DA = `2DA V2.0

      Name                Label
0     "War Wizard"        WAR_WIZ
1     "Red Dragon"        RED_DRAG
2     Simple              SIMPLE
`;

/** 2DA with non-contiguous row indices (gaps). */
const GAPPED_2DA = `2DA V2.0

      Name         Label
0     Fighter      FIGHTER
2     Wizard       WIZARD
5     Rogue        ROGUE
`;

/** 2DA with rows that have fewer values than columns (trailing omitted). */
const SHORT_ROWS_2DA = `2DA V2.0

      Name         Label        Desc         Extra
0     Fighter      FIGHTER      Good
1     Wizard       WIZARD
2     Rogue        ROGUE        Sneaky       Fast
`;

describe('parseTwoDa', () => {
  describe('basic parsing', () => {
    let table: TwoDaTable;

    it('parses column headers', () => {
      table = parseTwoDa(BASIC_2DA);
      expect(table.columns).toEqual(['Name', 'Label', 'Cost']);
    });

    it('returns correct rowCount', () => {
      table = parseTwoDa(BASIC_2DA);
      expect(table.rowCount).toBe(3);
    });

    it('retrieves cell value by row and column name', () => {
      table = parseTwoDa(BASIC_2DA);
      expect(table.getCell(0, 'Name')).toBe('Fighter');
      expect(table.getCell(1, 'Label')).toBe('WIZARD');
      expect(table.getCell(2, 'Cost')).toBe('3');
    });
  });

  describe('null handling (****)', () => {
    it('converts **** to null', () => {
      const table = parseTwoDa(NULL_VALUES_2DA);
      expect(table.getCell(0, 'Desc')).toBeNull();
      expect(table.getCell(1, 'Name')).toBeNull();
      expect(table.getCell(2, 'Label')).toBeNull();
      expect(table.getCell(2, 'Desc')).toBeNull();
    });

    it('keeps non-**** values intact next to nulls', () => {
      const table = parseTwoDa(NULL_VALUES_2DA);
      expect(table.getCell(0, 'Name')).toBe('Fighter');
      expect(table.getCell(1, 'Label')).toBe('WIZARD');
      expect(table.getCell(1, 'Desc')).toBe('Some');
    });
  });

  describe('quoted values', () => {
    it('handles quoted strings containing spaces', () => {
      const table = parseTwoDa(QUOTED_2DA);
      expect(table.getCell(0, 'Name')).toBe('War Wizard');
      expect(table.getCell(1, 'Name')).toBe('Red Dragon');
    });

    it('handles non-quoted values alongside quoted ones', () => {
      const table = parseTwoDa(QUOTED_2DA);
      expect(table.getCell(0, 'Label')).toBe('WAR_WIZ');
      expect(table.getCell(2, 'Name')).toBe('Simple');
    });
  });

  describe('non-contiguous row indices', () => {
    it('returns null for missing row indices (gaps)', () => {
      const table = parseTwoDa(GAPPED_2DA);
      expect(table.getCell(1, 'Name')).toBeNull();
      expect(table.getCell(3, 'Name')).toBeNull();
      expect(table.getCell(4, 'Name')).toBeNull();
    });

    it('returns correct values for present row indices', () => {
      const table = parseTwoDa(GAPPED_2DA);
      expect(table.getCell(0, 'Name')).toBe('Fighter');
      expect(table.getCell(2, 'Name')).toBe('Wizard');
      expect(table.getCell(5, 'Name')).toBe('Rogue');
    });

    it('reports correct rowCount for gapped rows', () => {
      const table = parseTwoDa(GAPPED_2DA);
      expect(table.rowCount).toBe(3);
    });
  });

  describe('short rows (fewer values than columns)', () => {
    it('defaults trailing omitted columns to null', () => {
      const table = parseTwoDa(SHORT_ROWS_2DA);
      // Row 0 has 3 values for 4 columns -> Extra is null
      expect(table.getCell(0, 'Extra')).toBeNull();
      // Row 1 has 2 values for 4 columns -> Desc and Extra are null
      expect(table.getCell(1, 'Desc')).toBeNull();
      expect(table.getCell(1, 'Extra')).toBeNull();
    });

    it('parses complete rows correctly', () => {
      const table = parseTwoDa(SHORT_ROWS_2DA);
      expect(table.getCell(2, 'Name')).toBe('Rogue');
      expect(table.getCell(2, 'Desc')).toBe('Sneaky');
      expect(table.getCell(2, 'Extra')).toBe('Fast');
    });
  });

  describe('edge cases', () => {
    it('returns null for unknown column name', () => {
      const table = parseTwoDa(BASIC_2DA);
      expect(table.getCell(0, 'NonExistent')).toBeNull();
    });

    it('returns null for out-of-range row index', () => {
      const table = parseTwoDa(BASIC_2DA);
      expect(table.getCell(999, 'Name')).toBeNull();
    });

    it('exposes rows map for iteration', () => {
      const table = parseTwoDa(BASIC_2DA);
      const rowKeys = [...table.rows.keys()];
      expect(rowKeys).toEqual([0, 1, 2]);
    });
  });
});
