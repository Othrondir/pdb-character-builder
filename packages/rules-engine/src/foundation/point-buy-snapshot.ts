import { z } from 'zod';
import type { CanonicalId } from '../contracts/canonical-id';
import { canonicalRaceIdSchema } from '../contracts/canonical-id';
import snapshotJson from './data/puerta-point-buy.json';

/**
 * Phase 12.6 (ATTR-01) — per-race point-buy cost curve.
 *
 * Fail-closed at module load: if puerta-point-buy.json is malformed, Zod
 * throws before the app bundle initialises. UI code never sees a partially
 * valid snapshot.
 */
export const pointBuyCurveSchema = z
  .object({
    budget: z.number().int().positive(),
    minimum: z.number().int(),
    maximum: z.number().int(),
    costByScore: z.record(
      z.string().regex(/^\d+$/),
      z.number().int().nonnegative(),
    ),
  })
  .refine((c) => c.minimum <= c.maximum, {
    message: 'minimum must be <= maximum',
  })
  .refine(
    (c) =>
      Object.keys(c.costByScore).every(
        (k) => Number(k) >= c.minimum && Number(k) <= c.maximum,
      ),
    { message: 'costByScore keys must be within [minimum, maximum]' },
  );

export const pointBuySnapshotSchema = z.record(
  canonicalRaceIdSchema,
  pointBuyCurveSchema,
);

export type PointBuyCurve = z.infer<typeof pointBuyCurveSchema>;
export type PointBuySnapshot = z.infer<typeof pointBuySnapshotSchema>;

/**
 * Fail-closed at module load (D-03). Any schema mismatch throws before the
 * UI mounts. Currently empty — Plan 06 (A1b) populates per-race entries
 * after the user delivers Puerta-vetted curves.
 */
export const PUERTA_POINT_BUY_SNAPSHOT: Record<CanonicalId, PointBuyCurve> =
  pointBuySnapshotSchema.parse(snapshotJson) as Record<CanonicalId, PointBuyCurve>;
