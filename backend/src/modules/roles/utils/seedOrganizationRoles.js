import { prisma } from '../../../config/database.js';
import {
  ENTERPRISE_ROLES,
  ENTERPRISE_ROLE_LEVELS,
  ENTERPRISE_ROLE_HIERARCHY,
} from '../constants/role.constants.js';

const PERMISSIONS_DATA = [
  { name: 'Read Users', slug: 'read:users', moduleName: 'users' },
  { name: 'Create Users', slug: 'create:users', moduleName: 'users' },
  { name: 'Update Users', slug: 'update:users', moduleName: 'users' },
  { name: 'Delete Users', slug: 'delete:users', moduleName: 'users' },
  { name: 'Manage Sessions', slug: 'manage:sessions', moduleName: 'auth' },
  { name: 'Read Organization', slug: 'organization:read', moduleName: 'organization' },
  { name: 'Create Organization', slug: 'organization:create', moduleName: 'organization' },
  { name: 'Update Organization', slug: 'organization:update', moduleName: 'organization' },
  { name: 'Delete Organization', slug: 'organization:delete', moduleName: 'organization' },
  { name: 'Read Companies', slug: 'company:read', moduleName: 'organization' },
  { name: 'Create Company', slug: 'company:create', moduleName: 'organization' },
  { name: 'Update Company', slug: 'company:update', moduleName: 'organization' },
  { name: 'Delete Company', slug: 'company:delete', moduleName: 'organization' },
  { name: 'Read Branches', slug: 'branch:read', moduleName: 'organization' },
  { name: 'Create Branch', slug: 'branch:create', moduleName: 'organization' },
  { name: 'Update Branch', slug: 'branch:update', moduleName: 'organization' },
  { name: 'Delete Branch', slug: 'branch:delete', moduleName: 'organization' },
  { name: 'Read Departments', slug: 'department:read', moduleName: 'organization' },
  { name: 'Create Department', slug: 'department:create', moduleName: 'organization' },
  { name: 'Update Department', slug: 'department:update', moduleName: 'organization' },
  { name: 'Delete Department', slug: 'department:delete', moduleName: 'organization' },
  { name: 'Read Territories', slug: 'territory:read', moduleName: 'organization' },
  { name: 'Create Territory', slug: 'territory:create', moduleName: 'organization' },
  { name: 'Update Territory', slug: 'territory:update', moduleName: 'organization' },
  { name: 'Delete Territory', slug: 'territory:delete', moduleName: 'organization' },
  { name: 'Read Leads', slug: 'lead:read', moduleName: 'lead-management' },
  { name: 'Create Leads', slug: 'lead:create', moduleName: 'lead-management' },
  { name: 'Update Leads', slug: 'lead:update', moduleName: 'lead-management' },
  { name: 'Delete Leads', slug: 'lead:delete', moduleName: 'lead-management' },
  { name: 'Read Orders', slug: 'order:read', moduleName: 'order-management' },
  { name: 'Create Orders', slug: 'order:create', moduleName: 'order-management' },
  { name: 'Update Orders', slug: 'order:update', moduleName: 'order-management' },
  { name: 'Delete Orders', slug: 'order:delete', moduleName: 'order-management' },
  { name: 'Read Products', slug: 'read:products', moduleName: 'inventory' },
  { name: 'Create Products', slug: 'create:products', moduleName: 'inventory' },
  { name: 'Update Products', slug: 'update:products', moduleName: 'inventory' },
  { name: 'Update Basic Products', slug: 'update_basic:products', moduleName: 'inventory' },
  { name: 'Delete Products', slug: 'delete:products', moduleName: 'inventory' },
  { name: 'Read Warehouses', slug: 'read:warehouses', moduleName: 'inventory' },
  { name: 'Create Warehouses', slug: 'create:warehouses', moduleName: 'inventory' },
  { name: 'Update Warehouses', slug: 'update:warehouses', moduleName: 'inventory' },
  { name: 'Delete Warehouses', slug: 'delete:warehouses', moduleName: 'inventory' },
  { name: 'Read Stock', slug: 'read:stock', moduleName: 'inventory' },
  { name: 'Manage Stock', slug: 'manage:stock', moduleName: 'inventory' },
  { name: 'Read Product Issues', slug: 'read:product_issues', moduleName: 'inventory' },
  { name: 'Manage Product Issues', slug: 'manage:product_issues', moduleName: 'inventory' },
];

