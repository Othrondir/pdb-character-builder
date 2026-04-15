import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';

import { assembleClassCatalog } from '@data-extractor/assemblers/class-assembler';
import { assembleRaceCatalog } from '@data-extractor/assemblers/race-assembler';
import { assembleSkillCatalog } from '@data-extractor/assemblers/skill-assembler';
import { assembleDeityData } from '@data-extractor/assemblers/deity-assembler';
import { TlkResolver } from '@data-extractor/readers/tlk-resolver';
import { NwsyncReader } from '@data-extractor/readers/nwsync-reader';
import { parseTwoDa } from '@data-extractor/parsers/two-da-parser';
import type { TlkTable } from '@data-extractor/parsers/tlk-parser';
import type { BaseGameReader } from '@data-extractor/readers/base-game-reader';
import {
  NWSYNC_META_DB,
  NWSYNC_DATA_DB,
  PUERTA_MANIFEST_SHA1,
  BASE_GAME_KEY,
  BASE_GAME_DIR,
  BASE_GAME_TLK,
  RESTYPE_2DA,
} from '@data-extractor/config';
import { classCatalogSchema } from '@data-extractor/contracts/class-catalog';
import { raceCatalogSchema } from '@data-extractor/contracts/race-catalog';
import { skillCatalogSchema } from '@data-extractor/contracts/skill-catalog';

// ---------------------------------------------------------------------------
// Test dataset ID for all assembler tests
// ---------------------------------------------------------------------------
const TEST_DATASET_ID = 'puerta-ee-2026-04-15+test123';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockTlkTable(entries: Record<number, string>): TlkTable {
  const maxIndex = Math.max(...Object.keys(entries).map(Number), -1);
  return {
    stringCount: maxIndex + 1,
    getString(index: number): string {
      return entries[index] ?? '';
    },
  };
}

/**
 * Create a mock NwsyncReader that returns controlled 2DA content.
 */
function mockNwsyncReader(
  resources: Record<string, string>,
  resrefList?: string[],
): NwsyncReader {
  return {
    getResource(resref: string, _restype: number): Buffer | null {
      const content = resources[resref];
      return content ? Buffer.from(content, 'utf-8') : null;
    },
    listResources(_restype: number): string[] {
      return resrefList ?? Object.keys(resources);
    },
    close(): void { /* no-op */ },
  } as unknown as NwsyncReader;
}

/**
 * Create a mock BaseGameReader that returns null for everything.
 */
function mockBaseGameReader(
  resources?: Record<string, string>,
): BaseGameReader {
  return {
    getResource(resref: string, _restype: number): Buffer | null {
      const content = resources?.[resref];
      return content ? Buffer.from(content, 'utf-8') : null;
    },
    getTlk(_path: string): Buffer {
      return Buffer.alloc(0);
    },
  } as unknown as BaseGameReader;
}

// ---------------------------------------------------------------------------
// Synthetic 2DA content strings for unit tests
// ---------------------------------------------------------------------------

