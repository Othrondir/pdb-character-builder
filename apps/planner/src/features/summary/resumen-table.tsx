import { NwnButton } from '@planner/components/ui/nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { ResumenViewModel } from './resumen-selectors';

interface ResumenTableProps {
  model: ResumenViewModel;
  onEditLevel: (level: ResumenViewModel['progression'][number]['level']) => void;
}

/**
 * Phase 12.9: Compact ficha layout.
 *
 *   1. Compact identity header  ({name} · {race}{subrace?} · {alignment} · <span>{dataset}</span>)
 *   2. Progresión block         (20-row × 8-col table, full-width via --progresion modifier)
 *   3. Habilidades block        (39-row × 4-col table, full-width via --habilidades modifier)
 *
 * Identity was collapsed from the prior definition-list + attribute table surfaces (R2/D-03) because
 * the creation-stepper summary bar already surfaces labeled identity + atributo chips.
 * Keeping the compact header inside <ResumenTable> preserves the ficha handoff self-containment.
 *
 * Middot separator: U+00B7 '·' matching .character-sheet__stat-mod precedent.
 * Dataset span color tint via .resumen-table__identity-header__dataset CSS class (no inline style).
 *
 * All derived-stat cells render `copy.notAvailable` ('—') when the rules-engine helper is
 * unavailable. NEVER substitute `0` (SHAR-01 carry-over).
 */
export function ResumenTable({ model, onEditLevel }: ResumenTableProps) {
  const copy = shellCopyEs.resumen;
  const dash = copy.notAvailable;

  return (
    <div className="resumen-table">
      {/* Compact identity header (replaces the prior identity + attribute surfaces) */}
      <header className="resumen-table__identity-header">
        {model.identity.name}
        {' · '}
        {model.identity.raceLabel}
        {model.identity.subraceLabel ? ` · ${model.identity.subraceLabel}` : ''}
        {' · '}
        {model.identity.alignmentLabel}
        {' · '}
        <span className="resumen-table__identity-header__dataset">
          {model.identity.datasetLabel}
        </span>
      </header>

      {/* Block 1: Progresión (20 rows × 8 cols — full-width via BEM modifier) */}
      <section
        className="resumen-table__block resumen-table__block--progresion nwn-frame"
        aria-labelledby="resumen-progression-heading"
      >
        <h3 id="resumen-progression-heading" className="resumen-table__heading">
          {copy.progressionBlockHeading}
        </h3>
        <table className="resumen-table__progression">
          <thead>
            <tr>
              <th scope="col">{copy.columnLabels.level}</th>
              <th scope="col">{copy.columnLabels.className}</th>
              <th scope="col">{copy.columnLabels.bab}</th>
              <th scope="col">{copy.columnLabels.fortitude}</th>
              <th scope="col">{copy.columnLabels.reflex}</th>
              <th scope="col">{copy.columnLabels.will}</th>
              <th scope="col">{copy.columnLabels.generalFeat}</th>
              <th scope="col">{copy.columnLabels.classFeat}</th>
              <th scope="col">{copy.columnLabels.edit}</th>
            </tr>
          </thead>
          <tbody>
            {model.progression.map((lv) => (
              <tr key={lv.level}>
                <th scope="row">{lv.level}</th>
                <td>{lv.classLabel ?? dash}</td>
                <td>{lv.cumulativeBab === null ? dash : lv.cumulativeBab}</td>
                <td>{lv.cumulativeFort === null ? dash : lv.cumulativeFort}</td>
                <td>{lv.cumulativeRef === null ? dash : lv.cumulativeRef}</td>
                <td>{lv.cumulativeWill === null ? dash : lv.cumulativeWill}</td>
                <td>{lv.generalFeatLabel ?? dash}</td>
                <td>{lv.classFeatLabel ?? dash}</td>
                <td>
                  <NwnButton
                    aria-label={copy.actions.editLevelTemplate.replace('{N}', String(lv.level))}
                    className="resumen-table__edit-button"
                    onClick={() => onEditLevel(lv.level)}
                    variant="secondary"
                  >
                    {copy.actions.editLevelTemplate.replace('{N}', String(lv.level))}
                  </NwnButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Block 2: Habilidades (39 rows × 4 cols — full-width via BEM modifier) */}
      <section
        className="resumen-table__block resumen-table__block--habilidades nwn-frame"
        aria-labelledby="resumen-skills-heading"
      >
        <h3 id="resumen-skills-heading" className="resumen-table__heading">
          {copy.skillsBlockHeading}
        </h3>
        <table className="resumen-table__skills">
          <thead>
            <tr>
              <th scope="col">{copy.columnLabels.skill}</th>
              <th scope="col">{copy.columnLabels.ranks}</th>
              <th scope="col">{copy.columnLabels.abilityMod}</th>
              <th scope="col">{copy.columnLabels.skillTotal}</th>
            </tr>
          </thead>
          <tbody>
            {model.skills.map((s) => (
              <tr key={s.skillId}>
                <th scope="row">{s.skillLabel}</th>
                <td>{s.ranks}</td>
                <td>{s.abilityMod >= 0 ? `+${s.abilityMod}` : s.abilityMod}</td>
                <td>{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
