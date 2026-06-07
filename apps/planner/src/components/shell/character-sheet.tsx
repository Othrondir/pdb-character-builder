import { useEffect, useId, useRef, useState } from 'react';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { getChosenFeatIds, useFeatStore } from '@planner/features/feats/store';
import { abilityModifier } from '@rules-engine/foundation';
import { computeHitPoints } from '@rules-engine/progression/compute-hit-points';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledSkillCatalog } from '@planner/data/compiled-skills';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import {
  computeSavingThrowTotals,
  computeTotalBab,
} from '@rules-engine/feats/bab-calculator';
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma',
};

const DERIVED_STAT_LABELS = {
  ac: 'CA',
  hp: 'PG',
  bab: 'BAB',
  attacksPerRound: 'Ataques/asalto',
  fortitude: 'Fortaleza',
  reflex: 'Reflejos',
  will: 'Voluntad',
} as const;

type EquipmentDialogKind = 'armor' | 'help' | 'shield' | 'skills';

interface EquipmentOption {
  bonus: number;
  label: string;
}

interface EquipmentPreset {
  armorClassBonus: number;
  attackBonus: number;
  attributeBonus: number;
  label: string;
  savingThrowBonus: number;
}

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    armorClassBonus: 15,
    attackBonus: 5,
    attributeBonus: 4,
    label: shellCopyEs.stepper.equipmentSimulation.level12,
    savingThrowBonus: 6,
  },
  {
    armorClassBonus: 20,
    attackBonus: 5,
    attributeBonus: 6,
    label: shellCopyEs.stepper.equipmentSimulation.level16,
    savingThrowBonus: 6,
  },
];

const SHIELD_OPTIONS: EquipmentOption[] = [
  { bonus: 1, label: shellCopyEs.stepper.equipmentSimulation.shieldSmall },
  { bonus: 2, label: shellCopyEs.stepper.equipmentSimulation.shieldMedium },
  { bonus: 3, label: shellCopyEs.stepper.equipmentSimulation.shieldTower },
];

const ARMOR_OPTIONS: EquipmentOption[] = Array.from(
  { length: 9 },
  (_, bonus) => ({
    bonus,
    label: shellCopyEs.stepper.equipmentSimulation.armorClassLabel(bonus),
  }),
);

const SKILL_BONUS_AMOUNT = 7;

const SKILL_BONUS_OPTIONS = [...compiledSkillCatalog.skills]
  .sort((left, right) => left.label.localeCompare(right.label, 'es'))
  .map((skill) => ({
    id: skill.id,
    label: skill.label,
  }));

const NO_CLASS_ICON_SRC = new URL(
  '../../../../../class_icon/no-class.png',
  import.meta.url,
).href;

