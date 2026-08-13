import { prisma } from '../../../config/database.js';

/**
 * Users Repository
 * All Prisma queries for User management and Reporting Hierarchy
 */
export class UserRepository {

  // Standard user select fields (no sensitive fields like passwordHash)
  #userSelect = {
    id: true,
    organizationId: true,
    branchId: true,
    departmentId: true,
    teamId: true,
    territoryId: true,
    managerId: true,
    email: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    isActive: true,
    emailVerifiedAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  };

  #userIncludes = {
    branch: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    team: { select: { id: true, name: true } },
    territory: { select: { id: true, name: true } },
    manager: { select: { id: true, firstName: true, lastName: true, email: true } },
    roles: {
      include: { role: { select: { id: true, name: true, description: true } } },
    },
  };

  // Build where clause for user queries
  #buildWhereClause(organizationId, { isActive, branchId, departmentId, teamId, territoryId, search } = {}) {
    return {
      organizationId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(branchId && { branchId }),
      ...(departmentId && { departmentId }),
      ...(teamId && { teamId }),
      ...(territoryId && { territoryId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  async findUsers(organizationId, { skip, take, search, sortBy, sortOrder, isActive, branchId, departmentId, teamId, territoryId }) {
    const where = this.#buildWhereClause(organizationId, { isActive, branchId, departmentId, teamId, territoryId, search });

    const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];
    const resolvedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [resolvedSortBy]: sortOrder },
        select: {
          ...this.#userSelect,
          ...this.#userIncludes,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findUserById(id, organizationId) {
    return prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: {
        ...this.#userSelect,
        ...this.#userIncludes,
        _count: { select: { subordinates: true } },
      },
    });
  }

  async findUserByEmail(email, organizationId) {
    return prisma.user.findUnique({
      where: { organizationId_email: { organizationId, email } },
      select: { id: true, deletedAt: true },
    });
  }

  async createUser(userData, authData, roleIds) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { ...userData, ...authData } });

      if (roleIds?.length) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: user.id, roleId })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          ...this.#userSelect,
          roles: { include: { role: { select: { id: true, name: true } } } },
        },
      });
    });
  }

  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        ...this.#userSelect,
        ...this.#userIncludes,
      },
    });
  }

  async updateUserRoles(userId, roleIds) {
    return prisma.$transaction(async (tx) => {
      // Remove all existing role assignments
      await tx.userRole.deleteMany({ where: { userId } });

      // Assign new roles
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
        skipDuplicates: true,
      });
    });
  }

  async softDeleteUser(id) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async activateUser(id) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: this.#userSelect,
    });
  }

  async deactivateUser(id) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.#userSelect,
    });
  }

  // --------------------------------------------------
  // Reporting Hierarchy (via Prisma raw CTE)
  // --------------------------------------------------

  /**
   * Recursively fetch all subordinates of a given user using a PostgreSQL CTE
   * Returns flat list with depth level for each node
   */
  async findSubordinatesRecursive(userId) {
    const managerUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });

    const managerBranchId = managerUser?.branchId || null;

    const result = await prisma.$queryRaw`
      WITH RECURSIVE subordinates AS (
        SELECT
          id, "firstName", "lastName", email, "managerId", "isActive", "branchId", "teamId", 0 AS depth
        FROM "User"
        WHERE ("managerId" = ${userId}::uuid
               OR (${managerBranchId}::uuid IS NOT NULL AND "branchId" = ${managerBranchId}::uuid AND id != ${userId}::uuid))
          AND "deletedAt" IS NULL

        UNION ALL

        SELECT
          u.id, u."firstName", u."lastName", u.email, u."managerId", u."isActive", u."branchId", u."teamId", s.depth + 1
        FROM "User" u
        INNER JOIN subordinates s ON u."managerId" = s.id
        WHERE u."deletedAt" IS NULL
      )
      SELECT DISTINCT ON (id) id, "firstName", "lastName", email, "managerId", "isActive", "branchId", "teamId", depth
      FROM subordinates
      ORDER BY id, depth, "lastName", "firstName"
    `;
    return result;
  }

  /**
   * Recursively fetch the full manager chain (upward hierarchy) for a given user
   */
  async findManagerHierarchy(userId) {
    const result = await prisma.$queryRaw`
      WITH RECURSIVE manager_chain AS (
        SELECT
          id, "firstName", "lastName", email, "managerId", 0 AS level
        FROM "User"
        WHERE id = ${userId}::uuid
          AND "deletedAt" IS NULL

        UNION ALL

        SELECT
          u.id, u."firstName", u."lastName", u.email, u."managerId", mc.level + 1
        FROM "User" u
        INNER JOIN manager_chain mc ON u.id = mc."managerId"
        WHERE u."deletedAt" IS NULL
      )
      SELECT * FROM manager_chain ORDER BY level DESC
    `;
    return result;
  }

  // --------------------------------------------------
  // Existence Checks
  // --------------------------------------------------

  async findRolesByIds(roleIds, organizationId) {
    return prisma.role.findMany({
      where: { id: { in: roleIds }, organizationId },
      select: { id: true, name: true },
    });
  }

  async branchBelongsToOrg(branchId, organizationId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, organizationId },
      select: { id: true },
    });
    return !!branch;
  }

  async departmentBelongsToOrg(departmentId, organizationId) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, organizationId },
      select: { id: true },
    });
    return !!department;
  }

  async teamBelongsToOrg(teamId, organizationId) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: { id: true },
    });
    return !!team;
  }

  async territoryBelongsToOrg(territoryId, organizationId) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, organizationId },
      select: { id: true },
    });
    return !!territory;
  }

  // --------------------------------------------------
  // Bulk Operations
  // --------------------------------------------------

  async findUsersByIds(userIds, organizationId) {
    return prisma.user.findMany({
      where: { id: { in: userIds }, organizationId, deletedAt: null },
      select: {
        ...this.#userSelect,
        roles: { include: { role: { select: { id: true, name: true } } } },
      },
    });
  }

  async bulkUpdateUsers(userIds, data) {
    return prisma.user.updateMany({
      where: { id: { in: userIds } },
      data,
    });
  }

  // --------------------------------------------------
  // Active Records Check (for deletion prevention)
  // --------------------------------------------------

  async countActiveLeadsByUser(userId) {
    try {
      return prisma.lead.count({
        where: { assignedToId: userId, deletedAt: null, isConverted: false },
      });
    } catch {
      return 0;
    }
  }

  async countActiveSalesOrdersByUser(userId) {
    try {
      return prisma.salesOrder?.count?.({
        where: { createdById: userId },
      }) || 0;
    } catch {
      return 0;
    }
  }

  async countActiveTasksByUser(userId) {
    try {
      return prisma.task?.count?.({
        where: { assignedToId: userId, completedAt: null },
      }) || 0;
    } catch {
      return 0;
    }
  }
}