const ROLE_PERMISSION_MAP = {
  [ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN]: PERMISSIONS_DATA.map((p) => p.slug),
  [ENTERPRISE_ROLES.COMPANY_ADMIN]: [
    'organization:read',
    'company:read',
    'company:create',
    'company:update',
    'branch:read',
    'branch:create',
    'branch:update',
    'department:read',
    'department:create',
    'department:update',
    'territory:read',
    'territory:create',
    'territory:update',
    'read:users',
    'create:users',
    'update:users',
  ],
  [ENTERPRISE_ROLES.HEAD_OF_SALES]: [
    'company:read',
    'branch:read',
    'department:read',
    'territory:read',
    'lead:read',
    'lead:create',
    'lead:update',
    'order:read',
  ],
  [ENTERPRISE_ROLES.SALES_MANAGER]: [
    'company:read',
    'branch:read',
    'department:read',
    'territory:read',
    'lead:read',
    'order:read',
    'read:product_issues',
    'manage:product_issues',
  ],
  [ENTERPRISE_ROLES.SALES_EXECUTIVE]: [
    'company:read',
    'branch:read',
    'department:read',
    'territory:read',
    'lead:read',
    'lead:create',
    'order:create',
    'order:read',
  ],
  [ENTERPRISE_ROLES.INVENTORY_MANAGER]: [
    'company:read',
    'branch:read',
    'read:products',
    'create:products',
    'update:products',
    'delete:products',
    'read:warehouses',
    'create:warehouses',
    'update:warehouses',
    'delete:warehouses',
    'read:stock',
    'manage:stock',
  ],
  [ENTERPRISE_ROLES.WAREHOUSE_MANAGER]: [
    'company:read',
    'branch:read',
    'read:products',
    'read:warehouses',
    'read:stock',
    'manage:stock',
  ],
};

/**
 * Auto-seeds standard enterprise roles and assigns permissions for a newly created organization.
 * @param {string} organizationId
 * @returns {Promise<Record<string, any>>} Map of roleName -> role object
 */
export async function seedOrganizationRoles(organizationId) {
  // 1. Fetch all existing permissions in one query
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = {};
  for (const p of allPermissions) {
    permissionMap[p.slug] = p;
  }

  // 2. Create standard roles for this organization
  const rolesMap = {};
  const roleKeys = [
    'ORGANIZATION_SUPER_ADMIN',
    'COMPANY_ADMIN',
    'HEAD_OF_SALES',
    'SALES_MANAGER',
    'SALES_EXECUTIVE',
    'INVENTORY_MANAGER',
    'WAREHOUSE_MANAGER',
  ];

  for (const roleKey of roleKeys) {
    const name = ENTERPRISE_ROLES[roleKey];
    const level = ENTERPRISE_ROLE_LEVELS[roleKey];
    const parentRoleName = ENTERPRISE_ROLE_HIERARCHY[name];
    const parentRole = parentRoleName ? rolesMap[parentRoleName] : null;

    const role = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
      update: {},
      create: {
        organizationId,
        name,
        description: `Enterprise ${name} role`,
        isSystem: true,
        level,
        parentRoleId: parentRole?.id || null,
      },
    });

    rolesMap[name] = role;
  }

  // 3. Batch insert role permissions in a single call
  const rolePermissionsToCreate = [];
  for (const [roleName, permissionSlugs] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = rolesMap[roleName];
    if (!role) continue;

    for (const slug of permissionSlugs) {
      const permission = permissionMap[slug];
      if (!permission) continue;

      rolePermissionsToCreate.push({
        roleId: role.id,
        permissionId: permission.id,
      });
    }
  }

  if (rolePermissionsToCreate.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermissionsToCreate,
      skipDuplicates: true,
    });
  }

  return rolesMap;
}