const CLASS_ICON_BY_ID: Record<string, string> = {
  'class:almapredilecta': new URL(
    '../../../../../class_icon/almapredilecta.png',
    import.meta.url,
  ).href,
  'class:arcane-archer': new URL(
    '../../../../../class_icon/arcane-archer.png',
    import.meta.url,
  ).href,
  'class:artifice': new URL(
    '../../../../../class_icon/artifice.png',
    import.meta.url,
  ).href,
  'class:assassin': new URL(
    '../../../../../class_icon/assassin.png',
    import.meta.url,
  ).href,
  'class:barbarian': new URL(
    '../../../../../class_icon/barbarian.png',
    import.meta.url,
  ).href,
  'class:bard': new URL(
    '../../../../../class_icon/bard.png',
    import.meta.url,
  ).href,
  'class:cavalier': new URL(
    '../../../../../class_icon/cavalier.png',
    import.meta.url,
  ).href,
  'class:cleric': new URL(
    '../../../../../class_icon/cleric.png',
    import.meta.url,
  ).href,
  'class:discipulodedragon': new URL(
    '../../../../../class_icon/discipulodedragon.png',
    import.meta.url,
  ).href,
  'class:druid': new URL(
    '../../../../../class_icon/druid.png',
    import.meta.url,
  ).href,
  'class:dwarven-defender': new URL(
    '../../../../../class_icon/dwarven-defender.png',
    import.meta.url,
  ).href,
  'class:fighter': new URL(
    '../../../../../class_icon/fighter.png',
    import.meta.url,
  ).href,
  'class:harper': new URL(
    '../../../../../class_icon/harper.png',
    import.meta.url,
  ).href,
  'class:ladron-sombras-amn': new URL(
    '../../../../../class_icon/ladron-sombras-amn.png',
    import.meta.url,
  ).href,
  'class:monk': new URL(
    '../../../../../class_icon/monk.png',
    import.meta.url,
  ).href,
  'class:paladin': new URL(
    '../../../../../class_icon/paladin.png',
    import.meta.url,
  ).href,
  'class:paladin-antiguos': new URL(
    '../../../../../class_icon/paladin-antiguos.png',
    import.meta.url,
  ).href,
  'class:paladin-oscuro': new URL(
    '../../../../../class_icon/paladin-oscuro.png',
    import.meta.url,
  ).href,
  'class:paladin-vengador': new URL(
    '../../../../../class_icon/paladin-vengador.png',
    import.meta.url,
  ).href,
  'class:pale-master': new URL(
    '../../../../../class_icon/pale-master.png',
    import.meta.url,
  ).href,
  'class:ranger': new URL(
    '../../../../../class_icon/ranger.png',
    import.meta.url,
  ).href,
  'class:rogue': new URL(
    '../../../../../class_icon/rogue.png',
    import.meta.url,
  ).href,
  'class:sorcerer': new URL(
    '../../../../../class_icon/sorcerer.png',
    import.meta.url,
  ).href,
  'class:swashbuckler': new URL(
    '../../../../../class_icon/swashbuckler.png',
    import.meta.url,
  ).href,
  'class:teurgo': new URL(
    '../../../../../class_icon/teurgo.png',
    import.meta.url,
  ).href,
  'class:warlock': new URL(
    '../../../../../class_icon/warlock.png',
    import.meta.url,
  ).href,
  'class:weaponmaster': new URL(
    '../../../../../class_icon/weaponmaster.png',
    import.meta.url,
  ).href,
  'class:wizard': new URL(
    '../../../../../class_icon/wizard.png',
    import.meta.url,
  ).href,
};

const CLASS_LABEL_BY_ID = new Map(
  compiledClassCatalog.classes.map((classRecord) => [
    classRecord.id,
    classRecord.label,
  ]),
);

const WEAPON_FOCUS_FEAT_IDS = new Set(
  compiledFeatCatalog.feats
    .filter(
      (feat) =>
        feat.parameterizedFeatFamily?.canonicalId === 'feat:weapon-focus',
    )
    .map((feat) => feat.id),
);

// Phase 14-05 — local `computeModifier(score)` (formerly inlined the
// magic-10 formula) deleted; all call sites below resolve to the
// canonical `abilityModifier` import from `@rules-engine/foundation`.

