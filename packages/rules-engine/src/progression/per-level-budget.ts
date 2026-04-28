import { determineFeatSlots } from '../feats/feat-eligibility';
import {
  HUMAN_RACE_ID,
  HUMAN_BONUS_FEAT_AT_L1,
  HUMAN_SKILL_POINT_PER_LEVEL,
} from './race-constants';
import { getSkillPointBudget } from '../skills/skill-budget';

/**
 * Minimal structural catalog inputs. Rules-engine stays framework-agnostic
 * per CLAUDE.md "Prescriptive Shape": packages/rules-engine is a pure
 * TypeScript domain model — no React imports, no cross-package imports
 * from the extractor package. Callers (apps/planner) adapt the full
 * CompiledXCatalog shapes to these minimal inputs at the boundary.
 *
 * Framework purity acceptance (Plan 12.4-03): zero extractor-package
 * imports in this module (enforced by grep on the acceptance path).
 */

/** Structural class-catalog shape the selector reads. */
export interface ClassCatalogInput {
  classes: ReadonlyArray<{
    id: string;
    skillPointsPerLevel: number;
  }>;
}

/**
 * Structural feat-catalog shape the selector reads. Mirrors the subset of
 * the extractor's `FeatCatalog['classFeatLists']` actually used by
 * `determineFeatSlots` (see feats/feat-eligibility.ts L60-118). Keeping the
 * shape structural — instead of importing the extractor type — lets the
 * rules-engine module compile without a cross-package dependency.
 */
export interface FeatCatalogInput {
  classFeatLists: Readonly<
    Record<
      string,
      ReadonlyArray<{
        featId: string;
        grantedOnLevel: number | null;
        list: 0 | 1 | 2 | 3;
        onMenu: boolean;
      }>
    >
  >;
}

/**
 * Structural race-catalog shape. Currently a reserved parameter slot: the
 * selector hardcodes Humano canon (A1/A2) pending race-assembler enrichment.
 *
 * TODO(race-enrichment-backlog): decode from racialtypes.2da
 *   `ExtraFeatAtFirstLevel` + `ExtraSkillPointsPerLevel` when extractor
 *   ships these fields on `CompiledRace`. When that lands, replace the
 *   `HUMAN_*` constants below with a per-race lookup on
 *   `raceCatalog.races[raceId].bonusFeatAtFirstLevel` / `extraSkillPointsPerLevel`
 *   — no behavior change if the fixture spec locks the values.
 *   Tracked: .planning/phases/12.4-construccion-correctness-clarity/12.4-RESEARCH.md
 *   Assumptions A1 + A2 (compiled-races.ts race:human description canon).
 */
export interface RaceCatalogInput {
  races?: ReadonlyArray<{ id: string }>;
}

/**
 * NWN1 EE canon hardcodes for Humano race bonuses — Phase 16 (D-06) hoisted
 * the constants into `progression/race-constants.ts` so the new
 * `RACE_L1_BONUS_FEATS` allowlist (Humano + Mediano Fortecor) lives next to
 * the skill-point + feat-bonus scalars without forcing a back-import from
 * `feat-eligibility.ts` (which would create a circular dep).
 *
 * The extractor still does not surface race-level feat/skill bonuses on
 * `CompiledRace`; until it does, the constants in `race-constants.ts` MUST
 * stay in sync with `tests/phase-12.4/per-level-budget.fixture.spec.ts`.
 */

/** Per-level feat-slot + skill-point budget, computed from build + catalogs. */
export interface PerLevelBudget {
  featSlots: {
    /** General feat slot (character-level cadence: 1, 3, 6, 9, 12, 15) */
    general: number;
    /** Class bonus feat slot (class-level cadence per class) */
    classBonus: number;
    /** Race bonus feat slot (Humano gets +1 at L1) */
    raceBonus: number;
    /** Sum of general + classBonus + raceBonus */
    total: number;
    /** Feats the user has already selected at this level */
    chosen: number;
    /** total − chosen */
    remaining: number;
  };
  skillPoints: {
    /** Full budget (base × 4 at L1, plus Humano +1/level bonus) */
    budget: number;
    /** Ranks allocated at this level (sum across skills) */
    spent: number;
    /** budget − spent */
    remaining: number;
  };
}

/**
 * Build snapshot the selector reads. Keeping the contract function-based (
 * `intAbilityIncreasesBeforeLevel(level)` etc.) lets the zustand store /
 * derived selectors feed exact values without requiring the rules-engine to
 * know about the store shape.
 */
export interface BuildSnapshot {
  /** Race id (e.g. `'race:human'`) or null when no race chosen yet */
  raceId: string | null;
  /** Class id per level, or null when the level has not been assigned yet */
  classByLevel: Record<number, string | null>;
  /** Starting ability scores (post-race modifiers applied upstream) */
  abilityScores: { int: number };
  /**
   * Sum of level-up INT bumps applied BEFORE the given character level.
   * Standard NWN1 EE cadence: +1 at L4, L8, L12, L16 (each spent on INT).
   * Returns `0` if no bumps landed on INT.
   */
  intAbilityIncreasesBeforeLevel: (level: number) => number;
  /** Feats the user has picked at the given level (excludes auto-grants). */
  chosenFeatIdsAtLevel: (level: number) => string[];
  /** Carryover that legally enters the given level (0..4). */
  skillPointCarryoverBeforeLevel?: (level: number) => number;
  /** Skill points already spent at the given level (sum across skills). */
  spentSkillPointsAtLevel: (level: number) => number;
}

