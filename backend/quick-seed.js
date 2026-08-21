#!/usr/bin/env node
/**
 * Quick Seed Script - Creates default admin user and permissions
 * Run: node quick-seed.js
 */

import 'dotenv/config';
import { prisma } from './src/config/database.js';
import bcrypt from 'bcryptjs';
import { SYSTEM_PERMISSIONS, PERMISSION_GROUPS } from './src/modules/permissions/constants/permission.constants.js';

async function main() {
  console.log('🌱 Starting quick seed...');

  try {
    // 1. Get or create Organization
    let org = await prisma.organization.findFirst({ where: { slug: 'acme-corp' } });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
          isActive: true,
        },
      });
      console.log(`✅ Organization created: ${org.name}`);
    } else {
      console.log(`✅ Organization found: ${org.name}`);
    }

    // 2. Create All 5 Enterprise Roles
    const rolesMap = {};
    for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
      let role = await prisma.role.findFirst({
        where: { organizationId: org.id, name: group.name },
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            organizationId: org.id,
            name: group.name,
            description: group.description,
            isSystem: true,
          },
        });
        console.log(`✅ Role created: ${role.name}`);
      } else {
        console.log(`✅ Role found: ${role.name}`);
      }
      rolesMap[key] = role;
    }

    const adminRole = rolesMap['ORGANIZATION_SUPER_ADMIN'];

    // 3. Create All Permissions
    const allPermissions = Object.values(SYSTEM_PERMISSIONS).map(slug => ({
      name: slug,
      slug,
      moduleName: slug.split(':')[0]
    }));

    for (const permData of allPermissions) {
      await prisma.permission.upsert({
        where: { slug: permData.slug },
        update: {},
        create: permData,
      });
    }
    console.log(`✅ ${allPermissions.length} Permissions synced to database`);

    // 4. Map Permissions to Roles
    for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
      const role = rolesMap[key];
      for (const slug of group.permissions) {
        const permission = await prisma.permission.findUnique({ where: { slug } });
        if (permission) {
          const rolePermExists = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: { roleId: role.id, permissionId: permission.id },
            },
          });

          if (!rolePermExists) {
            await prisma.rolePermission.create({
              data: { roleId: role.id, permissionId: permission.id },
            });
          }
        }
      }
    }
    console.log(`✅ Permissions mapped to all 5 roles accurately`);

    // 4. Create Admin User
    const email = 'admin@acme-corp.com';
    const passwordHash = await bcrypt.hash('Password123!', 10);

    let user = await prisma.user.findUnique({
      where: { organizationId_email: { organizationId: org.id, email } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          organizationId: org.id,
          email,
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
        },
      });
    } else {
      console.log(`✅ Admin user found: ${user.email}`);
    }

    await prisma.authCredential.upsert({
      where: { userId: user.id },
      update: {
        passwordHash,
      },
      create: {
        userId: user.id,
        organizationId: org.id,
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ Admin auth credential ensured for: ${user.email}`);

    // 5. Assign Admin Role to User
    const userRoleExists = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    });

    if (!userRoleExists) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });
      console.log(`✅ Admin role assigned to user`);
    } else {
      console.log(`✅ Admin role already assigned`);
    }

    // 6. Create password history
    const historyExists = await prisma.passwordHistory.findFirst({
      where: { userId: user.id },
    });

    if (!historyExists) {
      await prisma.passwordHistory.create({
        data: { userId: user.id, passwordHash },
      });
    }

    console.log('\n✨ Seed completed!');
    console.log(`\n🔐 Login with:\n   Email: ${email}\n   Password: Password123!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
