import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';

import { assembleFeatCatalog, buildFeatIdsByRow, type ClassRowInfo } from '@data-extractor/assemblers/feat-assembler';
import { TlkResolver } from '@data-extractor/readers/tlk-resolver';
import { NwsyncReader } from '@data-extractor/readers/nwsync-reader';
import type { TlkTable } from '@data-extractor/parsers/tlk-parser';
import type { BaseGameReader } from '@data-extractor/readers/base-game-reader';
import {
  NWSYNC_META_DB,
  NWSYNC_DATA_DB,
  PUERTA_MANIFEST_SHA1,
  BASE_GAME_KEY,
  BASE_GAME_DIR,
  BASE_GAME_TLK,
} from '@data-extractor/config';
import { featCatalogSchema } from '@data-extractor/contracts/feat-catalog';

// ---------------------------------------------------------------------------
// Test dataset ID
// ---------------------------------------------------------------------------
const TEST_DATASET_ID = 'puerta-ee-2026-04-15+test123';

// ---------------------------------------------------------------------------
// Mock helpers (same pattern as assemblers-core.spec.ts)
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
// Synthetic 2DA content for unit tests
// ---------------------------------------------------------------------------

const MINIMAL_FEAT_2DA = `2DA V2.0

LABEL	Name	Description	Icon	ALLCLASSESCANUSE	PREREQFEAT1	PREREQFEAT2	OrReqFeat0	OrReqFeat1	OrReqFeat2	OrReqFeat3	OrReqFeat4	REQSKILL	ReqSkillMinRanks	REQSKILL2	ReqSkillMinRanks2	MINATTACKBONUS	MINSTR	MINDEX	MININT	MINWIS	MINCON	MINCHA	MINSPELLLVL	MinLevel	MaxLevel	MinLevelClass	MinFortSave	PreReqEpic	CATEGORY
0	PowerAttack	500	501	****	1	****	****	****	****	****	****	****	****	****	****	****	****	13	****	****	****	****	****	****	****	****	****	****	0	1
1	Cleave	510	511	****	1	0	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	0	1
2	WeaponFocus	520	521	****	0	****	****	****	****	****	****	****	****	****	****	****	1	****	****	****	****	****	****	****	****	****	****	****	0	2
3	ImprovedCritical	530	531	****	0	2	****	****	****	****	****	****	****	****	****	****	8	****	****	****	****	****	****	****	****	****	****	****	0	2
4	SkillFocus_Lore	540	541	****	1	****	****	****	****	****	****	****	2	5	****	****	****	****	****	****	****	****	****	****	****	****	****	****	0	3
5	MonsterFeat	550	551	****	0	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	****	0	99
`;

const MINIMAL_SKILLS_2DA = `2DA V2.0

Label	Name	Description	Icon	Untrained	KeyAbility	AllClassesCanUse
0	Concentration	270	345	****	1	CON	1
1	DisableTrap	272	346	****	0	INT	0
2	Lore	274	347	****	1	INT	1
`;

const MINIMAL_CLS_FEAT_FIGHT = `2DA V2.0

FeatLabel	FeatIndex	List	GrantedOnLevel	OnMenu
0	PowerAttack	0	2	-1	1
1	Cleave	1	2	-1	1
2	WeaponFocus	2	1	-1	1
3	ImprovedCritical	3	1	-1	1
`;

const MINIMAL_CLS_FEAT_WIZ = `2DA V2.0

FeatLabel	FeatIndex	List	GrantedOnLevel	OnMenu
0	SkillFocus_Lore	4	2	-1	1
`;

// ---------------------------------------------------------------------------
// Feat assembler unit tests
// ---------------------------------------------------------------------------

