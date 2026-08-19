/**
 * User Module Constants
 */

// User Status Types
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

// User Types & Roles
export const USER_TYPES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  SYSTEM: 'system',
};

export const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HEAD_OF_SALES: 'Head of Sales',
  SALES_MANAGER: 'Sales Manager',
  SALES_PERSON: 'Sales Person',
};

// Reserved User Types (cannot be deleted/modified)
export const RESERVED_USER_TYPES = [
  'system',
  'admin',
  'super_admin',
];

// Validation Limits
export const USER_VALIDATION = {
  FIRST_NAME_MIN_LENGTH: 1,
  FIRST_NAME_MAX_LENGTH: 50,
  LAST_NAME_MIN_LENGTH: 1,
  LAST_NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  ROLE_MIN_COUNT: 1,
  SEARCH_MIN_LENGTH: 1,
};

// Default Values
export const DEFAULT_USER_SETTINGS = {
  EMAIL_VERIFIED: false,
  IS_ACTIVE: true,
  AUTO_VERIFY_ADMIN_CREATED: true,
  DEFAULT_STATUS: USER_STATUS.ACTIVE,
  DEFAULT_TYPE: USER_TYPES.INTERNAL,
};

// Default Pagination
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 100,
  MAX_LIMIT: 1000,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
};

// Reporting Hierarchy
export const REPORTING_HIERARCHY = {
  MAX_DEPTH: 10,
  ROOT_LEVEL: 0,
  MAX_SUBORDINATES: 50,
};

// Error Messages
export const USER_ERRORS = {
  NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'A user with this email already exists in your organization',
  CANNOT_DELETE_SELF: 'You cannot delete your own account',
  CIRCULAR_HIERARCHY: 'Circular reporting hierarchy detected',
  INVALID_MANAGER: 'Manager not found within your organization',
  SELF_MANAGER: 'A user cannot be their own manager',
  BRANCH_NOT_FOUND: 'Branch not found within your organization',
  DEPARTMENT_NOT_FOUND: 'Department not found within your organization',
  TEAM_NOT_FOUND: 'Team not found within your organization',
  TERRITORY_NOT_FOUND: 'Territory not found within your organization',
  INVALID_ROLES: 'One or more role IDs are invalid or do not belong to your organization',
};

// Sort Options
export const SORT_OPTIONS = {
  FIELDS: ['createdAt', 'firstName', 'lastName', 'email', 'isActive'],
  ORDERS: ['asc', 'desc'],
};

// Query Filters
export const QUERY_FILTERS = {
  BOOLEAN_OPTIONS: ['true', 'false'],
  STATUS_OPTIONS: Object.values(USER_STATUS),
  TYPE_OPTIONS: Object.values(USER_TYPES),
};