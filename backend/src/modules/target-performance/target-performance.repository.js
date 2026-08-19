import { prisma } from '../../config/database.js';

export class TargetPerformanceRepository {
  async getTargets(organizationId, { userId, teamId, metric, period, status }) {
    return prisma.target.findMany({
      where: {
        organizationId,
        ...(userId && { userId }),
        ...(teamId && { teamId }),
        ...(metric && { metric }),
        ...(period && { period }),
        ...(status && { status }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { endDate: 'desc' },
    });
  }

  async incrementTargetAchievement(organizationId, userId, metric, incrementValue) {
    const today = new Date();
    
    // Find active targets for this user and metric covering today
    const targets = await prisma.target.findMany({
      where: {
        organizationId,
        userId,
        metric,
        status: 'ACTIVE',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    if (targets.length === 0) return null;

    // Increment all applicable targets (e.g. monthly and yearly simultaneously)
    const updates = targets.map((t) =>
      prisma.target.update({
        where: { id: t.id },
        data: { achievedValue: { increment: incrementValue } },
      })
    );

    return prisma.$transaction(updates);
  }

  async createTarget(organizationId, data) {
    return prisma.target.create({
      data: {
        organizationId,
        userId: data.userId,
        teamId: data.teamId,
        metric: data.metric,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        targetValue: data.targetValue,
      },
    });
  }

  async getLeaderboard(organizationId, metric) {
    // Basic leaderboard: Top users by achievedValue for active targets
    return prisma.target.findMany({
      where: {
        organizationId,
        metric,
        status: 'ACTIVE',
        userId: { not: null },
      },
      orderBy: { achievedValue: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getCompanyOverview(organizationId, userContext = null) {
    const isSuperAdmin = !userContext || userContext.roles?.some(r => typeof r === 'string' ? r.toLowerCase().includes('super admin') : r.role?.name?.toLowerCase().includes('super admin'));
    const userBranchId = userContext?.branchId;

    const branchFilter = (!isSuperAdmin && userBranchId) ? { id: userBranchId } : {};
    const orderBranchFilter = (!isSuperAdmin && userBranchId) ? { owner: { branchId: userBranchId } } : {};
    const userBranchFilter = (!isSuperAdmin && userBranchId) ? { branchId: userBranchId } : {};

    const [targets, orders, branches, users, visits, tasks] = await Promise.all([
      prisma.target.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, branchId: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          organizationId,
          isDeleted: false,
          ...orderBranchFilter,
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, branchId: true } },
          items: { include: { product: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      prisma.branch.findMany({
        where: {
          organizationId,
          ...branchFilter,
        },
      }),
      prisma.user.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...userBranchFilter,
        },
        include: {
          roles: { include: { role: true } },
          branch: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.visit.findMany({
        where: { organizationId },
        select: { id: true, userId: true, status: true, scheduledAt: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { organizationId },
        select: { id: true, assignedToId: true, status: true, dueDate: true, createdAt: true },
      }),
    ]);

    return { targets, orders, branches, users, visits, tasks };
  }
}
