export const ENTITY_KINDS = [
  'class',
  'feat',
  'spell',
  'skill',
  'race',
  'subrace',
  'alignment',
  'deity',
  'domain',
  'rule',
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export type CanonicalId = `${EntityKind}:${string | number}`;

export const canonicalIdRegex = /^[a-z-]+:[A-Za-z0-9._-]+$/;
