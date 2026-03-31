import {
  skillCatalogSchema,
  type SkillCatalog,
} from '@data-extractor/contracts/skill-catalog';

export const compiledSkillCatalog: SkillCatalog = skillCatalogSchema.parse({
  datasetId: 'puerta-ee-2026-03-31+skills05',
  restrictionOverrides: [
    {
      code: 'puerta.skill.tumble-heavy-armor',
      description:
        'Acrobacias queda bloqueada mientras el personaje use armadura pesada.',
      outcome: 'blocked',
      provenance: [
        {
          evidence: 'packages/overrides/skills/heavy-armor-tumble.json',
          note: 'Override curado del servidor para la restricción de armadura pesada.',
          source: 'manual-override',
        },
      ],
      scope: 'equipment',
      skillId: 'skill:tumble',
    },
  ],
  schemaVersion: '1',
  skills: [
    {
      abilityKey: 'dex',
      category: 'stealth',
      defaultClassIds: ['class:rogue', 'class:ranger', 'class:shadowdancer'],
      id: 'skill:hide',
      label: 'Esconderse',
      restrictionMetadata: [],
      trainedOnly: false,
    },
    {
      abilityKey: 'dex',
      category: 'stealth',
      defaultClassIds: ['class:rogue', 'class:ranger', 'class:shadowdancer'],
      id: 'skill:move-silently',
      label: 'Moverse sigilosamente',
      restrictionMetadata: [],
      trainedOnly: false,
    },
    {
      abilityKey: 'int',
      category: 'lore',
      defaultClassIds: ['class:wizard', 'class:rogue', 'class:bard'],
      id: 'skill:spellcraft',
      label: 'Conocimiento de conjuros',
      restrictionMetadata: [],
      trainedOnly: true,
    },
    {
      abilityKey: 'dex',
      category: 'athletic',
      defaultClassIds: ['class:rogue', 'class:monk', 'class:bard'],
      id: 'skill:tumble',
      label: 'Acrobacias',
      restrictionMetadata: [
        {
          code: 'puerta.skill.tumble-heavy-armor',
          description:
            'No se puede aprovechar Acrobacias con armadura pesada en Puerta.',
          outcome: 'blocked',
          provenance: [
            {
              evidence: 'packages/overrides/skills/heavy-armor-tumble.json',
              note: 'Se compila como restricción de servidor compartida.',
              source: 'manual-override',
            },
          ],
          scope: 'equipment',
        },
      ],
      trainedOnly: false,
    },
    {
      abilityKey: 'int',
      category: 'discipline',
      defaultClassIds: ['class:rogue', 'class:bard', 'class:monk'],
      id: 'skill:use-magic-device',
      label: 'Usar objeto mágico',
      restrictionMetadata: [],
      trainedOnly: true,
    },
    {
      abilityKey: 'wis',
      category: 'perception',
      defaultClassIds: ['class:ranger', 'class:druid', 'class:rogue'],
      id: 'skill:listen',
      label: 'Escuchar',
      restrictionMetadata: [],
      trainedOnly: false,
    },
    {
      abilityKey: 'wis',
      category: 'perception',
      defaultClassIds: ['class:ranger', 'class:druid', 'class:rogue'],
      id: 'skill:spot',
      label: 'Avistar',
      restrictionMetadata: [],
      trainedOnly: false,
    },
    {
      abilityKey: 'cha',
      category: 'social',
      defaultClassIds: ['class:bard', 'class:paladin', 'class:rogue'],
      id: 'skill:persuade',
      label: 'Persuadir',
      restrictionMetadata: [],
      trainedOnly: false,
    },
  ],
});

export function getCompiledSkillRecord(skillId: string) {
  return compiledSkillCatalog.skills.find((skill) => skill.id === skillId) ?? null;
}
