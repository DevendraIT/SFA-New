import { z } from 'zod';
import { 
  USER_VALIDATION, 
  DEFAULT_PAGINATION, 
  SORT_OPTIONS, 
  USER_STATUS, 
  USER_TYPES,
  QUERY_FILTERS 
} from '../constants/user.constants.js';

const uuidSchema = (label) => z.string().uuid(`Invalid ${label} ID.`);

const passwordSchema = z
  .string()
  .min(USER_VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters.`)
  .max(USER_VALIDATION.PASSWORD_MAX_LENGTH, `Password cannot exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters.`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character.');

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGINATION.PAGE),
  limit: z.coerce.number().int().min(1).max(DEFAULT_PAGINATION.MAX_LIMIT).default(DEFAULT_PAGINATION.LIMIT),
  search: z.string().trim().min(USER_VALIDATION.SEARCH_MIN_LENGTH, `Search must be at least ${USER_VALIDATION.SEARCH_MIN_LENGTH} characters.`).optional(),
  sortBy: z.enum(SORT_OPTIONS.FIELDS).default(DEFAULT_PAGINATION.SORT_BY),
  sortOrder: z.enum(SORT_OPTIONS.ORDERS).default(DEFAULT_PAGINATION.SORT_ORDER),
  isActive: z.enum(QUERY_FILTERS.BOOLEAN_OPTIONS).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  status: z.enum(Object.values(USER_STATUS)).optional(),
  // type: z.enum(Object.values(USER_TYPES)).optional(),
  branchId: uuidSchema('Branch').optional(),
  departmentId: uuidSchema('Department').optional(),
  teamId: uuidSchema('Team').optional(),
  territoryId: uuidSchema('Territory').optional(),
});

export const createUserSchema = z.object({
  firstName: z.string().trim().min(USER_VALIDATION.FIRST_NAME_MIN_LENGTH, 'First name is required.').max(USER_VALIDATION.FIRST_NAME_MAX_LENGTH),
  lastName: z.string().trim().min(USER_VALIDATION.LAST_NAME_MIN_LENGTH, 'Last name is required.').max(USER_VALIDATION.LAST_NAME_MAX_LENGTH),
  email: z.string().trim().toLowerCase().email('Invalid email address.').max(USER_VALIDATION.EMAIL_MAX_LENGTH, `Email cannot exceed ${USER_VALIDATION.EMAIL_MAX_LENGTH} characters.`),
  password: passwordSchema,
  phoneNumber: z.string().trim().max(USER_VALIDATION.PHONE_MAX_LENGTH).optional(),
  // type: z.enum(Object.values(USER_TYPES)).default(USER_TYPES.INTERNAL),
  branchId: uuidSchema('Branch').optional(),
  departmentId: uuidSchema('Department').optional(),
  teamId: uuidSchema('Team').optional(),
  territoryId: uuidSchema('Territory').optional(),
  managerId: uuidSchema('Manager').optional(),
  roleIds: z.array(uuidSchema('Role')).min(USER_VALIDATION.ROLE_MIN_COUNT, 'At least one role must be assigned.'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(USER_VALIDATION.FIRST_NAME_MIN_LENGTH).max(USER_VALIDATION.FIRST_NAME_MAX_LENGTH).optional(),
  lastName: z.string().trim().min(USER_VALIDATION.LAST_NAME_MIN_LENGTH).max(USER_VALIDATION.LAST_NAME_MAX_LENGTH).optional(),
  phoneNumber: z.string().trim().max(USER_VALIDATION.PHONE_MAX_LENGTH).optional().nullable(),
  // type: z.enum(Object.values(USER_TYPES)).optional(),
  branchId: uuidSchema('Branch').optional().nullable(),
  departmentId: uuidSchema('Department').optional().nullable(),
  teamId: uuidSchema('Team').optional().nullable(),
  territoryId: uuidSchema('Territory').optional().nullable(),
  managerId: uuidSchema('Manager').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateUserRolesSchema = z.object({
  roleIds: z.array(uuidSchema('Role')).min(USER_VALIDATION.ROLE_MIN_COUNT, 'At least one role must be assigned.'),
});

export const idParamSchema = z.object({
  id: uuidSchema('User'),
});
