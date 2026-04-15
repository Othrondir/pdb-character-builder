import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';

import { assembleFeatCatalog, buildFeatIdsByRow, type ClassRowInfo } from '@data-extractor/assemblers/feat-assembler';
import { assembleSpellCatalog, buildSpellIdsByRow, type SpellClassRowInfo } from '@data-extractor/assemblers/spell-assembler';
import { assembleDomainCatalog } from '@data-extractor/assemblers/domain-assembler';
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
import { spellCatalogSchema } from '@data-extractor/contracts/spell-catalog';
import { domainCatalogSchema } from '@data-extractor/contracts/domain-catalog';

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
// Spell test data
// ---------------------------------------------------------------------------

const MINIMAL_SPELLS_2DA = `2DA V2.0

Label	Name	Description	School	Bard	Cleric	Druid	Paladin	Ranger	Wiz_Sorc	Innate	MetaMagic
0	MagicMissile	600	601	V	****	****	****	****	****	1	1	0x003F
1	CureLightWounds	610	611	C	****	1	1	****	****	****	1	0x0000
2	Fireball	620	621	V	****	****	****	****	****	3	****	0x003F
3	BardSong	630	631	T	1	****	****	****	****	****	****	0x0000
4	MonsterAbility	640	641	I	****	****	****	****	****	****	****	0x0000
`;

const MINIMAL_CLS_SPGN_WIZ = `2DA V2.0

Level	NumSpellLevels	SpellLevel0	SpellLevel1	SpellLevel2	SpellLevel3
0	1	10	3	1	****	****
1	2	10	4	2	****	****
2	3	10	4	2	1	****
3	4	10	4	3	2	1
`;

const MINIMAL_CLS_SPKN_WIZ = `2DA V2.0

Level	SpellLevel0	SpellLevel1	SpellLevel2	SpellLevel3
0	1	5	3	****	****
1	2	5	4	****	****
2	3	5	4	2	****
3	4	5	4	3	2
`;

// ---------------------------------------------------------------------------
// Domain test data
// ---------------------------------------------------------------------------

const MINIMAL_DOMAINS_2DA = `2DA V2.0

Label	Name	Description	Icon	GrantedFeat	Level_0	Level_1	Level_2	Level_3	Level_4	Level_5	Level_6	Level_7	Level_8	Level_9	IsActive
0	Air	700	701	****	0	0	****	2	****	****	****	****	****	****	****	1
1	War	710	711	****	2	****	1	****	****	****	****	****	****	****	****	1
`;

// ---------------------------------------------------------------------------
// Spell assembler unit tests
// ---------------------------------------------------------------------------

