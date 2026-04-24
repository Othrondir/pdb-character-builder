import { shellCopyEs } from '@planner/lib/copy/es';
import type { ResumenViewModel } from './resumen-selectors';

interface ResumenTableProps {
  model: ResumenViewModel;
}

/**
 * Flat 3-block Resumen table mirroring `excel simulador de fichas/Plantilla Base.xlsx`
 * sheet 1 "Resumen Ficha" layout:
 *   1. Identity + Attributes block (top-left in xlsx)
 *   2. Progression block (top-right in xlsx — 20-level class + BAB + saves + feats, UAT-2026-04-20 P6)
 *   3. Habilidades block (bottom in xlsx — 39 skills with ranks + ability mod + total)
 *
 * All derived-stat cells render `copy.notAvailable` ('—') when the rules-engine helper
 * is unavailable. NEVER substitute `0` — a ficha showing BAB/Fort/Ref/Will = 0 for every
 * level is misleading, not a clear handoff (SHAR-01).
 */
export function ResumenTable({ model }: ResumenTableProps) {
  const copy = shellCopyEs.resumen;
  const dash = copy.notAvailable;

  return (
    <div className="resumen-table">
      {/* Block 1: Identity + Attributes */}
      <section
        className="resumen-table__block nwn-frame"
        aria-labelledby="resumen-identity-heading"
      >
        <h3 id="resumen-identity-heading" className="resumen-table__heading">
          {copy.identityBlockHeading}
        </h3>
        <dl className="resumen-table__identity">
          <dt>Nombre</dt>
          <dd>{model.identity.name}</dd>
          <dt>Raza</dt>
          <dd>
            {model.identity.raceLabel}
            {model.identity.subraceLabel ? ` · ${model.identity.subraceLabel}` : ''}
          </dd>
          <dt>Alineamiento</dt>
          <dd>{model.identity.alignmentLabel}</dd>
          <dt>Ruleset · Dataset</dt>
          <dd>{model.identity.datasetLabel}</dd>
        </dl>
        <table className="resumen-table__attrs">
          <thead>
            <tr>
              <th scope="col">{copy.columnLabels.attribute}</th>
              <th scope="col">{copy.columnLabels.total}</th>
              <th scope="col">{copy.columnLabels.modifier}</th>
            </tr>
          </thead>
          <tbody>
            {/* @ts-expect-error Plan 12.9-02-01 deletes this consumer */}
            {(model.attributes ?? []).map((a) => (
              <tr key={a.key}>
                <th scope="row">{a.label}</th>
                <td>{a.total}</td>
                <td>{a.modifier >= 0 ? `+${a.modifier}` : a.modifier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Block 2: Progression (16 rows) */}
      <section
        className="resumen-table__block nwn-frame"
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Block 3: Skills */}
      <section
        className="resumen-table__block nwn-frame"
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
