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

  async getOrganizationAnalytics(organizationId, userContext = null) {
    const isSuperAdmin = !userContext || userContext.roles?.some(r => typeof r === 'string' ? r.toLowerCase().includes('super admin') : r.role?.name?.toLowerCase().includes('super admin'));
    const userBranchId = userContext?.branchId;

    const branchFilter = (!isSuperAdmin && userBranchId) ? { id: userBranchId } : {};
    const orderBranchFilter = (!isSuperAdmin && userBranchId) ? { owner: { branchId: userBranchId } } : {};
    const userBranchFilter = (!isSuperAdmin && userBranchId) ? { branchId: userBranchId } : {};
    const taskBranchFilter = (!isSuperAdmin && userBranchId) ? { assignedTo: { branchId: userBranchId } } : {};

    const [orders, products, customers, targets, visits, branches, users, warehouses, stocks, tasks, dars, attendance] = await Promise.all([
      prisma.order.findMany({
        where: {
          organizationId,
          isDeleted: false,
          ...orderBranchFilter,
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, branchId: true, branch: { select: { id: true, name: true } } } },
          customer: { select: { id: true, name: true, industry: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { organizationId },
        include: {
          stocks: { include: { warehouse: { select: { id: true, name: true, branches: { select: { id: true, name: true } } } } } },
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
          user: { select: { id: true, firstName: true, lastName: true, branchId: true } },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.branch.findMany({
        where: {
          organizationId,
          ...branchFilter,
        },
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
          warehouses: { select: { id: true, name: true, code: true } },
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
      prisma.warehouse.findMany({
        where: { organizationId },
        include: {
          warehouseManager: { select: { id: true, firstName: true, lastName: true, email: true } },
          stocks: { include: { product: { select: { id: true, name: true, sku: true } } } },
          branches: { select: { id: true, name: true } },
          productIssues: { select: { id: true, status: true, quantity: true } },
        },
      }),
      prisma.stock.findMany({
        where: { organizationId },
        include: {
          product: { select: { id: true, name: true, sku: true, category: true, price: true } },
          warehouse: { select: { id: true, name: true, code: true, branches: { select: { id: true, name: true } } } },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          ...taskBranchFilter,
        },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, branchId: true, branch: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dailyActivityReport.findMany({
        where: { organizationId },
      }).catch(() => []),
      prisma.attendance.findMany({
        where: { organizationId },
      }).catch(() => []),
    ]);

    return { orders, products, customers, targets, visits, branches, users, warehouses, stocks, tasks, dars, attendance };
  }
}
