const IMPLIED_FEAT_IDS_BY_FEAT_ID: Record<string, readonly string[]> = {
  'feat:twoweap': ['feat:ambidex'],
  'feat:estilodecombatearco': ['feat:disparorapido'],
  'feat:estilodecombatedosarmas': ['feat:twoweap'],
  'feat:estilodecombatemejoradoarco': [
    'feat:disparorapido',
    'feat:disparosmultiples',
  ],
  'feat:estilodecombatemejoradodosarmas': [
    'feat:twoweap',
    'feat:imptwo',
  ],
  'feat:maestriaconelestilodecombatearco': [
    'feat:disparorapido',
    'feat:disparosmultiples',
    'feat:disparosmultiplesmejorado',
  ],
  'feat:maestriaconelestilodecombatedosarmas': [
    'feat:twoweap',
    'feat:imptwo',
    'feat:combatecondosarmasmayor',
  ],
};

export function getFeatImplicationIds(featId: string): readonly string[] {
  return IMPLIED_FEAT_IDS_BY_FEAT_ID[featId] ?? [];
}

export function expandFeatIdsWithImplications(
  featIds: Iterable<string>,
): Set<string> {
  const expandedFeatIds = new Set<string>();
  const pendingFeatIds = [...featIds];

  while (pendingFeatIds.length > 0) {
    const featId = pendingFeatIds.pop();
    if (!featId || expandedFeatIds.has(featId)) {
      continue;
    }

    expandedFeatIds.add(featId);

    for (const impliedFeatId of getFeatImplicationIds(featId)) {
      if (!expandedFeatIds.has(impliedFeatId)) {
        pendingFeatIds.push(impliedFeatId);
      }
    }
  }

  return expandedFeatIds;
}