const MINIMAL_CLASSES_2DA = `2DA V2.0

Label	Name	Plural	Lower	Description	Icon	HitDie	AttackBonusTable	FeatsTable	SavingThrowTable	SkillsTable	BonusFeatsTable	SkillPointBase	SpellGainTable	SpellKnownTable	PlayerClass	SpellCaster	Str	Dex	Con	Wis	Int	Cha	PrimaryAbil	AlignRestrict	AlignRstrctType	InvertRestrict	PreReqTable	MaxLevel
0	Fighter	100	101	102	200	****	10	CLS_ATK_1	CLS_FEAT_FIGHT	CLS_SAVTHR_FIGHT	CLS_SKILL_FIGHT	CLS_BFEAT_FIGHT	2	****	****	1	0	16	14	14	10	10	10	STR	0x00	0x00	0	****	0
1	Wizard	110	111	112	210	****	4	CLS_ATK_3	CLS_FEAT_WIZ	CLS_SAVTHR_WIZ	CLS_SKILL_WIZ	CLS_BFEAT_WIZ	2	CLS_SPGN_WIZ	CLS_SPKN_WIZ	1	1	10	10	10	10	16	10	INT	0x00	0x00	0	****	0
2	Dragon	120	121	122	220	****	12	CLS_ATK_1	CLS_FEAT_DRAG	CLS_SAVTHR_DRAG	CLS_SKILL_DRAG	CLS_BFEAT_DRAG	2	****	****	0	0	18	10	18	10	10	10	STR	0x00	0x00	0	****	0
3	Shadowdancer	130	131	132	230	****	8	CLS_ATK_2	CLS_FEAT_SHADOW	CLS_SAVTHR_ROG	CLS_SKILL_SHADOW	CLS_BFEAT_SHADOW	6	****	****	1	0	12	16	14	8	14	12	DEX	0x00	0x00	0	CLS_PRES_SHADOW	40
`;

const MINIMAL_SKILLS_2DA = `2DA V2.0

Label	Name	Description	Icon	Untrained	KeyAbility	ArmorCheckPenalty	AllClassesCanUse	Category	MaxCR	Constant	HostileSkill
0	Concentration	270	345	****	1	CON	0	1	****	****	SKILL_CONCENTRATION	0
1	DisableTrap	272	346	****	0	INT	0	0	****	****	SKILL_DISABLE_TRAP	0
2	Lore	274	347	****	1	INT	0	1	****	****	SKILL_LORE	0
`;

const MINIMAL_CLS_SKILL_FIGHT = `2DA V2.0

SkillLabel	SkillIndex	ClassSkill
0	Concentration	0	0
1	DisableTrap	1	0
2	Lore	2	1
`;

const MINIMAL_CLS_SKILL_WIZ = `2DA V2.0

SkillLabel	SkillIndex	ClassSkill
0	Concentration	0	1
1	DisableTrap	1	0
2	Lore	2	1
`;

const MINIMAL_RACIALTYPES_2DA = `2DA V2.0

Label	Abrev	Name	ConverName	ConverNameLower	NamePlural	Description	Icon	Appearance	StrAdjust	DexAdjust	IntAdjust	ChaAdjust	WisAdjust	ConAdjust	Endurance	Favored	FeatsTable	Biography	PlayerRace	Constant
0	Dwarf	Dw	50	51	52	53	251	****	0	0	0	0	-2	0	2	20	4	RACE_FEAT_DWARF	8157	1	RACIAL_TYPE_DWARF
1	Elf	El	60	61	62	63	252	****	1	0	2	0	0	0	-2	30	0	RACE_FEAT_ELF	8158	1	RACIAL_TYPE_ELF
2	Dragon	Dr	70	71	72	73	253	****	10	4	0	0	0	0	4	50	****	****	****	0	RACIAL_TYPE_DRAGON
`;

const MINIMAL_APPEARANCE_2DA = `2DA V2.0

LABEL	STRING_REF	SIZECATEGORY
0	Dwarf	1000	3
1	Elf	1001	3
10	BigCreature	1010	4
`;

// ---------------------------------------------------------------------------
// Unit tests with synthetic 2DA content
// ---------------------------------------------------------------------------

