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
}
