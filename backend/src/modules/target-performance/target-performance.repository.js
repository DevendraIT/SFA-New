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

  async getCompanyOverview(organizationId) {
    const [targets, orders, teams, users, visits] = await Promise.all([
      prisma.target.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: { organizationId, isDeleted: false },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.team.findMany({
        where: { organizationId },
        include: {
          users: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.user.findMany({
        where: { organizationId, deletedAt: null },
        include: {
          roles: { include: { role: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.visit.findMany({
        where: { organizationId },
        select: { id: true, userId: true, status: true },
      }),
    ]);

    return { targets, orders, teams, users, visits };
  }
}
