import { z } from 'zod';

// --------------------------------------------------
// Shared Helpers
// --------------------------------------------------
const codeSchema = z.string().trim().toUpperCase().max(20, 'Code cannot exceed 20 characters.').optional();
const nameSchema = (label) => z.string().trim().min(1, `${label} is required.`).max(100, `${label} cannot exceed 100 characters.`);
const uuidSchema = (label) => z.string().uuid({ message: `Invalid ${label} ID.` });

// --------------------------------------------------
// Pagination / Search Query
// --------------------------------------------------
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional(),
});

// --------------------------------------------------
// Organization
// --------------------------------------------------
export const createOrganizationSchema = z.object({
  name: nameSchema('Organization name'),
  isActive: z.boolean().optional().default(true),
});

export const updateOrganizationSchema = z.object({
  name: nameSchema('Organization name').optional(),
  isActive: z.boolean().optional(),
});


// --------------------------------------------------
// Branch
// --------------------------------------------------
export const createBranchSchema = z.object({
  departmentId: uuidSchema('Department'),
  territoryId: uuidSchema('Territory'),
  name: nameSchema('Branch name'),
  code: codeSchema,

  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone cannot exceed 20 characters.").optional(),
  address: z.string().trim().max(255, "Address cannot exceed 255 characters.").optional(),
  city: z.string().trim().max(100, "City cannot exceed 100 characters.").optional(),
  state: z.string().trim().max(100, "State cannot exceed 100 characters.").optional(),
  country: z.string().trim().max(100, "Country cannot exceed 100 characters.").optional(),
  postalCode: z.string().trim().max(20, "Postal Code cannot exceed 20 characters.").optional(),
  warehouseIds: z.array(uuidSchema('Warehouse')).optional(),
});

export const updateBranchSchema = z.object({
  departmentId: uuidSchema('Department').optional(),
  territoryId: uuidSchema('Territory').optional(),
  name: nameSchema('Branch name').optional(),
  code: codeSchema,

  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  warehouseIds: z.array(uuidSchema('Warehouse')).optional(),
});

// --------------------------------------------------
// Department
// --------------------------------------------------
export const createDepartmentSchema = z.object({
  name: nameSchema('Department name'),
  code: codeSchema,
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateDepartmentSchema = z.object({
  name: nameSchema('Department name').optional(),
  code: codeSchema,
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

// --------------------------------------------------
// Territory
// --------------------------------------------------
export const createTerritorySchema = z.object({
  departmentId: uuidSchema('Department'),
  name: nameSchema('Territory name'),
  code: codeSchema,
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateTerritorySchema = z.object({
  departmentId: uuidSchema('Department').optional(),
  name: nameSchema('Territory name').optional(),
  code: codeSchema,
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

// --------------------------------------------------
// ID Param
// --------------------------------------------------
export const idParamSchema = z.object({
  id: uuidSchema('Resource'),
});
