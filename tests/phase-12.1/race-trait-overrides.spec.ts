import { describe, expect, it } from 'vitest';

import { plannerRaceCatalog } from '@planner/data/race-catalog';

function getRace(id: string) {
  return plannerRaceCatalog.races.find((race) => race.id === id);
}

function getRevisedTraitsBlock(id: string) {
  const description = getRace(id)?.description ?? '';
  return description.split('Rasgos revisados de Puerta:')[1] ?? '';
}

describe('quick 260606-g7h / 260606-h8i — revised race and subrace trait catalog', () => {
  it('adds the revised Oni traits to race:ogro-hechicero', () => {
    const oni = getRace('race:ogro-hechicero');
    const revisedTraits = getRevisedTraitsBlock('race:ogro-hechicero');

    expect(oni?.description).toContain('Rasgos revisados de Puerta');
    expect(oni?.description).toContain('Oni');
    expect(revisedTraits).toContain(
      'Aprendizaje rápido: gana 1 dote adicional a 1.er nivel',
    );
    expect(revisedTraits).toContain(
      'Habilidoso: 4 puntos de habilidad adicionales a 1.er nivel',
    );
    expect(revisedTraits).not.toContain('Resistencia a conjuros 19');
    expect(revisedTraits).not.toContain('armadura natural');
  });

  it('corrects Enano ártico runtime size without duplicating its existing text traits', () => {
    const arcticDwarf = getRace('race:enano-artico');

    expect(arcticDwarf?.description).toContain('Tamaño pequeño');
    expect(arcticDwarf?.description).not.toContain('Rasgos revisados de Puerta');
    expect(arcticDwarf?.size).toBe('small');
  });

  it('records only non-duplicate revised traits for representative base races', () => {
    expect(getRace('race:halfelf')?.description).toContain(
      'Habilidoso: 4 puntos de habilidad adicionales a 1.er nivel',
    );
    expect(getRace('race:duergar')?.description).toContain(
      'Corrección: Afinidad con una habilidad (Saber Arcano)',
    );
    expect(getRace('race:minotauro')?.description).toContain(
      'Detalle de tamaño grande',
    );
  });

  it('does not add a Rasgos revisados block when the base description already has those traits', () => {
    for (const raceId of ['race:aasimar', 'race:gnoll', 'race:tanarukk']) {
      expect(
        getRace(raceId)?.description,
        `${raceId} should not duplicate already-sourced traits`,
      ).not.toContain('Rasgos revisados de Puerta');
    }
  });

  it('does not duplicate skill or natural-armor bonuses in revised blocks', () => {
    for (const raceId of ['race:ogro', 'race:minotauro', 'race:semiogro']) {
      const revisedTraits = getRevisedTraitsBlock(raceId);

      expect(revisedTraits, `${raceId} revised block`).not.toMatch(
        /armadura natural/i,
      );
      expect(revisedTraits, `${raceId} revised block`).not.toMatch(
        /Avistar|Buscar|Escuchar|Moverse sigilosamente/i,
      );
    }
  });

  it('does not model natural armor or racial skill bonuses as numeric race mechanics', () => {
    const oni = getRace('race:ogro-hechicero');

    expect(oni?.abilityAdjustments).toEqual({
      cha: 4,
      con: 6,
      dex: 0,
      int: 4,
      str: 10,
      wis: 4,
    });
    expect(Object.keys(oni ?? {})).not.toEqual(
      expect.arrayContaining(['naturalArmor', 'skillBonuses']),
    );
  });
});
