import { prisma } from '../../config/database.js';

export class ReportsRepository {
  async getAttendanceData(organizationId, startDate, endDate) {
    return prisma.attendance.findMany({
      where: {
        organizationId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getVisitData(organizationId, startDate, endDate) {
    return prisma.visit.findMany({
      where: {
        organizationId,
        scheduledAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        lead: { select: { firstName: true, lastName: true, company: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getTargetData(organizationId, metric) {
    return prisma.target.findMany({
      where: {
        organizationId,
        ...(metric && { metric }),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getOrderData(organizationId, startDate, endDate) {
    return prisma.order.findMany({
      where: {
        organizationId,
        isDeleted: false,
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBusinessAnalytics(organizationId = null) {
    const orgWhere = organizationId ? { organizationId } : {};

    const [
      orders,
      companies,
      branches,
      teams,
      users,
      customers,
      targets,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { isDeleted: false, ...orgWhere },
        include: {
          customer: { select: { id: true, name: true, createdAt: true } },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userRoles: { select: { role: { select: { name: true } } } },
              branch: { select: { id: true, name: true, company: { select: { id: true, name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.company.findMany({
        where: orgWhere,
        include: {
          branches: { select: { id: true, name: true } },
        },
      }),
      prisma.branch.findMany({
        where: organizationId ? { company: { organizationId } } : {},
        include: {
          company: { select: { id: true, name: true } },
          users: { select: { id: true } },
        },
      }),
      prisma.team.findMany({
        where: orgWhere,
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.user.findMany({
        where: { deletedAt: null, ...orgWhere },
        include: {
          userRoles: { select: { role: { select: { name: true } } } },
        },
      }),
      prisma.customer.findMany({
        where: orgWhere,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.target.findMany({
        where: { status: 'ACTIVE', ...orgWhere },
      }),
    ]);

    return { orders, companies, branches, teams, users, customers, targets };
  }
}

