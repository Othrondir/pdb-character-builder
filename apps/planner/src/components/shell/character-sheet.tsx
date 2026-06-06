import { useEffect, useId, useRef, useState } from 'react';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { abilityModifier } from '@rules-engine/foundation';
import { computeHitPoints } from '@rules-engine/progression/compute-hit-points';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import { computeTotalBab } from '@rules-engine/feats/bab-calculator';
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

type EquipmentDialogKind = 'armor' | 'shield';

interface EquipmentOption {
  bonus: number;
  label: string;
}

const EQUIPMENT_PRESETS: EquipmentOption[] = [
  { bonus: 15, label: shellCopyEs.stepper.equipmentSimulation.level12 },
  { bonus: 19, label: shellCopyEs.stepper.equipmentSimulation.level16 },
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

// Phase 14-05 — local `computeModifier(score)` (formerly inlined the
// magic-10 formula) deleted; all call sites below resolve to the
// canonical `abilityModifier` import from `@rules-engine/foundation`.

function formatModifier(mod: number): string {
  return mod >= 0 ? `(+${mod})` : `(${mod})`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
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

function formatAttackSequence(bab: number): string {
  const attacks = [bab];
  for (let attack = bab - 5; attack >= 1; attack -= 5) {
    attacks.push(attack);
  }

  return attacks.map(formatSigned).join(' / ');
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

function StatsPanel() {
  const [equipmentPresetBonus, setEquipmentPresetBonus] = useState(0);
  const [shieldBonus, setShieldBonus] = useState(0);
  const [armorBonus, setArmorBonus] = useState(0);
  const [equipmentDialog, setEquipmentDialog] =
    useState<EquipmentDialogKind | null>(null);
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const finalAttributes = computeFinalAttributeTotals(
    foundationState.baseAttributes,
    foundationState.racialModifiers,
    progressionState.levels,
  );
  const conModifier = abilityModifier(finalAttributes.con);
  const hitPoints = computeHitPoints(
    progressionState.levels,
    compiledClassCatalog,
    conModifier,
  );
  const hitPointsDisplay = hitPoints > 0 ? String(hitPoints) : '--';
  const classLevels = buildClassLevels(progressionState.levels);
  const hasAnyClass = Object.keys(classLevels).length > 0;
  const bab = hasAnyClass
    ? computeTotalBab(classLevels, compiledClassCatalog)
    : null;
  const babDisplay = bab === null ? '--' : formatSigned(bab);
  const attacksDisplay = bab === null ? '--' : formatAttackSequence(bab);
  const baseArmorClass = 10 + abilityModifier(finalAttributes.dex);
  const armorClass =
    baseArmorClass + equipmentPresetBonus + shieldBonus + armorBonus;
  const activeDialog =
    equipmentDialog === 'armor'
      ? {
          onSelect: setArmorBonus,
          options: ARMOR_OPTIONS,
          selectedBonus: armorBonus,
          title: shellCopyEs.stepper.equipmentSimulation.armorType,
        }
      : {
          onSelect: setShieldBonus,
          options: SHIELD_OPTIONS,
          selectedBonus: shieldBonus,
          title: shellCopyEs.stepper.equipmentSimulation.shieldType,
        };

  return (
    <div>
      <div className="character-sheet__portrait" />

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
          <dd>{abilityModifier(finalAttributes.con)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.reflex}</dt>
          <dd>{abilityModifier(finalAttributes.dex)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.will}</dt>
          <dd>{abilityModifier(finalAttributes.wis)}</dd>
        </div>
      </dl>

      <div className="character-sheet__equipment">
        <div className="character-sheet__equipment-presets">
          {EQUIPMENT_PRESETS.map((preset) => (
            <NwnButton
              aria-pressed={equipmentPresetBonus === preset.bonus}
              className="character-sheet__equipment-button"
              key={preset.bonus}
              onClick={() => setEquipmentPresetBonus(preset.bonus)}
              variant={
                equipmentPresetBonus === preset.bonus ? 'primary' : 'secondary'
              }
            >
              {preset.label}
            </NwnButton>
          ))}
        </div>
        <div className="character-sheet__equipment-selectors">
          <NwnButton
            className="character-sheet__equipment-button character-sheet__equipment-button--small"
            onClick={() => setEquipmentDialog('shield')}
            variant="auxiliary"
          >
            {shellCopyEs.stepper.equipmentSimulation.shieldType}
          </NwnButton>
          <NwnButton
            className="character-sheet__equipment-button character-sheet__equipment-button--small"
            onClick={() => setEquipmentDialog('armor')}
            variant="auxiliary"
          >
            {shellCopyEs.stepper.equipmentSimulation.armorType}
          </NwnButton>
        </div>
      </div>

      <EquipmentOptionDialog
        onClose={() => setEquipmentDialog(null)}
        onSelect={activeDialog.onSelect}
        open={equipmentDialog !== null}
        options={activeDialog.options}
        selectedBonus={activeDialog.selectedBonus}
        title={activeDialog.title}
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
        {hasRace ? <StatsPanel /> : <EmptyState />}
      </div>
    </NwnFrame>
  );
}