function formatModifier(mod: number): string {
  return mod >= 0 ? `(+${mod})` : `(${mod})`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function applyAttributeBonus(
  attributes: Record<AttributeKey, number>,
  bonus: number,
): Record<AttributeKey, number> {
  if (bonus === 0) {
    return attributes;
  }

  return ATTRIBUTE_KEYS.reduce<Record<AttributeKey, number>>(
    (boostedAttributes, key) => ({
      ...boostedAttributes,
      [key]: attributes[key] + bonus,
    }),
    {} as Record<AttributeKey, number>,
  );
}

function buildClassLevels(
  levels: ReturnType<typeof useLevelProgressionStore.getState>['levels'],
): Record<string, number> {
  const classLevels: Record<string, number> = {};

  for (const level of levels) {
    if (!level.classId) {
      continue;
    }
    classLevels[level.classId] = (classLevels[level.classId] ?? 0) + 1;
  }

  return classLevels;
}

function findDominantClassId(
  levels: ReturnType<typeof useLevelProgressionStore.getState>['levels'],
): string | null {
  const tallies = new Map<string, { count: number; latestLevel: number }>();

  for (const level of levels) {
    if (!level.classId) {
      continue;
    }

    const current = tallies.get(level.classId) ?? {
      count: 0,
      latestLevel: 0,
    };
    tallies.set(level.classId, {
      count: current.count + 1,
      latestLevel: Math.max(current.latestLevel, level.level),
    });
  }

  let dominantClass: {
    classId: string;
    count: number;
    latestLevel: number;
  } | null = null;

  for (const [classId, tally] of tallies) {
    if (
      dominantClass === null ||
      tally.count > dominantClass.count ||
      (tally.count === dominantClass.count &&
        tally.latestLevel > dominantClass.latestLevel)
    ) {
      dominantClass = { classId, ...tally };
    }
  }

  return dominantClass?.classId ?? null;
}

function formatAttackSequence(bab: number, attackBonus = 0): string {
  const attacks = [bab];
  for (let attack = bab - 5; attack >= 1; attack -= 5) {
    attacks.push(attack);
  }

  return attacks.map((attack) => formatSigned(attack + attackBonus)).join(' / ');
}

function hasWeaponFocusFeat(featIds: string[]): boolean {
  return featIds.some((featId) => WEAPON_FOCUS_FEAT_IDS.has(featId));
}

interface EquipmentOptionDialogProps {
  onClose: () => void;
  onSelect: (bonus: number) => void;
  open: boolean;
  options: EquipmentOption[];
  selectedBonus: number;
  title: string;
}

function EquipmentOptionDialog({
  onClose,
  onSelect,
  open,
  options,
  selectedBonus,
  title,
}: EquipmentOptionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useBodyScrollLock(open);

  return (
    <dialog
      aria-labelledby={titleId}
      className="nwn-frame character-sheet-equipment-dialog"
      onCancel={onClose}
      ref={dialogRef}
    >
      <h2 className="character-sheet-equipment-dialog__title" id={titleId}>
        {title}
      </h2>
      <div className="character-sheet-equipment-dialog__options">
        {options.map((option) => (
          <NwnButton
            aria-pressed={option.bonus === selectedBonus}
            className={
              option.bonus === selectedBonus
                ? 'character-sheet-equipment-dialog__option is-selected'
                : 'character-sheet-equipment-dialog__option'
            }
            key={`${title}-${option.bonus}`}
            onClick={() => {
              onSelect(option.bonus);
              onClose();
            }}
            variant="secondary"
          >
            {option.label}
          </NwnButton>
        ))}
      </div>
      <div className="character-sheet-equipment-dialog__actions">
        <NwnButton onClick={onClose} variant="secondary">
          {shellCopyEs.stepper.equipmentSimulation.cancel}
        </NwnButton>
      </div>
    </dialog>
  );
}

interface SkillBonusDialogProps {
  onClose: () => void;
  onToggleSkill: (skillId: string) => void;
  open: boolean;
  selectedSkillIds: Set<string>;
}

function SkillBonusDialog({
  onClose,
  onToggleSkill,
  open,
  selectedSkillIds,
}: SkillBonusDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useBodyScrollLock(open);

  return (
    <dialog
      aria-labelledby={titleId}
      className="nwn-frame character-sheet-equipment-dialog character-sheet-equipment-dialog--skills"
      onCancel={onClose}
      ref={dialogRef}
    >
      <h2 className="character-sheet-equipment-dialog__title" id={titleId}>
        {shellCopyEs.stepper.equipmentSimulation.skillBonus}
      </h2>
      <div className="character-sheet-skill-bonus-dialog__options">
        {SKILL_BONUS_OPTIONS.map((skill) => {
          const isSelected = selectedSkillIds.has(skill.id);
          return (
            <NwnButton
              aria-pressed={isSelected}
              className={
                isSelected
                  ? 'character-sheet-skill-bonus-dialog__option is-selected'
                  : 'character-sheet-skill-bonus-dialog__option'
              }
              key={skill.id}
              onClick={() => onToggleSkill(skill.id)}
              variant="secondary"
            >
              <span>{skill.label}</span>
              <span className="character-sheet-skill-bonus-dialog__bonus">
                {shellCopyEs.stepper.equipmentSimulation.skillBonusValue(
                  SKILL_BONUS_AMOUNT,
                )}
              </span>
            </NwnButton>
          );
        })}
      </div>
      <div className="character-sheet-equipment-dialog__actions">
        <NwnButton onClick={onClose} variant="secondary">
          {shellCopyEs.stepper.equipmentSimulation.cancel}
        </NwnButton>
      </div>
    </dialog>
  );
}

interface EquipmentHelpDialogProps {
  onClose: () => void;
  open: boolean;
}

function EquipmentHelpDialog({ onClose, open }: EquipmentHelpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const helpCopy = shellCopyEs.stepper.equipmentSimulation;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useBodyScrollLock(open);

  return (
    <dialog
      aria-labelledby={titleId}
      className="nwn-frame character-sheet-equipment-dialog character-sheet-equipment-dialog--help"
      onCancel={onClose}
      ref={dialogRef}
    >
      <h2 className="character-sheet-equipment-dialog__title" id={titleId}>
        {helpCopy.helpButton}
      </h2>
      <dl className="character-sheet-equipment-help">
        {helpCopy.helpItems.map((item) => (
          <div className="character-sheet-equipment-help__item" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
      <div className="character-sheet-equipment-dialog__actions">
        <NwnButton onClick={onClose} variant="secondary">
          {helpCopy.cancel}
        </NwnButton>
      </div>
    </dialog>
  );
}

function CharacterClassPortrait() {
  const progressionState = useLevelProgressionStore();
  const dominantClassId = findDominantClassId(progressionState.levels);
  const dominantClassLabel =
    dominantClassId === null
      ? null
      : (CLASS_LABEL_BY_ID.get(dominantClassId) ?? dominantClassId);
  const hasSpecificClassIcon =
    dominantClassId !== null && CLASS_ICON_BY_ID[dominantClassId] !== undefined;
  const classPortraitSrc =
    dominantClassId === null
      ? NO_CLASS_ICON_SRC
      : (CLASS_ICON_BY_ID[dominantClassId] ?? NO_CLASS_ICON_SRC);
  const classPortraitAlt =
    dominantClassLabel === null
      ? shellCopyEs.stepper.classPortraitFallbackAlt
      : hasSpecificClassIcon
        ? shellCopyEs.stepper.classPortraitAlt(dominantClassLabel)
        : shellCopyEs.stepper.classPortraitMissingAlt(dominantClassLabel);

  return (
    <div className="character-sheet__portrait">
      <img
        alt={classPortraitAlt}
        data-testid="character-class-portrait"
        src={classPortraitSrc}
      />
    </div>
  );
}

function StatsPanel() {
  const [equipmentPresetBonus, setEquipmentPresetBonus] = useState(0);
  const [shieldBonus, setShieldBonus] = useState(0);
  const [armorBonus, setArmorBonus] = useState(0);
  const [selectedSkillBonusIds, setSelectedSkillBonusIds] = useState<
    Set<string>
  >(() => new Set());
  const [equipmentDialog, setEquipmentDialog] =
    useState<EquipmentDialogKind | null>(null);
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const featState = useFeatStore();
  const activeEquipmentPreset = EQUIPMENT_PRESETS.find(
    (preset) => preset.armorClassBonus === equipmentPresetBonus,
  );
  const equipmentAttackBonus = activeEquipmentPreset?.attackBonus ?? 0;
  const equipmentAttributeBonus = activeEquipmentPreset?.attributeBonus ?? 0;
  const equipmentSavingThrowBonus =
    activeEquipmentPreset?.savingThrowBonus ?? 0;
  const baseFinalAttributes = computeFinalAttributeTotals(
    foundationState.baseAttributes,
    foundationState.racialModifiers,
    progressionState.levels,
  );
  const finalAttributes = applyAttributeBonus(
    baseFinalAttributes,
    equipmentAttributeBonus,
  );
  const selectedFeatIds = featState.levels.flatMap(getChosenFeatIds);
  const conModifier = abilityModifier(finalAttributes.con);
  const hitPoints = computeHitPoints(
    progressionState.levels,
    compiledClassCatalog,
    conModifier,
    selectedFeatIds,
  );
  const hitPointsDisplay = hitPoints > 0 ? String(hitPoints) : '--';
  const classLevels = buildClassLevels(progressionState.levels);
  const hasAnyClass = Object.keys(classLevels).length > 0;
  const bab = hasAnyClass
    ? computeTotalBab(classLevels, compiledClassCatalog)
    : null;
  const babDisplay = bab === null ? '--' : formatSigned(bab);
  const savingThrows = hasAnyClass
    ? computeSavingThrowTotals(classLevels, compiledClassCatalog, finalAttributes)
    : null;
  const displayedSavingThrows =
    savingThrows === null
      ? null
      : {
          fortitude: savingThrows.fortitude + equipmentSavingThrowBonus,
          reflex: savingThrows.reflex + equipmentSavingThrowBonus,
          will: savingThrows.will + equipmentSavingThrowBonus,
        };
  const attackAbilityBonus = abilityModifier(finalAttributes.str);
  const weaponFocusAttackBonus = hasWeaponFocusFeat(selectedFeatIds) ? 1 : 0;
  const attacksDisplay =
    bab === null
      ? '--'
      : formatAttackSequence(
          bab,
          attackAbilityBonus + equipmentAttackBonus + weaponFocusAttackBonus,
        );
  const baseArmorClass = 11 + abilityModifier(finalAttributes.dex);
  const armorClass =
    baseArmorClass + equipmentPresetBonus + shieldBonus + armorBonus;
  const selectedSkillBonuses = SKILL_BONUS_OPTIONS.filter((skill) =>
    selectedSkillBonusIds.has(skill.id),
  );
  const activeDialog =
    equipmentDialog === 'armor'
      ? {
          onSelect: (bonus: number) =>
            setArmorBonus((currentBonus) =>
              currentBonus === bonus ? 0 : bonus,
            ),
          options: ARMOR_OPTIONS,
          selectedBonus: armorBonus,
          title: shellCopyEs.stepper.equipmentSimulation.armorType,
        }
      : equipmentDialog === 'shield'
        ? {
            onSelect: (bonus: number) =>
              setShieldBonus((currentBonus) =>
                currentBonus === bonus ? 0 : bonus,
              ),
            options: SHIELD_OPTIONS,
            selectedBonus: shieldBonus,
            title: shellCopyEs.stepper.equipmentSimulation.shieldType,
          }
        : null;

  function toggleSkillBonus(skillId: string): void {
    setSelectedSkillBonusIds((currentSkillIds) => {
      const nextSkillIds = new Set(currentSkillIds);
      if (nextSkillIds.has(skillId)) {
        nextSkillIds.delete(skillId);
      } else {
        nextSkillIds.add(skillId);
      }
      return nextSkillIds;
    });
  }

  return (
    <div>
      <dl className="character-sheet__stat-grid">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = finalAttributes[key];
          const mod = abilityModifier(value);
          return (
            <div key={key}>
              <dt>{ATTRIBUTE_LABELS[key]}</dt>
              <dd className="stat-value">{value}</dd>
              <dd className="stat-mod">{formatModifier(mod)}</dd>
            </div>
          );
        })}
      </dl>

      <dl className="character-sheet__derived">
        <div>
          <dt>{DERIVED_STAT_LABELS.ac}</dt>
          <dd>{armorClass}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.hp}</dt>
          <dd>{hitPointsDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.bab}</dt>
          <dd>{babDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.attacksPerRound}</dt>
          <dd>{attacksDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.fortitude}</dt>
          <dd>
            {displayedSavingThrows === null
              ? '--'
              : displayedSavingThrows.fortitude}
          </dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.reflex}</dt>
          <dd>
            {displayedSavingThrows === null
              ? '--'
              : displayedSavingThrows.reflex}
          </dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.will}</dt>
          <dd>
            {displayedSavingThrows === null ? '--' : displayedSavingThrows.will}
          </dd>
        </div>
      </dl>

      <div className="character-sheet__equipment">
        <div className="character-sheet__equipment-presets">
          {EQUIPMENT_PRESETS.map((preset) => (
            <NwnButton
              aria-pressed={equipmentPresetBonus === preset.armorClassBonus}
              className="character-sheet__equipment-button"
              key={preset.armorClassBonus}
              onClick={() =>
                setEquipmentPresetBonus((currentBonus) =>
                  currentBonus === preset.armorClassBonus
                    ? 0
                    : preset.armorClassBonus,
                )
              }
              variant={
                equipmentPresetBonus === preset.armorClassBonus
                  ? 'primary'
                  : 'secondary'
              }
            >
              {preset.label}
            </NwnButton>
          ))}
        </div>
        <div className="character-sheet__equipment-selectors">
          <NwnButton
            className="character-sheet__equipment-button character-sheet__equipment-button--small"
            aria-pressed={shieldBonus > 0}
            onClick={() => setEquipmentDialog('shield')}
            variant={shieldBonus > 0 ? 'primary' : 'auxiliary'}
          >
            {shellCopyEs.stepper.equipmentSimulation.shieldType}
          </NwnButton>
          <NwnButton
            className="character-sheet__equipment-button character-sheet__equipment-button--small"
            aria-pressed={armorBonus > 0}
            onClick={() => setEquipmentDialog('armor')}
            variant={armorBonus > 0 ? 'primary' : 'auxiliary'}
          >
            {shellCopyEs.stepper.equipmentSimulation.armorType}
          </NwnButton>
          <NwnButton
            aria-pressed={selectedSkillBonusIds.size > 0}
            className="character-sheet__equipment-button character-sheet__equipment-button--small"
            onClick={() => setEquipmentDialog('skills')}
            variant={selectedSkillBonusIds.size > 0 ? 'primary' : 'auxiliary'}
          >
            {shellCopyEs.stepper.equipmentSimulation.skillBonus}
          </NwnButton>
        </div>
        <div className="character-sheet__equipment-help-action">
          <NwnButton
            className="character-sheet__equipment-help-button"
            onClick={() => setEquipmentDialog('help')}
            variant="auxiliary"
          >
            {shellCopyEs.stepper.equipmentSimulation.helpButton}
          </NwnButton>
        </div>
        {selectedSkillBonuses.length > 0 ? (
          <ul className="character-sheet__skill-bonuses">
            {selectedSkillBonuses.map((skill) => (
              <li key={skill.id}>
                <span>{skill.label}</span>
                <span>
                  {shellCopyEs.stepper.equipmentSimulation.skillBonusValue(
                    SKILL_BONUS_AMOUNT,
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {activeDialog !== null ? (
        <EquipmentOptionDialog
          onClose={() => setEquipmentDialog(null)}
          onSelect={activeDialog.onSelect}
          open={equipmentDialog === 'armor' || equipmentDialog === 'shield'}
          options={activeDialog.options}
          selectedBonus={activeDialog.selectedBonus}
          title={activeDialog.title}
        />
      ) : null}
      <SkillBonusDialog
        onClose={() => setEquipmentDialog(null)}
        onToggleSkill={toggleSkillBonus}
        open={equipmentDialog === 'skills'}
        selectedSkillIds={selectedSkillBonusIds}
      />
      <EquipmentHelpDialog
        onClose={() => setEquipmentDialog(null)}
        open={equipmentDialog === 'help'}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="character-sheet__empty">
      <h3>{shellCopyEs.stepper.emptySheetHeading}</h3>
      <p>{shellCopyEs.stepper.emptySheetBody}</p>
    </div>
  );
}

export function CharacterSheet() {
  const foundationState = useCharacterFoundationStore();
  const hasRace = foundationState.raceId !== null;

  return (
    <NwnFrame as="aside" className="character-sheet" aria-label="Hoja de personaje">
      <div className="character-sheet__title-bar">
        <h2>{shellCopyEs.stepper.characterSheetHeading}</h2>
      </div>
      <div className="character-sheet__content">
        <CharacterClassPortrait />
        {hasRace ? <StatsPanel /> : <EmptyState />}
      </div>
    </NwnFrame>
  );
}
