import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';

export const datasetCatalogSchema = z
  .object({
    activationMode: z.literal('manual'),
    activeDatasetId: datasetIdSchema,
    availableDatasetIds: z.array(datasetIdSchema).min(1),
    lastPromotedAt: z.string().datetime({ offset: true }),
    lastPromotedBy: z.literal('manual'),
  })
  .superRefine((catalog, ctx) => {
    if (!catalog.availableDatasetIds.includes(catalog.activeDatasetId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['activeDatasetId'],
        message: 'activeDatasetId must be present in availableDatasetIds.',
      });
    }

    if (
      new Set(catalog.availableDatasetIds).size !==
      catalog.availableDatasetIds.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['availableDatasetIds'],
        message: 'availableDatasetIds must not contain duplicates.',
      });
    }
  });

export type DatasetCatalog = z.infer<typeof datasetCatalogSchema>;