describe('assembleSpellCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    600: 'Misil Magico',
    601: 'Desc misil magico',
    610: 'Curar Heridas Leves',
    611: 'Desc curar heridas',
    620: 'Bola de Fuego',
    621: 'Desc bola de fuego',
    630: 'Cancion de Bardo',
    631: 'Desc cancion bardo',
    640: 'Habilidad de Monstruo',
    641: 'Desc habilidad monstruo',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  const classRows = new Map<string, SpellClassRowInfo>([
    ['class:bard', { sourceRow: 0, spellGainTableRef: null, spellKnownTableRef: null, spellColumnName: 'Bard' }],
    ['class:cleric', { sourceRow: 1, spellGainTableRef: null, spellKnownTableRef: null, spellColumnName: 'Cleric' }],
    ['class:druid', { sourceRow: 2, spellGainTableRef: null, spellKnownTableRef: null, spellColumnName: 'Druid' }],
    ['class:wizard', { sourceRow: 3, spellGainTableRef: 'CLS_SPGN_WIZ', spellKnownTableRef: 'CLS_SPKN_WIZ', spellColumnName: 'Wiz_Sorc' }],
  ]);

  it('extracts class-level mappings from spell columns', () => {
    const resources: Record<string, string> = {
      spells: MINIMAL_SPELLS_2DA,
      cls_spgn_wiz: MINIMAL_CLS_SPGN_WIZ,
      cls_spkn_wiz: MINIMAL_CLS_SPKN_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleSpellCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    // MagicMissile: Wiz_Sorc=1, Innate=1
    const mm = result.catalog.spells.find((s) => s.id === 'spell:magicmissile')!;
    expect(mm.classLevels['class:wizard']).toBe(1);
    expect(mm.innateLevel).toBe(1);

    // CureLightWounds: Cleric=1, Druid=1, Innate=1
    const clw = result.catalog.spells.find((s) => s.id === 'spell:curelightwounds')!;
    expect(clw.classLevels['class:cleric']).toBe(1);
    expect(clw.classLevels['class:druid']).toBe(1);
    expect(clw.innateLevel).toBe(1);

    // Fireball: Wiz_Sorc=3
    const fb = result.catalog.spells.find((s) => s.id === 'spell:fireball')!;
    expect(fb.classLevels['class:wizard']).toBe(3);

    // BardSong: Bard=1
    const bs = result.catalog.spells.find((s) => s.id === 'spell:bardsong')!;
    expect(bs.classLevels['class:bard']).toBe(1);
  });

  it('filters out monster-only spells', () => {
    const resources: Record<string, string> = {
      spells: MINIMAL_SPELLS_2DA,
      cls_spgn_wiz: MINIMAL_CLS_SPGN_WIZ,
      cls_spkn_wiz: MINIMAL_CLS_SPKN_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleSpellCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);
    const ids = result.catalog.spells.map((s) => s.id);

    // MonsterAbility has no player class columns -> should be excluded
    expect(ids).not.toContain('spell:monsterability');
    // Player-castable spells should be included
    expect(ids).toContain('spell:magicmissile');
    expect(ids).toContain('spell:curelightwounds');
    expect(ids).toContain('spell:fireball');
    expect(ids).toContain('spell:bardsong');
  });

  it('builds spell gain tables from cls_spgn_* 2DAs', () => {
    const resources: Record<string, string> = {
      spells: MINIMAL_SPELLS_2DA,
      cls_spgn_wiz: MINIMAL_CLS_SPGN_WIZ,
      cls_spkn_wiz: MINIMAL_CLS_SPKN_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleSpellCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    const wizGain = result.catalog.spellGainTables['class:wizard'];
    expect(wizGain).toBeDefined();
    expect(wizGain.length).toBe(4);

    // First row: casterLevel=1, slots with SpellLevel0=3, SpellLevel1=1
    expect(wizGain[0].casterLevel).toBe(1);
    expect(wizGain[0].slots['0']).toBe(3);
    expect(wizGain[0].slots['1']).toBe(1);
  });

  it('builds spell known tables from cls_spkn_* 2DAs', () => {
    const resources: Record<string, string> = {
      spells: MINIMAL_SPELLS_2DA,
      cls_spgn_wiz: MINIMAL_CLS_SPGN_WIZ,
      cls_spkn_wiz: MINIMAL_CLS_SPKN_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleSpellCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);

    const wizKnown = result.catalog.spellKnownTables['class:wizard'];
    expect(wizKnown).toBeDefined();
    expect(wizKnown.length).toBe(4);

    // First row: casterLevel=1, SpellLevel0=5, SpellLevel1=3
    expect(wizKnown[0].casterLevel).toBe(1);
    expect(wizKnown[0].known['0']).toBe(5);
    expect(wizKnown[0].known['1']).toBe(3);
  });

  it('passes Zod schema validation', () => {
    const resources: Record<string, string> = {
      spells: MINIMAL_SPELLS_2DA,
      cls_spgn_wiz: MINIMAL_CLS_SPGN_WIZ,
      cls_spkn_wiz: MINIMAL_CLS_SPKN_WIZ,
    };
    const reader = mockNwsyncReader(resources);
    const baseReader = mockBaseGameReader();

    const result = assembleSpellCatalog(reader, baseReader, resolver, classRows, TEST_DATASET_ID);
    expect(() => spellCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Domain assembler unit tests
// ---------------------------------------------------------------------------

describe('assembleDomainCatalog (unit)', () => {
  const baseTlk = mockTlkTable({
    700: 'Aire',
    701: 'Desc dominio aire',
    710: 'Guerra',
    711: 'Desc dominio guerra',
  });
  const customTlk = mockTlkTable({});
  const resolver = new TlkResolver(baseTlk, customTlk);

  const featIdsByRow = new Map<number, string>([
    [0, 'feat:powerattack'],
    [2, 'feat:weaponfocus'],
  ]);
  const spellIdsByRow = new Map<number, string>([
    [0, 'spell:magicmissile'],
    [1, 'spell:curelightwounds'],
    [2, 'spell:fireball'],
  ]);

  it('resolves granted feats and spell cross-references', () => {
    const reader = mockNwsyncReader({ domains: MINIMAL_DOMAINS_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleDomainCatalog(
      reader, baseReader, resolver, featIdsByRow, spellIdsByRow, TEST_DATASET_ID,
    );

    expect(result.catalog.domains).toHaveLength(2);

    // Air domain: GrantedFeat=0 -> feat:powerattack
    const air = result.catalog.domains.find((d) => d.id === 'domain:air')!;
    expect(air.label).toBe('Aire');
    expect(air.grantedFeatIds).toEqual(['feat:powerattack']);
    // Level_0=0 (spell:magicmissile), Level_2=2 (spell:fireball)
    expect(air.spellIds['0']).toEqual(['spell:magicmissile']);
    expect(air.spellIds['2']).toEqual(['spell:fireball']);

    // War domain: GrantedFeat=2 -> feat:weaponfocus
    const war = result.catalog.domains.find((d) => d.id === 'domain:war')!;
    expect(war.label).toBe('Guerra');
    expect(war.grantedFeatIds).toEqual(['feat:weaponfocus']);
    // Level_1=1 (spell:curelightwounds)
    expect(war.spellIds['1']).toEqual(['spell:curelightwounds']);
  });

  it('passes Zod schema validation', () => {
    const reader = mockNwsyncReader({ domains: MINIMAL_DOMAINS_2DA });
    const baseReader = mockBaseGameReader();

    const result = assembleDomainCatalog(
      reader, baseReader, resolver, featIdsByRow, spellIdsByRow, TEST_DATASET_ID,
    );
    expect(() => domainCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Integration tests (require local nwsync + base game)
// ---------------------------------------------------------------------------

const hasNwsync = existsSync(NWSYNC_META_DB) && existsSync(NWSYNC_DATA_DB);
const hasBaseGame = existsSync(BASE_GAME_KEY);
const hasIntegrationDeps = hasNwsync && hasBaseGame;

describe.skipIf(!hasIntegrationDeps)('Extended assemblers (integration)', () => {
  let nwsyncReader: NwsyncReader;
  let baseGameReader: BaseGameReader;
  let tlkResolver: TlkResolver;
  let classRowsForFeats: Map<string, ClassRowInfo>;
  let classRowsForSpells: Map<string, SpellClassRowInfo>;

  // Known spell column name -> class ID mapping for Puerta
  const SPELL_COLUMN_MAP: Record<string, string> = {
    'class:bard': 'Bard',
    'class:cleric': 'Cleric',
    'class:druid': 'Druid',
    'class:paladin': 'Paladin',
    'class:ranger': 'Ranger',
    'class:wizard': 'Wiz_Sorc',
    'class:sorcerer': 'Wiz_Sorc',
    'class:shaman': 'Shaman',
    'class:favoredsoul': 'FavSoul',
    'class:favored-soul': 'FavSoul',
    'class:hex': 'Hex',
    'class:warlock': 'Warlock',
    'class:spellsword': 'Spellsword',
    'class:invokerele': 'InvokerEle',
    'class:invokerhematurgo': 'InvokerHem',
  };

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
    classRowsForSpells = new Map();
    for (const cls of classResult.catalog.classes) {
      classRowsForFeats.set(cls.id, {
        sourceRow: cls.sourceRow,
        featTableRef: cls.featTableRef,
      });
      if (cls.spellCaster) {
        const colName = SPELL_COLUMN_MAP[cls.id];
        if (colName) {
          classRowsForSpells.set(cls.id, {
            sourceRow: cls.sourceRow,
            spellGainTableRef: cls.spellGainTableRef,
            spellKnownTableRef: cls.spellKnownTableRef,
            spellColumnName: colName,
          });
        }
      }
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

  it('assembles spell catalog with expected count range', () => {
    const result = assembleSpellCatalog(
      nwsyncReader, baseGameReader, tlkResolver, classRowsForSpells, TEST_DATASET_ID,
    );

    // Per RESEARCH: ~1558 lines, many player-castable
    expect(result.catalog.spells.length).toBeGreaterThanOrEqual(50);
    expect(result.catalog.spells.length).toBeLessThanOrEqual(2000);

    // Should have some spell gain tables
    const gainKeys = Object.keys(result.catalog.spellGainTables);
    expect(gainKeys.length).toBeGreaterThanOrEqual(1);

    // Validate schema
    expect(() => spellCatalogSchema.parse(result.catalog)).not.toThrow();
  });

  it('assembles domain catalog with ~34 domains', () => {
    const featResult = assembleFeatCatalog(
      nwsyncReader, baseGameReader, tlkResolver, classRowsForFeats, TEST_DATASET_ID,
    );
    const spellResult = assembleSpellCatalog(
      nwsyncReader, baseGameReader, tlkResolver, classRowsForSpells, TEST_DATASET_ID,
    );

    const featIds = buildFeatIdsByRow(featResult.catalog.feats);
    const spellIds = buildSpellIdsByRow(spellResult.catalog.spells);

    const result = assembleDomainCatalog(
      nwsyncReader, baseGameReader, tlkResolver, featIds, spellIds, TEST_DATASET_ID,
    );

    // Per RESEARCH: 34 domains
    expect(result.catalog.domains.length).toBeGreaterThanOrEqual(20);
    expect(result.catalog.domains.length).toBeLessThanOrEqual(50);

    // Validate schema
    expect(() => domainCatalogSchema.parse(result.catalog)).not.toThrow();
  });
});
