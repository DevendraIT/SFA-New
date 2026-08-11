import { z } from 'zod';

export const importQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
  status: z.string().optional(),
});


export const mapProductSchema = z.object({
  productId: z.string().uuid({ message: 'Valid Product UUID is required' }),
});

export const mapBranchSchema = z.object({
  branchId: z.string().uuid({ message: 'Valid Branch UUID is required' }),
});

export const mapTerritorySchema = z.object({
  territoryId: z.string().uuid({ message: 'Valid Territory UUID is required' }),
});
