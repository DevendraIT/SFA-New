import { prisma } from '../../config/database.js';

/**
 * Team Repository
 * All Prisma queries for Team model
 */
export class TeamRepository {

  async findTeams(organizationId, { skip, take, search, sortBy, sortOrder, branchId, departmentId, territoryId }) {
    const where = {
      organizationId,
      ...(branchId && { branchId }),
      ...(departmentId && { departmentId }),
      ...(territoryId && { territoryId }),
    };

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { branch: { name: { contains: term, mode: 'insensitive' } } },
        { branch: { code: { contains: term, mode: 'insensitive' } } },
        { branch: { organization: { name: { contains: term, mode: 'insensitive' } } } },
        { department: { name: { contains: term, mode: 'insensitive' } } },
        { territory: { name: { contains: term, mode: 'insensitive' } } },
        { users: { some: { OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { roles: { some: { role: { name: { contains: term, mode: 'insensitive' } } } } }
        ] } } }
      ];
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              organization: { select: { id: true, name: true, slug: true } },
            },
          },
          department: { select: { id: true, name: true, code: true } },
          territory: { select: { id: true, name: true, code: true } },
          users: {
            where: { deletedAt: null, isActive: true },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              isActive: true,
              roles: { include: { role: { select: { name: true } } } }
            }
          },
          _count: { select: { users: true } },
        },
      }),
      prisma.team.count({ where }),
    ]);

    return { teams, total };
  }

  async findTeamById(id, organizationId, branchId = null) {
    const where = { id, organizationId };
    if (branchId) where.branchId = branchId;

    return prisma.team.findFirst({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            organization: { select: { id: true, name: true } },
          },
        },
        department: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        users: {
          where: { deletedAt: null, isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          orderBy: { firstName: 'asc' },
        },
        _count: { select: { users: true } },
      },
    });
  }

  async createTeam(data) {
    return prisma.team.create({
      data,
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
      },
    });
  }

  async updateTeam(id, data) {
    return prisma.team.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
      },
    });
  }

  async deleteTeam(id) {
    return prisma.team.delete({
      where: { id },
    });
  }

  // Existence checks
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

  async territoryBelongsToOrg(territoryId, organizationId) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, organizationId },
      select: { id: true },
    });
    return !!territory;
  }

  // --- Assignment / Hierarchy queries ---

  async findFirstUserByRole(organizationId, roleId) {
    const userRole = await prisma.userRole.findFirst({
      where: { roleId, user: { organizationId, isActive: true } },
      include: { user: { select: { id: true } } },
    });
    return userRole?.user?.id || null;
  }

  async findUsersByRole(organizationId, roleId) {
    return prisma.userRole.findMany({
      where: { roleId, user: { organizationId, isActive: true } },
      include: { user: { select: { id: true } } },
    });
  }

  async findFirstUserByTerritory(organizationId, territoryId) {
    const user = await prisma.user.findFirst({
      where: { organizationId, territoryId, isActive: true },
      select: { id: true },
    });
    return user?.id || null;
  }

  async findManagerByUserId(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { managerId: true },
    });
    return user?.managerId || null;
  }

  async findUserCountsForWorkload(organizationId, userIds) {
    const counts = await prisma.lead.groupBy({
      by: ['assignedToId'],
      where: {
        organizationId,
        assignedToId: { in: userIds },
        status: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST'] },
      },
      _count: { assignedToId: true },
    });
    return counts;
  }
}
