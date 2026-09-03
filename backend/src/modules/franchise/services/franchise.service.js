import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/database.js';
import config from '../../../config/env.js';
import { AppError } from '../../../shared/response.js';
import { seedOrganizationRoles } from '../../roles/utils/seedOrganizationRoles.js';
import { ENTERPRISE_ROLES } from '../../roles/constants/role.constants.js';

export class FranchiseService {
  /**
   * Authenticate a Franchise Admin
   */
  async authenticateFranchise(email, password) {
    if (!email || !password) {
      throw AppError.badRequest('Email and password are required');
    }

    const franchise = await prisma.franchise.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!franchise) {
      throw AppError.unauthorized('Invalid franchise credentials');
    }

    if (!franchise.isActive) {
      throw AppError.forbidden('Franchise account is inactive. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, franchise.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid franchise credentials');
    }

    const payload = {
      franchiseId: franchise.id,
      email: franchise.email,
      roleName: ENTERPRISE_ROLES.FRANCHISE_ADMIN,
      isFranchiseAdmin: true,
    };

    const token = jwt.sign(payload, config.JWT.secret, {
      expiresIn: config.JWT.expiresIn || '24h',
    });

    return {
      token,
      franchise: {
        id: franchise.id,
        name: franchise.name,
        code: franchise.code,
        contactName: franchise.contactName,
        email: franchise.email,
        phone: franchise.phone,
      },
      user: {
        id: franchise.id,
        email: franchise.email,
        firstName: franchise.contactName || 'Franchise',
        lastName: 'Admin',
        role: ENTERPRISE_ROLES.FRANCHISE_ADMIN,
        roles: [{ role: { name: ENTERPRISE_ROLES.FRANCHISE_ADMIN } }],
      },
    };
  }

  /**
   * Provision a new Organization along with its initial Super Admin
   */
  async provisionOrganizationAndSuperAdmin({ franchiseId, organizationData, superAdminData }) {
    if (!organizationData?.name?.trim()) {
      throw AppError.badRequest('Organization name is required');
    }

    if (!superAdminData?.email?.trim()) {
      throw AppError.badRequest('Super Admin email is required');
    }

    if (!superAdminData?.password?.trim() || superAdminData.password.trim().length < 6) {
      throw AppError.badRequest('Super Admin password is required and must be at least 6 characters');
    }

    const orgName = organizationData.name.trim();
    const adminEmail = superAdminData.email.trim().toLowerCase();

    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { name: orgName },
    });
    if (existingOrg) {
      throw AppError.badRequest(`Organization with name "${orgName}" already exists.`);
    }

    // Generate slug
    const baseSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug || 'org';
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Check if super admin email already exists anywhere
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });
    if (existingUser) {
      throw AppError.badRequest(`User with email "${adminEmail}" already exists in the system.`);
    }

    // Hash super admin password
    const passwordHash = await bcrypt.hash(superAdminData.password.trim(), 10);

    // 1. Create Organization
    const organization = await prisma.organization.create({
      data: {
        franchiseId: franchiseId || null,
        name: orgName,
        slug,
        email: organizationData.email?.trim() || adminEmail,
        phone: organizationData.phone?.trim() || superAdminData.phoneNumber?.trim() || null,
        address: organizationData.address?.trim() || null,
        city: organizationData.city?.trim() || null,
        state: organizationData.state?.trim() || null,
        country: organizationData.country?.trim() || 'India',
        postalCode: organizationData.postalCode?.trim() || null,
        gstNumber: organizationData.gstNumber?.trim() || null,
        panNumber: organizationData.panNumber?.trim() || null,
        isActive: true,
      },
    });

    // 2. Auto-seed standard roles and permissions for this organization
    const rolesMap = await seedOrganizationRoles(organization.id);
    const superAdminRole = rolesMap[ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN];

    if (!superAdminRole) {
      throw AppError.internal('Failed to generate Organization Super Admin role for new organization.');
    }

    // 3. Create Super Admin User
    const superAdmin = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: adminEmail,
        passwordHash,
        firstName: superAdminData.firstName?.trim() || 'Super',
        lastName: superAdminData.lastName?.trim() || 'Admin',
        phoneNumber: superAdminData.phoneNumber?.trim() || null,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    });

    // 4. Assign Organization Super Admin Role
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    });

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        email: organization.email,
        phone: organization.phone,
        city: organization.city,
        state: organization.state,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
      },
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN,
      },
    };
  }

  /**
   * List all organizations belonging to a franchise
   */
  async getOrganizationsByFranchise(franchiseId) {
    let whereClause = {};
    if (franchiseId) {
      const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
      const isMaster = franchise?.code === 'IT360-FRAN-001';
      whereClause = isMaster
        ? {
            OR: [{ franchiseId }, { franchiseId: null }],
          }
        : { franchiseId };
    }

    const orgs = await prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            branches: true,
          },
        },
        users: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      city: org.city,
      state: org.state,
      isActive: org.isActive,
      createdAt: org.createdAt,
      totalUsers: org._count.users,
      totalBranches: org._count.branches,
      superAdmin: org.users[0] || null,
    }));
  }

  /**
   * Get franchise dashboard metrics
   */
  async getFranchiseMetrics(franchiseId) {
    let whereClause = {};
    if (franchiseId) {
      const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
      const isMaster = franchise?.code === 'IT360-FRAN-001';
      whereClause = isMaster
        ? {
            OR: [{ franchiseId }, { franchiseId: null }],
          }
        : { franchiseId };
    }

    const [totalOrganizations, activeOrganizations, totalUsers] = await Promise.all([
      prisma.organization.count({ where: whereClause }),
      prisma.organization.count({ where: { ...whereClause, isActive: true } }),
      prisma.user.count({
        where: whereClause.OR
          ? {
              OR: [
                { organization: { franchiseId } },
                { organization: { franchiseId: null } },
              ],
            }
          : franchiseId
          ? { organization: { franchiseId } }
          : {},
      }),
    ]);

    return {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
    };
  }

  /**
   * Generate SSO token for an organization's Super Admin (for IT360 seamless jump)
   */
  async generateSuperAdminSsoToken(franchiseId, organizationId) {
    const whereClause = franchiseId
      ? { id: organizationId, franchiseId }
      : { id: organizationId };

    const organization = await prisma.organization.findFirst({
      where: whereClause,
      include: {
        users: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!organization || !organization.users[0]) {
      throw AppError.notFound('Organization or Super Admin not found');
    }

    const superAdmin = organization.users[0];
    const role = superAdmin.roles[0]?.role;

    const accessPayload = {
      userId: superAdmin.id,
      organizationId: organization.id,
      roleId: role?.id || null,
      roleName: role?.name || ENTERPRISE_ROLES.ORGANIZATION_SUPER_ADMIN,
      permissions: superAdmin.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.slug)
      ),
    };

    const token = jwt.sign(accessPayload, config.JWT.secret, {
      expiresIn: config.JWT.expiresIn || '24h',
    });

    return {
      ssoToken: token,
      organization: {
        id: organization.id,
        name: organization.name,
      },
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
      },
    };
  }

  /**
   * Update an existing organization
   */
  async updateOrganization(franchiseId, organizationId, data) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw AppError.notFound('Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name?.trim() || org.name,
        email: data.email !== undefined ? data.email?.trim() || null : org.email,
        phone: data.phone !== undefined ? data.phone?.trim() || null : org.phone,
        address: data.address !== undefined ? data.address?.trim() || null : org.address,
        city: data.city !== undefined ? data.city?.trim() || null : org.city,
        state: data.state !== undefined ? data.state?.trim() || null : org.state,
        country: data.country !== undefined ? data.country?.trim() || 'India' : org.country,
        postalCode: data.postalCode !== undefined ? data.postalCode?.trim() || null : org.postalCode,
        gstNumber: data.gstNumber !== undefined ? data.gstNumber?.trim() || null : org.gstNumber,
        panNumber: data.panNumber !== undefined ? data.panNumber?.trim() || null : org.panNumber,
        isActive: data.isActive !== undefined ? !!data.isActive : org.isActive,
      },
    });

    return updated;
  }

  /**
   * Delete an organization and cascade delete all associated data
   */
  async deleteOrganization(franchiseId, organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw AppError.notFound('Organization not found');
    }

    // Direct cascade delete removes the organization and all its children
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return { id: organizationId, name: org.name, success: true };
  }

  /**
   * Get Franchise profile
   */
  async getFranchiseProfile(franchiseId) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: {
        id: true,
        name: true,
        code: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!franchise) {
      throw AppError.notFound('Franchise profile not found');
    }

    return franchise;
  }

  /**
   * Update Franchise profile
   */
  async updateFranchiseProfile(franchiseId, { name, contactName, phone }) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      throw AppError.notFound('Franchise not found');
    }

    const updated = await prisma.franchise.update({
      where: { id: franchiseId },
      data: {
        name: name?.trim() || franchise.name,
        contactName: contactName !== undefined ? contactName?.trim() || null : franchise.contactName,
        phone: phone !== undefined ? phone?.trim() || null : franchise.phone,
      },
      select: {
        id: true,
        name: true,
        code: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Change Franchise Admin password
   */
  async changeFranchisePassword(franchiseId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw AppError.badRequest('New password must be at least 6 characters');
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      throw AppError.notFound('Franchise not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, franchise.passwordHash);
    if (!isMatch) {
      throw AppError.badRequest('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.franchise.update({
      where: { id: franchiseId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password updated successfully' };
  }
}

export const franchiseService = new FranchiseService();
