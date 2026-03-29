import type {
  EvidenceLayer,
  SourceLayer,
} from './canonical-record';

export const MECHANICS_PRECEDENCE: readonly SourceLayer[] = [
  'manual-override',
  'puerta-snapshot',
  'base-game',
];

export const EVIDENCE_PRECEDENCE: readonly EvidenceLayer[] = [
  'override-evidence',
  'forum-doc',
  'stale-doc',
];

const RUNTIME_TRUTH_SOURCES = new Set<SourceLayer>(MECHANICS_PRECEDENCE);

export function resolveMechanicsLayer(
  layers: ReadonlyArray<SourceLayer | EvidenceLayer | null | undefined>,
): SourceLayer | null {
  for (const candidate of MECHANICS_PRECEDENCE) {
    if (layers.some((layer) => layer === candidate)) {
      return candidate;
    }
  }

  return null;
}

export function isRuntimeTruthSource(
  layer: SourceLayer | EvidenceLayer,
): layer is SourceLayer {
  return RUNTIME_TRUTH_SOURCES.has(layer as SourceLayer);
}
