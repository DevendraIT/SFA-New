import 'dotenv/config';
import { prisma } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import {
  ENTERPRISE_ROLES,
  ENTERPRISE_ROLE_LEVELS,
  ENTERPRISE_ROLE_HIERARCHY,
} from '../src/modules/roles/constants/role.constants.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Organization Super Admin
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      isActive: true,
    },
  });

  console.log(`🏢 Organization created: ${org.name} (${org.slug})`);

  // 1b. Create Department -> Territory -> Branch
  const dept = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SALES' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Sales Department',
      code: 'SALES',
    }
  });
  console.log(`🏢 Department created: ${dept.name} (${dept.code})`);

  const terr = await prisma.territory.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'NORTH-AMERICA' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: dept.id,
      name: 'North America',
      code: 'NORTH-AMERICA',
    }
  });
  console.log(`🏢 Territory created: ${terr.name} (${terr.code})`);

  const branch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ACME-US' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: dept.id,
      territoryId: terr.id,
      name: 'Acme US Operations',
      code: 'ACME-US',
    }
  });
  console.log(`🏢 Branch created: ${branch.name} (${branch.code})`);

  // 2. Roles
  const rolesMap = {};

  for (const [roleName, level] of Object.entries(ENTERPRISE_ROLE_LEVELS)) {
    const name = ENTERPRISE_ROLES[roleName];
    const parentRoleName = ENTERPRISE_ROLE_HIERARCHY[name];
    const parentRole = parentRoleName ? rolesMap[parentRoleName] : null;

    const role = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name,
        description: `Enterprise ${name} role`,
        isSystem: true,
        level,
        parentRoleId: parentRole?.id || null,
      },
    });

    rolesMap[name] = role;
    console.log(`👑 Role created: ${name} (Level ${level})`);
  }

  // 3. Permissions
  const permissionsData = [
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
    { name: 'Export Leads', slug: 'lead:export', moduleName: 'lead-management' },
    { name: 'Read Orders', slug: 'order:read', moduleName: 'sales-order' },
    { name: 'Create Orders', slug: 'order:create', moduleName: 'sales-order' },
    { name: 'Update Orders', slug: 'order:update', moduleName: 'sales-order' },
    { name: 'Delete Orders', slug: 'order:delete', moduleName: 'sales-order' },
    { name: 'Approve Orders', slug: 'order:approve', moduleName: 'sales-order' },
    { name: 'Read Attendance', slug: 'attendance:read', moduleName: 'field-force' },
    { name: 'Check In/Out', slug: 'attendance:write', moduleName: 'field-force' },
    { name: 'Read Visits', slug: 'visit:read', moduleName: 'field-force' },
    { name: 'Manage Visits', slug: 'visit:write', moduleName: 'field-force' },
    { name: 'Read Expenses', slug: 'expense:read', moduleName: 'field-force' },
    { name: 'Log Expenses', slug: 'expense:write', moduleName: 'field-force' },
    { name: 'Approve Expenses', slug: 'expense:approve', moduleName: 'field-force' },
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
  ];

  const createdPermissions = [];
  // const adminRole = rolesMap[ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN];

  const ROLE_PERMISSION_MAP = {
    [ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN]: permissionsData.map(p => p.slug),

    [ENTERPRISE_ROLES.COMPANY_ADMIN]: [
      "organization:read",

      "company:read",
      "company:create",
      "company:update",

      "branch:read",
      "branch:create",
      "branch:update",

      "department:read",
      "department:create",
      "department:update",

      "territory:read",
      "territory:create",
      "territory:update",

      "read:users",
      "create:users",
      "update:users"
    ],

    [ENTERPRISE_ROLES.HEAD_OF_SALES]: [
      "company:read",
      "branch:read",
      "department:read",
      "territory:read",
      "lead:read",
      "lead:create",
      "lead:update",
      "order:read"
    ],

    [ENTERPRISE_ROLES.SALES_MANAGER]: [
      "company:read",
      "branch:read",
      "department:read",
      "territory:read",
      "lead:read",
      "order:read",
      "read:product_issues",
      "manage:product_issues"
    ],

    [ENTERPRISE_ROLES.SALES_EXECUTIVE]: [
      "company:read",
      "branch:read",
      "department:read",
      "territory:read",
      "lead:read",
      "lead:create",
      "order:create",
      "order:read"
    ],

    [ENTERPRISE_ROLES.INVENTORY_MANAGER]: [
      "company:read",
      "branch:read",
      "read:products",
      "create:products",
      "update:products",
      "delete:products",
      "read:warehouses",
      "create:warehouses",
      "update:warehouses",
      "delete:warehouses",
      "read:stock",
      "manage:stock"
    ]
  };


  const permissionMap = {};

  // 1. Create all permissions
  for (const permData of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { slug: permData.slug },
      update: {},
      create: permData,
    });

    createdPermissions.push(permission);
    permissionMap[permission.slug] = permission;
  }

  // 2. Assign permissions to every role
  for (const [roleName, permissionSlugs] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = rolesMap[roleName];

    if (!role) continue;

    for (const slug of permissionSlugs) {
      const permission = permissionMap[slug];

      if (!permission) {
        console.warn(`⚠ Permission not found: ${slug}`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`✅ Permissions assigned to ${role.name}`);
  }

  console.log(`🔒 Seeded ${createdPermissions.length} permissions successfully`);

  // for (const permData of permissionsData) {
  //   const permission = await prisma.permission.upsert({
  //     where: { slug: permData.slug },
  //     update: {},
  //     create: permData,
  //   });
  //   createdPermissions.push(permission);

  //   await prisma.rolePermission.upsert({
  //     where: {
  //       roleId_permissionId: {
  //         roleId: adminRole.id,
  //         permissionId: permission.id,
  //       },
  //     },
  //     update: {},
  //     create: {
  //       roleId: adminRole.id,
  //       permissionId: permission.id,
  //     },
  //   });
  // }

  // console.log(`🔒 Seeded ${createdPermissions.length} permissions and mapped to Organization Administrator`);

  // 4. Create Users (with embedded credentials)
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const usersToCreate = [
    {
      email: 'devendradangi9174@gmail.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: rolesMap[ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN],
    },
    {
      email: 'admin@sfa.com',
      firstName: 'Company',
      lastName: 'Admin',
      role: rolesMap[ENTERPRISE_ROLES.COMPANY_ADMIN],
    },
    {
      email: 'headofsales@sfa.com',
      firstName: 'Head of',
      lastName: 'Sales',
      role: rolesMap[ENTERPRISE_ROLES.HEAD_OF_SALES],
    },
    {
      email: 'manager@sfa.com',
      firstName: 'Sales',
      lastName: 'Manager',
      role: rolesMap[ENTERPRISE_ROLES.SALES_MANAGER],
    },
    {
      email: 'executive@sfa.com',
      firstName: 'Sales',
      lastName: 'Executive',
      role: rolesMap[ENTERPRISE_ROLES.SALES_EXECUTIVE],
    },
    {
      email: 'inventory.manager@example.com',
      firstName: 'Inventory',
      lastName: 'Manager',
      role: rolesMap[ENTERPRISE_ROLES.INVENTORY_MANAGER],
    }
  ];

  let managerId = null;

  for (const u of usersToCreate) {
    let user = await prisma.user.findFirst({
      where: {
        organizationId: org.id,
        email: u.email,
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, managerId },
      });
    } else {
      user = await prisma.user.create({
        data: {
          organizationId: org.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: true,
          passwordHash,
          emailVerifiedAt: new Date(),
          managerId,
        },
      });
    }

    console.log(`👤 User processed: ${user.email} with Role: ${u.role.name}`);

    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: u.role.id,
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: u.role.id,
        },
      });
    }

    // Only create password history if we created a new user to prevent spamming
    if (!user.managerId && user.email === 'devendradangi9174@gmail.com') { // simple check to avoid too many entries
      // just add it for all for now but don't error
    }

    // We'll skip password history creation here to avoid duplicate errors since we are re-running seed
    // Or we can just check if it exists
    const existingHist = await prisma.passwordHistory.findFirst({
      where: { userId: user.id }
    });
    if (!existingHist) {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });
    }

    managerId = user.id; // Next user reports to this user
  }

  console.log('🔑 Password history seeded for all users.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
