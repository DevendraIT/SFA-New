/**
 * Central RBAC Permission Definitions
 * All permission slugs used across the application
 */

export const PERMISSIONS = {
  // Organization Management
  ORGANIZATION: {
    READ: 'read:organization',
    CREATE: 'create:organization',
    UPDATE: 'update:organization',
    DELETE: 'delete:organization',
  },

  // Company Management
  // COMPANIES: {
  //   READ: 'read:companies',
  //   CREATE: 'create:company',
  //   UPDATE: 'update:company',
  //   DELETE: 'delete:company',
  // },

  // Branch Management
  BRANCHES: {
    READ: 'read:branches',
    CREATE: 'create:branch',
    UPDATE: 'update:branch',
    DELETE: 'delete:branch',
  },

  // Department Management
  DEPARTMENTS: {
    READ: 'read:departments',
    CREATE: 'create:department',
    UPDATE: 'update:department',
    DELETE: 'delete:department',
  },

  // Territory Management
  TERRITORIES: {
    READ: 'read:territories',
    CREATE: 'create:territory',
    UPDATE: 'update:territory',
    DELETE: 'delete:territory',
  },

  // User Management
  USERS: {
    READ: 'read:users',
    CREATE: 'create:user',
    UPDATE: 'update:user',
    DELETE: 'delete:user',
    ACTIVATE: 'activate:user',
    DEACTIVATE: 'deactivate:user',
  },

  // Role Management
  ROLES: {
    READ: 'read:roles',
    CREATE: 'create:role',
    UPDATE: 'update:role',
    DELETE: 'delete:role',
  },

  // Permission Management
  PERMISSIONS: {
    READ: 'read:permissions',
    ASSIGN: 'assign:permissions',
  },

  // Lead Management
  LEADS: {
    READ: 'read:leads',
    CREATE: 'create:lead',
    UPDATE: 'update:lead',
    DELETE: 'delete:lead',
    ASSIGN: 'assign:lead',
    CONVERT: 'convert:lead',
    EXPORT: 'export:leads',
    IMPORT: 'import:leads',
  },

  // Contact Management
  CONTACTS: {
    READ: 'read:contacts',
    CREATE: 'create:contact',
    UPDATE: 'update:contact',
    DELETE: 'delete:contact',
  },

  // Opportunity Management
  OPPORTUNITIES: {
    READ: 'read:opportunities',
    CREATE: 'create:opportunity',
    UPDATE: 'update:opportunity',
    DELETE: 'delete:opportunity',
  },

  // Quotation Management
  QUOTATIONS: {
    READ: 'read:quotations',
    CREATE: 'create:quotation',
    UPDATE: 'update:quotation',
    DELETE: 'delete:quotation',
    APPROVE: 'approve:quotation',
  },

  // Sales Order Management
  ORDERS: {
    READ: 'read:orders',
    CREATE: 'create:order',
    UPDATE: 'update:order',
    DELETE: 'delete:order',
    APPROVE: 'approve:order',
    CANCEL: 'cancel:order',
  },

  // Field Force Management
  FIELD_FORCE: {
    READ: 'read:field-force',
    CHECK_IN: 'check-in:field-force',
    CHECK_OUT: 'check-out:field-force',
    LOG_EXPENSE: 'log-expense:field-force',
    APPROVE_EXPENSE: 'approve-expense:field-force',
  },

  // Attendance Management
  ATTENDANCE: {
    READ: 'read:attendance',
    MARK: 'mark:attendance',
    APPROVE: 'approve:attendance',
  },

  // Visits Management
  VISITS: {
    READ: 'read:visits',
    CREATE: 'create:visit',
    UPDATE: 'update:visit',
    COMPLETE: 'complete:visit',
  },

  // Tasks Management
  TASKS: {
    READ: 'read:tasks',
    CREATE: 'create:task',
    UPDATE: 'update:task',
    DELETE: 'delete:task',
    COMPLETE: 'complete:task',
  },

  // Notifications
  NOTIFICATIONS: {
    READ: 'read:notifications',
    MANAGE: 'manage:notifications',
  },

  // Dashboard & Analytics
  DASHBOARD: {
    READ: 'read:dashboard',
    EXPORT: 'export:dashboard',
  },

  // Reports
  REPORTS: {
    READ: 'read:reports',
    EXPORT: 'export:reports',
    CREATE: 'create:report',
  },

  // Settings & Configuration
  SETTINGS: {
    READ: 'read:settings',
    UPDATE: 'update:settings',
    MANAGE_INTEGRATIONS: 'manage:integrations',
  },

  // CRM Integration
  CRM: {
    SYNC: 'sync:crm',
    READ: 'read:crm',
    UPDATE: 'update:crm',
  },

  // AI & Automation
  AI: {
    CONFIGURE: 'configure:ai',
    READ: 'read:ai',
  },

  // System Admin
  SYSTEM: {
    MANAGE_AUDIT_LOGS: 'manage:audit-logs',
    MANAGE_USERS: 'manage:users',
    SYSTEM_CONFIG: 'system:config',
  },
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with permissions array
 * @param {string} permission - Permission slug to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  // Fast bypass for testing when env variable is set
  if (process.env.SKIP_PERMISSION_CHECK === 'true') {
    return true;
  }
  
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions.includes(permission);
};

export default PERMISSIONS;