describe('assembleClassCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    100: 'Guerrero',
    101: 'Guerreros',
    102: 'guerrero',
    110: 'Mago',
    111: 'Magos',
    112: 'mago',
    130: 'Danzarin de las Sombras',
    131: 'Danzarines',
    132: 'danzarin',
    200: 'Descripcion Guerrero',
    210: 'Descripcion Mago',
    230: 'Descripcion Danzarin',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  it('filters to PlayerClass=1 and generates canonical IDs', () => {
    const reader = mockNwsyncReader({ classes: MINIMAL_CLASSES_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleClassCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    // Should have 3 player classes (Fighter, Wizard, Shadowdancer) but NOT Dragon (PlayerClass=0)
    expect(result.catalog.classes).toHaveLength(3);

    const ids = result.catalog.classes.map((c) => c.id);
    expect(ids).toContain('class:fighter');
    expect(ids).toContain('class:wizard');
    expect(ids).toContain('class:shadowdancer');
    expect(ids).not.toContain('class:dragon');
  });

  it('resolves TLK names to Spanish text', () => {
    const reader = mockNwsyncReader({ classes: MINIMAL_CLASSES_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleClassCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    const fighter = result.catalog.classes.find((c) => c.id === 'class:fighter')!;
    expect(fighter.label).toBe('Guerrero');
    expect(fighter.description).toBe('Descripcion Guerrero');

    const wizard = result.catalog.classes.find((c) => c.id === 'class:wizard')!;
    expect(wizard.label).toBe('Mago');
    expect(wizard.description).toBe('Descripcion Mago');
  });

  it('classifies base vs prestige classes correctly', () => {
    const reader = mockNwsyncReader({ classes: MINIMAL_CLASSES_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleClassCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    const fighter = result.catalog.classes.find((c) => c.id === 'class:fighter')!;
    expect(fighter.isBase).toBe(true);

    const shadow = result.catalog.classes.find((c) => c.id === 'class:shadowdancer')!;
    expect(shadow.isBase).toBe(false);
    expect(shadow.prerequisiteColumns).toHaveProperty('PreReqTable', 'CLS_PRES_SHADOW');
  });

  it('extracts hitDie, skillPoints, BAB, spellcaster correctly', () => {
    const reader = mockNwsyncReader({ classes: MINIMAL_CLASSES_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleClassCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    const fighter = result.catalog.classes.find((c) => c.id === 'class:fighter')!;
    expect(fighter.hitDie).toBe(10);
    expect(fighter.skillPointsPerLevel).toBe(2);
    expect(fighter.attackBonusProgression).toBe('high');
    expect(fighter.spellCaster).toBe(false);
    expect(fighter.primaryAbility).toBe('str');

    const wizard = result.catalog.classes.find((c) => c.id === 'class:wizard')!;
    expect(wizard.hitDie).toBe(4);
    expect(wizard.attackBonusProgression).toBe('low');
    expect(wizard.spellCaster).toBe(true);
    expect(wizard.spellGainTableRef).toBe('CLS_SPGN_WIZ');
  });

  it('passes Zod schema validation', () => {
    const reader = mockNwsyncReader({ classes: MINIMAL_CLASSES_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleClassCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    // Should not throw -- already validated internally
    expect(() => classCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});

describe('assembleSkillCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    270: 'Concentracion',
    272: 'Inutilizar Trampas',
    274: 'Conocimiento',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  it('builds correct class-skill mappings from cls_skill tables', () => {
    const resources: Record<string, string> = {
      classes: MINIMAL_CLASSES_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_skill_fight: MINIMAL_CLS_SKILL_FIGHT,
      cls_skill_wiz: MINIMAL_CLS_SKILL_WIZ,
    };
    const resrefList = ['classes', 'skills', 'cls_skill_fight', 'cls_skill_wiz'];
    const reader = mockNwsyncReader(resources, resrefList);
    const baseReader = mockBaseGameReader();

    const result = assembleSkillCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    expect(result.catalog.skills).toHaveLength(3);

    // Lore (index 2) is class skill for both Fighter and Wizard
    const lore = result.catalog.skills.find((s) => s.id === 'skill:lore')!;
    expect(lore.defaultClassIds).toContain('class:fighter');
    expect(lore.defaultClassIds).toContain('class:wizard');

    // Concentration (index 0) is class skill for Wizard only
    const conc = result.catalog.skills.find((s) => s.id === 'skill:concentration')!;
    expect(conc.defaultClassIds).toContain('class:wizard');
    expect(conc.defaultClassIds).not.toContain('class:fighter');

    // DisableTrap (index 1) is not a class skill for either
    // But AllClassesCanUse=0 so it should get a fallback
    const trap = result.catalog.skills.find((s) => s.id === 'skill:disabletrap')!;
    expect(trap.trainedOnly).toBe(true); // Untrained=0
  });

  it('resolves TLK labels and maps abilities correctly', () => {
    const resources: Record<string, string> = {
      classes: MINIMAL_CLASSES_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_skill_fight: MINIMAL_CLS_SKILL_FIGHT,
      cls_skill_wiz: MINIMAL_CLS_SKILL_WIZ,
    };
    const reader = mockNwsyncReader(resources, Object.keys(resources));
    const baseReader = mockBaseGameReader();

    const result = assembleSkillCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    const conc = result.catalog.skills.find((s) => s.id === 'skill:concentration')!;
    expect(conc.label).toBe('Concentracion');
    expect(conc.abilityKey).toBe('con');
    expect(conc.trainedOnly).toBe(false); // Untrained=1

    const lore = result.catalog.skills.find((s) => s.id === 'skill:lore')!;
    expect(lore.label).toBe('Conocimiento');
    expect(lore.abilityKey).toBe('int');
  });

  it('passes Zod schema validation', () => {
    const resources: Record<string, string> = {
      classes: MINIMAL_CLASSES_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_skill_fight: MINIMAL_CLS_SKILL_FIGHT,
      cls_skill_wiz: MINIMAL_CLS_SKILL_WIZ,
    };
    const reader = mockNwsyncReader(resources, Object.keys(resources));
    const baseReader = mockBaseGameReader();

    const result = assembleSkillCatalog(reader, baseReader, resolver, TEST_DATASET_ID);
    expect(() => skillCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});

describe('assembleRaceCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    50: 'Enano',
    53: 'Enanos',
    60: 'Elfo',
    63: 'Elfos',
    251: 'Descripcion Enano',
    252: 'Descripcion Elfo',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  it('filters to PlayerRace=1 and looks up size from appearance.2da', () => {
    const resources: Record<string, string> = {
      racialtypes: MINIMAL_RACIALTYPES_2DA,
      appearance: MINIMAL_APPEARANCE_2DA,
      classes: MINIMAL_CLASSES_2DA,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleRaceCatalog(reader, baseReader, resolver, TEST_DATASET_ID);

    // Should have 2 player races (Dwarf, Elf) but NOT Dragon (PlayerRace=0)
    expect(result.catalog.races).toHaveLength(2);

    const dwarf = result.catalog.races.find((r) => r.id === 'race:dwarf')!;
    expect(dwarf.label).toBe('Enano');
    expect(dwarf.size).toBe('medium'); // Appearance=0, SIZECATEGORY=3 -> medium
    expect(dwarf.abilityAdjustments.cha).toBe(-2);
    expect(dwarf.abilityAdjustments.con).toBe(2);

    const elf = result.catalog.races.find((r) => r.id === 'race:elf')!;
    expect(elf.label).toBe('Elfo');
    expect(elf.size).toBe('medium'); // Appearance=1, SIZECATEGORY=3 -> medium
    expect(elf.abilityAdjustments.dex).toBe(2);
    expect(elf.abilityAdjustments.con).toBe(-2);
  });

  it('passes Zod schema validation', () => {
    const resources: Record<string, string> = {
      racialtypes: MINIMAL_RACIALTYPES_2DA,
      appearance: MINIMAL_APPEARANCE_2DA,
      classes: MINIMAL_CLASSES_2DA,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleRaceCatalog(reader, baseReader, resolver, TEST_DATASET_ID);
    expect(() => raceCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});

describe('assembleDeityData (unit)', () => {
  it('returns null catalog with gap documentation when no deity 2DA exists', () => {
    const reader = mockNwsyncReader({});
    const baseReader = mockBaseGameReader();
    const resolver = new TlkResolver(mockTlkTable({}), mockTlkTable({}));

    const result = assembleDeityData(reader, baseReader, resolver);

    expect(result.catalog).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('No deity 2DA found');
    expect(result.warnings[0]).toContain('manual overrides');
  });
});

// ---------------------------------------------------------------------------
// Integration tests - only run when nwsync + base game exist locally
// ---------------------------------------------------------------------------

const hasNwsync = existsSync(NWSYNC_META_DB) && existsSync(NWSYNC_DATA_DB);
const hasBaseGame = existsSync(BASE_GAME_KEY);
const hasIntegrationDeps = hasNwsync && hasBaseGame;

describe.skipIf(!hasIntegrationDeps)('Assemblers (integration)', () => {
  let nwsyncReader: NwsyncReader;
  let baseGameReader: BaseGameReader;
  let tlkResolver: TlkResolver;

  beforeAll(async () => {
    // Dynamic import to avoid loading better-sqlite3 when skipped
    const { BaseGameReader: BGReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    nwsyncReader = new NwsyncReader(
      NWSYNC_META_DB,
      NWSYNC_DATA_DB,
      PUERTA_MANIFEST_SHA1,
    );

    baseGameReader = new BGReader(BASE_GAME_KEY, BASE_GAME_DIR);
    tlkResolver = TlkResolver.fromPaths(BASE_GAME_TLK, nwsyncReader);
  });

  afterAll(() => {
    nwsyncReader?.close();
  });

  it('assembles class catalog with expected player class count', () => {
    const result = assembleClassCatalog(
      nwsyncReader,
      baseGameReader,
      tlkResolver,
      TEST_DATASET_ID,
    );

    // Per inspection: 41 player classes in Puerta nwsync
    expect(result.catalog.classes.length).toBeGreaterThanOrEqual(35);
    expect(result.catalog.classes.length).toBeLessThanOrEqual(55);

    // Spot-check known classes
    const fighter = result.catalog.classes.find((c) => c.id === 'class:barbarian');
    expect(fighter).toBeDefined();
    expect(fighter!.label.length).toBeGreaterThan(0);
    expect(fighter!.hitDie).toBe(12);

    // Validate full catalog schema
    expect(() => classCatalogSchema.parse(result.catalog)).not.toThrow();
  });

  it('assembles race catalog with player races', () => {
    const result = assembleRaceCatalog(
      nwsyncReader,
      baseGameReader,
      tlkResolver,
      TEST_DATASET_ID,
    );

    // Per inspection: 46 player races in Puerta
    expect(result.catalog.races.length).toBeGreaterThanOrEqual(7);

    // Spot-check known races
    const dwarf = result.catalog.races.find((r) => r.id === 'race:dwarf');
    expect(dwarf).toBeDefined();
    expect(dwarf!.label.length).toBeGreaterThan(0);

    // Validate full catalog schema
    expect(() => raceCatalogSchema.parse(result.catalog)).not.toThrow();
  });

  it('assembles skill catalog with 39 skills', () => {
    const result = assembleSkillCatalog(
      nwsyncReader,
      baseGameReader,
      tlkResolver,
      TEST_DATASET_ID,
    );

    // Per inspection: exactly 39 skills
    expect(result.catalog.skills).toHaveLength(39);

    // Spot-check known skills
    const conc = result.catalog.skills.find((s) => s.id === 'skill:concentracion');
    expect(conc).toBeDefined();
    expect(conc!.abilityKey).toBe('con');

    // Validate full catalog schema
    expect(() => skillCatalogSchema.parse(result.catalog)).not.toThrow();
  });

  it('deity assembler documents the gap', () => {
    const result = assembleDeityData(nwsyncReader, baseGameReader, tlkResolver);
    expect(result.catalog).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
