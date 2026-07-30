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
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        customer: { select: { id: true, name: true, industry: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrganizationAnalytics(organizationId) {
    const [orders, products, customers, targets, visits, teams, users] = await Promise.all([
      prisma.order.findMany({
        where: { organizationId, isDeleted: false },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          customer: { select: { id: true, name: true, industry: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.product.findMany({
        where: { organizationId },
        include: {
          orderItems: true,
        },
      }),
      prisma.customer.findMany({
        where: { organizationId },
        include: {
          orders: true,
          visits: true,
        },
      }),
      prisma.target.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.visit.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.team.findMany({
        where: { organizationId },
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.user.findMany({
        where: { organizationId, deletedAt: null },
        include: {
          roles: { include: { role: true } },
          team: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { orders, products, customers, targets, visits, teams, users };
  }
}