/**
 * Compute the authoritative feat-slot + skill-point budget for a single
 * character level. Pure function; no globals, no IO, no store coupling.
 *
 * Composes existing rules-engine primitives:
 *   - `determineFeatSlots` (feats/feat-eligibility.ts L60-118) for the
 *     general + classBonus cadence plus per-class bonus schedules.
 *   - A copy of the `getAvailablePoints` formula
 *     (skills/skill-allocation.ts L111-115) for the L1 ×4 skill-point
 *     multiplier. Kept inline (not imported) because skill-allocation's
 *     helper is not exported and belongs to a richer allocation machinery
 *     whose `SkillLevelInput` shape does not fit per-level-budget's
 *     minimal contract.
 *
 * Adds two canon hardcodes (Humano bonuses) documented against A1/A2 in
 * the phase research log.
 */
export function computePerLevelBudget(
  build: BuildSnapshot,
  level: number,
  classCatalog: ClassCatalogInput,
  featCatalog: FeatCatalogInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _raceCatalog: RaceCatalogInput,
): PerLevelBudget {
  const classId = build.classByLevel[level] ?? null;

  if (classId === null) {
    return {
      featSlots: {
        general: 0,
        classBonus: 0,
        raceBonus: 0,
        total: 0,
        chosen: 0,
        remaining: 0,
      },
      skillPoints: { budget: 0, spent: 0, remaining: 0 },
    };
  }

  const classRow = classCatalog.classes.find((c) => c.id === classId) ?? null;

  // Level count inside the current class up to and including the edited level.
  // `determineFeatSlots` keys its class-bonus schedule off this count (not the
  // overall character level).
  let classLevelInClass = 0;
  for (const [lvl, cid] of Object.entries(build.classByLevel)) {
    if (Number(lvl) <= level && cid === classId) {
      classLevelInClass += 1;
    }
  }

  // `determineFeatSlots` types its `classFeatLists` arg against the extractor's
  // `FeatCatalog['classFeatLists']` shape (mutable record of arrays). Our
  // structural `FeatCatalogInput.classFeatLists` is field-compatible but
  // `readonly`, so we cast at the call-site to preserve rules-engine framework
  // purity (no extractor-package import at this module level).
  //
  // Phase 16-02 (Pattern S7 + architectural decision B-01 option a):
  // we OMIT the `compiledClass` arg here. `per-level-budget.ts` lives inside
  // `packages/rules-engine/`; importing `compiledClassCatalog` would break
  // the framework-agnostic boundary. Engine-internal budget math falls
  // through to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES`. Cadence parity with the
  // extractor's Puerta-canon `bonusFeatSchedule` is reconciled at the
  // Phase 12.4-03 fixture layer (PIT-01 — Plan 16-02 owns that update),
  // not at this engine-internal call site.
  const slots = determineFeatSlots(
    {
      abilityScores: {},
      bab: 0,
      characterLevel: level,
      classLevels: { [classId]: classLevelInClass },
      fortitudeSave: 0,
      selectedFeatIds: new Set(),
      skillRanks: {},
      raceId: build.raceId,
      activeClassIdAtLevel: classId,
    },
    featCatalog.classFeatLists as unknown as Parameters<typeof determineFeatSlots>[1],
    // compiledClass omitted — Pattern S7: rules-engine package must not import
    // compiledClassCatalog. Legacy fallback wins for engine-internal budget math.
  );

  const general = slots.generalFeatSlot ? 1 : 0;
  const classBonus = slots.classBonusFeatSlot ? 1 : 0;
  const raceBonus =
    build.raceId === HUMAN_RACE_ID && level === 1 ? HUMAN_BONUS_FEAT_AT_L1 : 0;
  const total = general + classBonus + raceBonus;

  const chosen = build.chosenFeatIdsAtLevel(level).length;

  // Skill-point budget mirrors skill-allocation.ts::getAvailablePoints:
  //   base = max(1, classSkillPointsPerLevel + intMod)
  //   budget = (level === 1) ? base × 4 : base
  // Plus Humano +1/level canon (A2): at L1 the +1 is multiplied into the ×4
  // pass (humano L1 = base × 4 + 4), at L>1 the +1 is a flat add.
  const intMod = Math.floor(
    (build.abilityScores.int + build.intAbilityIncreasesBeforeLevel(level) - 10) / 2,
  );
  const classSkillBase = classRow?.skillPointsPerLevel ?? 2;
  const humanSkillBonus =
    build.raceId === HUMAN_RACE_ID ? HUMAN_SKILL_POINT_PER_LEVEL : 0;
  const skillBudget = getSkillPointBudget({
    bonusSkillPointsPerLevel: humanSkillBonus,
    carriedPoints: build.skillPointCarryoverBeforeLevel?.(level) ?? 0,
    intelligenceModifier: intMod,
    level,
    skillPointsBase: classSkillBase,
  });

  const spent = build.spentSkillPointsAtLevel(level);

  return {
    featSlots: {
      general,
      classBonus,
      raceBonus,
      total,
      chosen,
      remaining: total - chosen,
    },
    skillPoints: {
      budget: skillBudget,
      spent,
      remaining: skillBudget - spent,
    },
  };
}