describe('assembleFeatCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    500: 'Ataque Poderoso',
    501: 'Desc ataque poderoso',
    510: 'Hendidura',
    511: 'Desc hendidura',
    520: 'Soltura con un Arma',
    521: 'Desc soltura arma',
    530: 'Critico Mejorado',
    531: 'Desc critico mejorado',
    540: 'Conocimiento Enfocado',
    541: 'Desc conocimiento enfocado',
    550: 'Dote de Monstruo',
    551: 'Desc dote monstruo',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  const classRows = new Map<string, ClassRowInfo>([
    ['class:fighter', { sourceRow: 0, featTableRef: 'CLS_FEAT_FIGHT' }],
    ['class:wizard', { sourceRow: 1, featTableRef: 'CLS_FEAT_WIZ' }],
  ]);

  it('filters to player-available feats (ALLCLASSESCANUSE or in class list)', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    const ids = result.catalog.feats.map((f) => f.id);
    // PowerAttack, Cleave, SkillFocus_Lore: ALLCLASSESCANUSE=1
    // WeaponFocus, ImprovedCritical: in cls_feat_fight List > 0
    // MonsterFeat: excluded (ALLCLASSESCANUSE=0, not in any class list)
    expect(ids).toContain('feat:powerattack');
    expect(ids).toContain('feat:cleave');
    expect(ids).toContain('feat:weaponfocus');
    expect(ids).toContain('feat:improvedcritical');
    expect(ids).toContain('feat:skillfocus-lore');
    expect(ids).not.toContain('feat:monsterfeat');
  });

  it('extracts prerequisite data correctly', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    // PowerAttack requires STR >= 13
    const pa = result.catalog.feats.find((f) => f.id === 'feat:powerattack')!;
    expect(pa.prerequisites.minStr).toBe(13);

    // Cleave requires PowerAttack (feat index 0)
    const cleave = result.catalog.feats.find((f) => f.id === 'feat:cleave')!;
    expect(cleave.prerequisites.requiredFeat1).toBe('feat:powerattack');

    // ImprovedCritical requires BAB 8 and WeaponFocus
    const ic = result.catalog.feats.find((f) => f.id === 'feat:improvedcritical')!;
    expect(ic.prerequisites.minBab).toBe(8);
    expect(ic.prerequisites.requiredFeat1).toBe('feat:weaponfocus');

    // SkillFocus_Lore requires skill index 2 (Lore) with minRanks 5
    const sf = result.catalog.feats.find((f) => f.id === 'feat:skillfocus-lore')!;
    expect(sf.prerequisites.requiredSkill).toEqual({
      id: 'skill:lore',
      minRanks: 5,
    });
  });

  it('builds class feat lists keyed by class canonical ID', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    // Fighter should have 4 entries
    const fighterFeats = result.catalog.classFeatLists['class:fighter'];
    expect(fighterFeats).toBeDefined();
    expect(fighterFeats.length).toBe(4);

    // Check one entry: PowerAttack List=2 (class+general)
    const pa = fighterFeats.find((e) => e.featId === 'feat:powerattack');
    expect(pa).toBeDefined();
    expect(pa!.list).toBe(2);
    expect(pa!.onMenu).toBe(true);

    // Wizard should have 1 entry
    const wizFeats = result.catalog.classFeatLists['class:wizard'];
    expect(wizFeats).toBeDefined();
    expect(wizFeats.length).toBe(1);
    expect(wizFeats[0].featId).toBe('feat:skillfocus-lore');
  });

  it('resolves TLK names to Spanish text', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    const pa = result.catalog.feats.find((f) => f.id === 'feat:powerattack')!;
    expect(pa.label).toBe('Ataque Poderoso');
    expect(pa.description).toBe('Desc ataque poderoso');
  });

  it('passes Zod schema validation', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);
    expect(() => featCatalogSchema.parse(result.catalog)).not.toThrow();
  });

  it('buildFeatIdsByRow creates sourceRow -> canonical ID map', () => {
    const resources: Record<string, string> = {
      feat: MINIMAL_FEAT_2DA,
      skills: MINIMAL_SKILLS_2DA,
      cls_feat_fight: MINIMAL_CLS_FEAT_FIGHT,
      cls_feat_wiz: MINIMAL_CLS_FEAT_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleFeatCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);
    const map = buildFeatIdsByRow(result.catalog.feats);

    expect(map.get(0)).toBe('feat:powerattack');
    expect(map.get(1)).toBe('feat:cleave');
    expect(map.get(2)).toBe('feat:weaponfocus');
  });
});

// ---------------------------------------------------------------------------
// Integration tests (require local nwsync + base game)
// ---------------------------------------------------------------------------

const hasNwsync = existsSync(NWSYNC_META_DB) && existsSync(NWSYNC_DATA_DB);
const hasBaseGame = existsSync(BASE_GAME_KEY);
const hasIntegrationDeps = hasNwsync && hasBaseGame;

describe.skipIf(!hasIntegrationDeps)('Feat assembler (integration)', () => {
  let nwsyncReader: NwsyncReader;
  let baseGameReader: BaseGameReader;
  let tlkResolver: TlkResolver;
  let classRowsForFeats: Map<string, ClassRowInfo>;

  beforeAll(async () => {
    const { BaseGameReader: BGReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );
    const { assembleClassCatalog } = await import(
      '@data-extractor/assemblers/class-assembler'
    );

    nwsyncReader = new NwsyncReader(
      NWSYNC_META_DB,
      NWSYNC_DATA_DB,
      PUERTA_MANIFEST_SHA1,
    );

    baseGameReader = new BGReader(BASE_GAME_KEY, BASE_GAME_DIR);
    tlkResolver = TlkResolver.fromPaths(BASE_GAME_TLK, nwsyncReader);

    const classResult = assembleClassCatalog(
      nwsyncReader, baseGameReader, tlkResolver, TEST_DATASET_ID,
    );

    classRowsForFeats = new Map();
    for (const cls of classResult.catalog.classes) {
      classRowsForFeats.set(cls.id, {
        sourceRow: cls.sourceRow,
        featTableRef: cls.featTableRef,
      });
    }
  });

  afterAll(() => {
    nwsyncReader?.close();
  });

  it('assembles feat catalog with expected count range', () => {
    const result = assembleFeatCatalog(
      nwsyncReader, baseGameReader, tlkResolver, classRowsForFeats, TEST_DATASET_ID,
    );

    // Per RESEARCH: ~1823 lines in feat.2da
    expect(result.catalog.feats.length).toBeGreaterThanOrEqual(100);
    expect(result.catalog.feats.length).toBeLessThanOrEqual(2000);

    // Class feat lists should have entries for most player classes
    const classListKeys = Object.keys(result.catalog.classFeatLists);
    expect(classListKeys.length).toBeGreaterThanOrEqual(10);

    // Validate schema
    expect(() => featCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});
