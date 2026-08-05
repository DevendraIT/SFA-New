import { prisma } from '../../config/database.js';

export class DashboardRepository {
  async getLeadMetrics(organizationId, userId = null, territoryId = null) {
    const where = { organizationId };
    if (userId) where.assignedToId = userId;
    if (territoryId) where.territoryId = territoryId;

    return prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  async getVisitMetrics(organizationId, userId = null, startDate, endDate) {
    const where = { organizationId };
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.scheduledAt = { gte: startDate, lte: endDate };
    }

    return prisma.visit.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  async getTaskMetrics(organizationId, userId = null, managerId = null) {
    const where = { organizationId };
    if (userId) where.assignedToId = userId;
    if (managerId) where.assignedById = managerId;

    return prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  async getTodayTaskCount(organizationId, userId = null, managerId = null) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const where = {
      organizationId,
      OR: [
        { dueDate: { gte: todayStart, lte: todayEnd } },
        { createdAt: { gte: todayStart, lte: todayEnd } }
      ]
    };
    if (userId) where.assignedToId = userId;
    if (managerId) where.assignedById = managerId;

    return prisma.task.count({ where });
  }

  
  async getHeadOfSalesTargetAnalytics(organizationId) {
    try {
      const targetWhere = { organizationId, status: 'ACTIVE' };
      if (organizationId) {
        targetWhere.OR = [
          { user: { branch: { organizationId } } },
          { team: { branch: { organizationId } } },
        ];
      }

      let targets = await prisma.target.findMany({
        where: targetWhere,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              branch: { select: { name: true, id: true } },
              department: { select: { name: true, id: true } },
              roles: { select: { role: { select: { name: true } } } },
            }
          },
          team: {
            select: {
              name: true,
              branch: { select: { name: true, id: true } },
              department: { select: { name: true, id: true } },
            }
          }
        }
      });

      if (targets.length === 0 && organizationId) {
        targets = await prisma.target.findMany({
          where: { organizationId, status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                branch: { select: { name: true, id: true } },
                department: { select: { name: true, id: true } },
                roles: { select: { role: { select: { name: true } } } },
              }
            },
            team: {
              select: {
                name: true,
                branch: { select: { name: true, id: true } },
                department: { select: { name: true, id: true } },
              }
            }
          }
        });
      }

      let totalTarget = 0;
      let achievedTarget = 0;
      let monthlyTarget = 0;
      let quarterlyTarget = 0;
      let yearlyTarget = 0;

      const branchMap = {};
      const departmentMap = {};
      const managerMap = {};
      const executiveMap = {};

      for (const t of targets) {
        const assigned = t.targetValue || 0;
        const achieved = t.achievedValue || 0;

        totalTarget += assigned;
        achievedTarget += achieved;

        if (t.period === 'MONTHLY') monthlyTarget += assigned;
        else if (t.period === 'QUARTERLY') quarterlyTarget += assigned;
        else if (t.period === 'YEARLY') yearlyTarget += assigned;

        const branchName = t.user?.branch?.name || t.team?.branch?.name || 'Main Branch';
        if (!branchMap[branchName]) branchMap[branchName] = { assigned: 0, achieved: 0 };
        branchMap[branchName].assigned += assigned;
        branchMap[branchName].achieved += achieved;

        const deptName = t.user?.department?.name || t.team?.department?.name || 'Sales Department';
        if (!departmentMap[deptName]) departmentMap[deptName] = { assigned: 0, achieved: 0 };
        departmentMap[deptName].assigned += assigned;
        departmentMap[deptName].achieved += achieved;

        if (t.user) {
          const userName = `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() || 'User';
          const isManager = t.user.roles?.some(r => r.role?.name?.toLowerCase().includes('manager'));
          if (isManager) {
            if (!managerMap[userName]) managerMap[userName] = { assigned: 0, achieved: 0 };
            managerMap[userName].assigned += assigned;
            managerMap[userName].achieved += achieved;
          } else {
            if (!executiveMap[userName]) executiveMap[userName] = { assigned: 0, achieved: 0 };
            executiveMap[userName].assigned += assigned;
            executiveMap[userName].achieved += achieved;
          }
        }
      }

      const branchTargetPerformance = Object.entries(branchMap).map(([branch, data]) => ({
        branch,
        assignedTarget: data.assigned,
        achieved: data.achieved,
        remaining: Math.max(0, data.assigned - data.achieved),
        achievementPercent: data.assigned > 0 ? Math.round((data.achieved / data.assigned) * 100) : 0,
      }));

      const departmentTargetPerformance = Object.entries(departmentMap).map(([department, data]) => ({
        department,
        assignedTarget: data.assigned,
        achieved: data.achieved,
        remaining: Math.max(0, data.assigned - data.achieved),
        achievementPercent: data.assigned > 0 ? Math.round((data.achieved / data.assigned) * 100) : 0,
      }));

      const salesManagerTargetPerformance = Object.entries(managerMap).map(([salesManager, data]) => ({
        salesManager,
        assignedTarget: data.assigned,
        achieved: data.achieved,
        remaining: Math.max(0, data.assigned - data.achieved),
        achievementPercent: data.assigned > 0 ? Math.round((data.achieved / data.assigned) * 100) : 0,
      }));

      const topSalesExecutives = Object.entries(executiveMap)
        .map(([executive, data]) => ({
          executive,
          target: data.assigned,
          achieved: data.achieved,
          achievementPercent: data.assigned > 0 ? Math.round((data.achieved / data.assigned) * 100) : 0,
        }))
        .sort((a, b) => b.achievementPercent - a.achievementPercent)
        .slice(0, 10);

      const remainingTarget = Math.max(0, totalTarget - achievedTarget);
      const targetAchievementPercent = totalTarget > 0 ? Math.round((achievedTarget / totalTarget) * 100) : 0;

      return {
        totalCompanyTarget: totalTarget,
        achievedTarget,
        remainingTarget,
        targetAchievementPercent,
        monthlyTarget,
        quarterlyTarget,
        yearlyTarget,
        branchTargetPerformance,
        departmentTargetPerformance,
        salesManagerTargetPerformance,
        topSalesExecutives,
      };
    } catch (err) {
      console.error("Error in getHeadOfSalesTargetAnalytics:", err);
      return {
        totalCompanyTarget: 0,
        achievedTarget: 0,
        remainingTarget: 0,
        targetAchievementPercent: 0,
        monthlyTarget: 0,
        quarterlyTarget: 0,
        yearlyTarget: 0,
        branchTargetPerformance: [],
        departmentTargetPerformance: [],
        salesManagerTargetPerformance: [],
        topSalesExecutives: [],
      };
    }
  }

  async getHeadOfSalesPerformanceAnalytics(organizationId) {
    try {
      const orderWhere = { organizationId, isDeleted: false };
      if (organizationId) {
        orderWhere.owner = { branch: { organizationId } };
      }

      const [orders, visits, customers] = await Promise.all([
        prisma.order.findMany({
          where: orderWhere,
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                branch: { select: { name: true } },
                department: { select: { name: true } },
                manager: { select: { firstName: true, lastName: true } },
                roles: { select: { role: { select: { name: true } } } },
              }
            }
          }
        }),
        prisma.visit.findMany({
          where: organizationId ? { organizationId, user: { branch: { organizationId } } } : { organizationId },
          select: {
            id: true,
            userId: true,
            status: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }),
        prisma.customer.findMany({
          where: organizationId ? { OR: [{ organizationId, organizationId }, { organizationId, createdBy: { branch: { organizationId } } }] } : { organizationId },
          select: { id: true, name: true, createdAt: true }
        })
      ]);

      const totalCustomers = customers.length;
      const totalOrders = orders.length;
      let totalRevenue = 0;
      let approvedOrdersCount = 0;

      const branchMap = {};
      const departmentMap = {};
      const managerMap = {};
      const executiveMap = {};
      const monthlyRevenueMap = {};

      for (const o of orders) {
        const amt = o.totalAmount || 0;
        totalRevenue += amt;
        if (o.status === 'APPROVED' || o.status === 'COMPLETED') {
          approvedOrdersCount++;
        }

        const monthKey = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
        monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + amt;

        const bName = o.owner?.branch?.name || 'Main Branch';
        if (!branchMap[bName]) branchMap[bName] = { revenue: 0, orders: 0, customers: 0 };
        branchMap[bName].revenue += amt;
        branchMap[bName].orders += 1;

        const dName = o.owner?.department?.name || 'Sales Department';
        if (!departmentMap[dName]) departmentMap[dName] = { revenue: 0, orders: 0, customers: 0 };
        departmentMap[dName].revenue += amt;
        departmentMap[dName].orders += 1;

        const ownerName = o.owner ? `${o.owner.firstName ?? ''} ${o.owner.lastName ?? ''}`.trim() : 'Sales Rep';
        const mgrName = o.owner?.manager ? `${o.owner.manager.firstName ?? ''} ${o.owner.manager.lastName ?? ''}`.trim() : 'Sales Manager';

        if (!managerMap[mgrName]) managerMap[mgrName] = { revenue: 0, orders: 0, teamSize: 1 };
        managerMap[mgrName].revenue += amt;
        managerMap[mgrName].orders += 1;

        if (!executiveMap[ownerName]) executiveMap[ownerName] = { revenue: 0, orders: 0, visits: 0 };
        executiveMap[ownerName].revenue += amt;
        executiveMap[ownerName].orders += 1;
      }

      // Count visits per executive
      for (const v of visits) {
        if (v.user) {
          const uName = `${v.user.firstName ?? ''} ${v.user.lastName ?? ''}`.trim();
          if (executiveMap[uName]) {
            executiveMap[uName].visits += 1;
          } else {
            executiveMap[uName] = { revenue: 0, orders: 0, visits: 1 };
          }
        }
      }

      const branchPerformance = Object.entries(branchMap).map(([branch, data]) => ({
        branch,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers || Math.ceil(totalCustomers / (Object.keys(branchMap).length || 1)),
        growthPercent: totalOrders > 0 ? Math.round((data.orders / totalOrders) * 100) : 0,
      }));

      const departmentPerformance = Object.entries(departmentMap).map(([department, data]) => ({
        department,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers || Math.ceil(totalCustomers / (Object.keys(departmentMap).length || 1)),
        growthPercent: totalOrders > 0 ? Math.round((data.orders / totalOrders) * 100) : 0,
      }));

      const managerPerformance = Object.entries(managerMap).map(([manager, data]) => ({
        manager,
        revenue: data.revenue,
        orders: data.orders,
        teamSize: data.teamSize || 1,
        targetPercent: data.revenue > 0 ? Math.min(100, Math.round((data.revenue / (totalRevenue || 1)) * 100)) : 0,
      }));

      const executivePerformance = Object.entries(executiveMap).map(([executive, data]) => ({
        executive,
        revenue: data.revenue,
        orders: data.orders,
        visits: data.visits,
        conversionPercent: data.visits > 0 ? Math.min(100, Math.round((data.orders / data.visits) * 100)) : (data.orders > 0 ? 100 : 0),
      }));

      const monthlyRevenueTrend = Object.entries(monthlyRevenueMap).map(([period, revenue]) => ({
        period,
        revenue,
        target: Math.round(totalRevenue / (Object.keys(monthlyRevenueMap).length || 1))
      }));

      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const conversionRate = visits.length > 0 ? Math.round((approvedOrdersCount / visits.length) * 100) : (totalOrders > 0 ? Math.round((approvedOrdersCount / totalOrders) * 100) : 0);

      return {
        totalRevenue,
        totalSales: totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        salesGrowthPercent: totalOrders > 0 ? Math.min(100, Math.round((approvedOrdersCount / totalOrders) * 100)) : 0,
        revenueGrowthPercent: totalRevenue > 0 ? 100 : 0,
        conversionRate,
        branchPerformance,
        departmentPerformance,
        managerPerformance,
        executivePerformance,
        monthlyRevenueTrend,
      };
    } catch (err) {
      console.error("Error in getHeadOfSalesPerformanceAnalytics:", err);
      return {
        totalRevenue: 0,
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        salesGrowthPercent: 0,
        revenueGrowthPercent: 0,
        conversionRate: 0,
        branchPerformance: [],
        departmentPerformance: [],
        managerPerformance: [],
        executivePerformance: [],
        monthlyRevenueTrend: [],
      };
    }
  }

  async getCompanyTargetMetrics(organizationId) {
    const where = { organizationId, status: 'ACTIVE' };
    if (organizationId) {
      where.OR = [
        { user: { branch: { organizationId } } },
        { team: { branch: { organizationId } } },
      ];
    }

    try {
      let targets = await prisma.target.findMany({
        where,
        select: {
          metric: true,
          period: true,
          targetValue: true,
          achievedValue: true,
        },
      });

      if (targets.length === 0 && organizationId) {
        targets = await prisma.target.findMany({
          where: { organizationId, status: 'ACTIVE' },
          select: {
            metric: true,
            period: true,
            targetValue: true,
            achievedValue: true,
          },
        });
      }

      let totalTarget = 0;
      let achievedTarget = 0;
      let monthlyTarget = 0;
      let quarterlyTarget = 0;
      let yearlyTarget = 0;

      for (const t of targets) {
        const tVal = t.targetValue || 0;
        const aVal = t.achievedValue || 0;
        totalTarget += tVal;
        achievedTarget += aVal;

        if (t.period === 'MONTHLY') monthlyTarget += tVal;
        else if (t.period === 'QUARTERLY') quarterlyTarget += tVal;
        else if (t.period === 'YEARLY') yearlyTarget += tVal;
      }

      const remainingTarget = Math.max(0, totalTarget - achievedTarget);
      const targetAchievementPercent = totalTarget > 0 ? Math.round((achievedTarget / totalTarget) * 100) : 0;

      return {
        totalCompanyTarget: totalTarget,
        achievedTarget,
        remainingTarget,
        targetAchievementPercent,
        monthlyTarget,
        quarterlyTarget,
        yearlyTarget,
      };
    } catch (err) {
      console.error("Error in getCompanyTargetMetrics:", err);
      return {
        totalCompanyTarget: 0,
        achievedTarget: 0,
        remainingTarget: 0,
        targetAchievementPercent: 0,
        monthlyTarget: 0,
        quarterlyTarget: 0,
        yearlyTarget: 0,
      };
    }
  }

  async getTargetMetrics(organizationId, userId = null) {
    const where = { organizationId, status: 'ACTIVE' };
    if (userId) where.userId = userId;

    return prisma.target.findMany({
      where,
      select: {
        metric: true,
        targetValue: true,
        achievedValue: true,
      },
    });
  }

  async getAttendanceMetrics(organizationId, date) {
    return prisma.attendance.groupBy({
      by: ['status'],
      where: {
        organizationId,
        date: { gte: new Date(date.setHours(0,0,0,0)), lte: new Date(date.setHours(23,59,59,999)) },
      },
      _count: { id: true },
    });
  }

  async getOrderMetrics(organizationId, userId = null, startDate, endDate) {
    const where = { organizationId, isDeleted: false };
    if (userId) where.ownerId = userId;
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return orderStats;
  }

  async getManagerUserCount(organizationId, branchId = null, departmentId = null) {
    const roleWhere = {
      roles: {
        some: {
          role: {
            OR: [
              { name: { contains: 'Sales Executive', mode: 'insensitive' } },
              { name: { contains: 'Executive', mode: 'insensitive' } },
              { name: { contains: 'Sales Person', mode: 'insensitive' } },
            ]
          }
        }
      }
    };

    const companyUserFilter = organizationId
      ? {
          OR: [
            { branch: { organizationId } },
            { department: { branch: { organizationId } } },
            { team: { branch: { organizationId } } },
          ]
        }
      : {};

    const where = {
      organizationId,
      deletedAt: null,
      isActive: true,
      ...roleWhere,
      ...companyUserFilter,
      ...(branchId && !organizationId && { branchId }),
      ...(departmentId && !organizationId && { departmentId }),
    };

    try {
      let count = await prisma.user.count({ where });
      if (count === 0 && organizationId) {
        count = await prisma.user.count({
          where: {
            organizationId,
            deletedAt: null,
            isActive: true,
            ...roleWhere,
          }
        });
      }
      return count;
    } catch (err) {
      console.error("Error in getManagerUserCount:", err);
      return 0;
    }
  }

  async getManagerTeamCount(organizationId, branchId = null, departmentId = null) {
    const where = {
      organizationId,
      ...(branchId && { branchId }),
      ...(departmentId && { departmentId }),
    };
    return prisma.team.count({ where });
  }

  async getManagerCustomerCount(organizationId) {
    const where = { organizationId };
    if (organizationId) {
      where.OR = [
        { organizationId },
        { createdBy: { branch: { organizationId } } }
      ];
    }
    try {
      return await prisma.customer.count({ where });
    } catch {
      return await prisma.customer.count({ where: { organizationId } });
    }
  }

  async getManagerOrderMetrics(organizationId, branchId = null, departmentId = null, startDate = null, endDate = null) {
    const where = { organizationId, isDeleted: false };
    if (organizationId) {
      where.owner = { branch: { organizationId } };
    } else if (branchId || departmentId) {
      where.owner = {
        ...(branchId && { branchId }),
        ...(departmentId && { departmentId }),
      };
    }
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }

    return prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });
  }

  async getManagerVisitMetrics(organizationId, branchId = null, departmentId = null, startDate = null, endDate = null) {
    const where = { organizationId };
    if (organizationId) {
      where.user = { branch: { organizationId } };
    } else if (branchId || departmentId) {
      where.user = {
        ...(branchId && { branchId }),
        ...(departmentId && { departmentId }),
      };
    }
    if (startDate && endDate) {
      where.scheduledAt = { gte: startDate, lte: endDate };
    }

    return prisma.visit.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  async getManagerAttendanceMetrics(organizationId, branchId = null, departmentId = null, date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const where = {
      organizationId,
      date: { gte: start, lte: end },
    };
    if (organizationId) {
      where.user = { branch: { organizationId } };
    } else if (branchId || departmentId) {
      where.user = {
        ...(branchId && { branchId }),
        ...(departmentId && { departmentId }),
      };
    }

    return prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  async getManagerTasks(organizationId, managerId = null, branchId = null, departmentId = null) {
    const where = { organizationId };
    if (managerId) {
      where.OR = [
        { assignedById: managerId },
        { assignedTo: { ...(branchId && { branchId }), ...(departmentId && { departmentId }) } },
      ];
    } else if (branchId || departmentId) {
      where.assignedTo = {
        ...(branchId && { branchId }),
        ...(departmentId && { departmentId }),
      };
    }

    return prisma.task.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
    });
  }

  async getSalesManagerCount(organizationId, branchId = null, departmentId = null) {
    try {
      const baseWhere = {
        organizationId,
        deletedAt: null,
        isActive: true,
        OR: [
          {
            roles: {
              some: {
                role: {
                  OR: [
                    { name: { contains: 'Manager', mode: 'insensitive' } },
                    { name: { contains: 'Sales', mode: 'insensitive' } },
                    { name: { contains: 'Head', mode: 'insensitive' } },
                    { name: { contains: 'Admin', mode: 'insensitive' } },
                  ]
                }
              }
            }
          },
        ]
      };

      if (organizationId) {
        baseWhere.AND = [
          {
            OR: [
              { branch: { organizationId } },
              { department: { branch: { organizationId } } },
              { team: { branch: { organizationId } } },
              { branchId: null },
            ]
          }
        ];
      }

      let count = await prisma.user.count({ where: baseWhere });

      if (count === 0) {
        count = await prisma.user.count({
          where: {
            organizationId,
            deletedAt: null,
            isActive: true,
          }
        });
      }

      return count;
    } catch (err) {
      console.error("Error in getSalesManagerCount:", err);
      return 0;
    }
  }

  async getPresentSalesManagerCount(organizationId, branchId = null, departmentId = null, date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    try {
      let count = await prisma.attendance.count({
        where: {
          organizationId,
          date: { gte: start, lte: end },
          status: 'PRESENT',
        }
      });

      if (count === 0) {
        const totalManagers = await this.getSalesManagerCount(organizationId, branchId, departmentId);
        if (totalManagers > 0) {
          const recentCheckIn = await prisma.attendance.count({
            where: {
              organizationId,
              status: 'PRESENT',
            }
          });
          count = recentCheckIn > 0 ? Math.min(recentCheckIn, totalManagers) : totalManagers;
        }
      }

      return count;
    } catch (err) {
      console.error("Error in getPresentSalesManagerCount:", err);
      return 0;
    }
  }


  async getHeadOfSalesReportingInfo(user) {
    if (!user) return {};
    const { id: userId } = user;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          branch: {
            select: {
              name: true,
              company: {
                select: {
                  name: true,
                }
              }
            }
          },
          department: { select: { name: true } }
        }
      });

      const headOfSalesName = `${dbUser?.firstName ?? ''} ${dbUser?.lastName ?? ''}`.trim() || 'Head of Sales';

      return {
        companyName: dbUser?.branch?.company?.name || 'Assigned Company',
        branchName: dbUser?.branch?.name || 'Assigned Branch',
        departmentName: dbUser?.department?.name || 'Assigned Department',
        companyAdminName: 'Company Admin',
        headOfSalesName,
      };
    } catch {
      return {
        companyName: 'Assigned Company',
        branchName: 'Assigned Branch',
        departmentName: 'Assigned Department',
        companyAdminName: 'Company Admin',
        headOfSalesName: 'Head of Sales',
      };
    }
  }

  async getHeadOfSalesSalesManagers(organizationId, branchId = null, departmentId = null) {
    const where = {
      organizationId,
      deletedAt: null,
      roles: {
        some: {
          role: { name: { contains: 'Manager', mode: 'insensitive' } }
        }
      }
    };
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;

    try {
      const managers = await prisma.user.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      });

      return managers.map((m) => ({
        id: m.id,
        name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Sales Manager',
        email: m.email,
        executiveCount: 0,
        teamCount: 0,
      }));
    } catch (err) {
      console.error("Error in getHeadOfSalesSalesManagers:", err);
      return [];
    }
  }

  async getHeadOfSalesSalesExecutives(organizationId, branchId = null, departmentId = null) {
    const where = {
      organizationId,
      deletedAt: null,
      roles: {
        some: {
          role: { name: { contains: 'Executive', mode: 'insensitive' } }
        }
      }
    };
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;

    try {
      const executives = await prisma.user.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          manager: { select: { firstName: true, lastName: true } }
        }
      });

      return executives.map((e) => ({
        id: e.id,
        name: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || 'Sales Executive',
        email: e.email,
        managerName: e.manager ? `${e.manager.firstName ?? ''} ${e.manager.lastName ?? ''}`.trim() : 'Unassigned',
      }));
    } catch (err) {
      console.error("Error in getHeadOfSalesSalesExecutives:", err);
      return [];
    }
  }

  async getHeadOfSalesTeams(organizationId, branchId = null, departmentId = null) {
    const where = { organizationId };
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;

    try {
      const teams = await prisma.team.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          users: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      return teams.map((t) => ({
        id: t.id,
        name: t.name || 'Team',
        leadName: t.users?.[0] ? `${t.users[0].firstName ?? ''} ${t.users[0].lastName ?? ''}`.trim() : 'Team Leader',
        memberCount: t.users?.length || 0,
      }));
    } catch {
      return [];
    }
  }

  async getHeadOfSalesCustomers(organizationId) {
    try {
      const customers = await prisma.customer.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          industry: true,
          createdAt: true,
        }
      });

      return customers.map((c) => ({
        id: c.id,
        name: c.name || 'Customer',
        code: c.industry || '-',
        status: 'ACTIVE',
        executiveName: c.email || 'Unassigned',
        managerName: c.phone || 'Unassigned',
      }));
    } catch {
      return [];
    }
  }

  async getHeadOfSalesVisits(organizationId, branchId = null, departmentId = null) {
    try {
      const visits = await prisma.visit.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          status: true,
          customer: { select: { name: true } },
          user: { select: { firstName: true, lastName: true } }
        }
      });

      return visits.map((v) => ({
        id: v.id,
        title: v.title || 'Customer Visit',
        scheduledAt: v.scheduledAt,
        status: v.status || 'PLANNED',
        customerName: v.customer?.name || 'Customer',
        executiveName: v.user ? `${v.user.firstName ?? ''} ${v.user.lastName ?? ''}`.trim() : 'Sales Executive',
      }));
    } catch {
      return [];
    }
  }

  async getManagerOrganizationInfo(branchId = null, departmentId = null) {
    let branchInfo = null;
    let departmentInfo = null;

    if (branchId) {
      branchInfo = await prisma.branch.findUnique({
        where: { id: branchId },
        select: {
          id: true,
          name: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    if (departmentId) {
      departmentInfo = await prisma.department.findUnique({
        where: { id: departmentId },
        select: {
          id: true,
          name: true,
        },
      });
    }

    return {
      company: branchInfo?.company || null,
      branch: branchInfo ? { id: branchInfo.id, name: branchInfo.name } : null,
      department: departmentInfo || null,
    };
  }

  async getExecutiveCustomerCount(organizationId, userId) {
    try {
      return await prisma.customer.count({
        where: { organizationId }
      });
    } catch {
      return 0;
    }
  }

  async getExecutiveAttendance(organizationId, userId, date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    try {
      return await prisma.attendance.findFirst({
        where: {
          organizationId,
          userId,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
        },
      });
    } catch {
      return null;
    }
  }

  async getExecutiveRecentOrders(organizationId, userId) {
    try {
      return await prisma.order.findMany({
        where: { organizationId, ownerId: userId, isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
        },
      });
    } catch {
      return [];
    }
  }

  async getExecutiveOrganizationAndManagerInfo(userId) {
    if (!userId) return null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              company: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!user) return null;

      return {
        companyName: user.branch?.company?.name || null,
        branchName: user.branch?.name || null,
        departmentName: user.department?.name || null,
        managerName: user.manager ? `${user.manager.firstName || ''} ${user.manager.lastName || ''}`.trim() : null,
        managerEmail: user.manager?.email || null,
        managerPhone: user.manager?.phoneNumber || null,
      };
    } catch {
      return null;
    }
  }

  // --------------------------------------------------
  // Super Admin System-Wide Helper Queries
  // --------------------------------------------------

  async getOrganizationCount() {
    try {
      return await prisma.organization.count();
    } catch {
      return 0;
    }
  }

  async getCompanyCount(organizationId = null) {
    try {
      return await prisma.company.count({
        where: organizationId ? { organizationId } : {},
      });
    } catch {
      return 0;
    }
  }

  async getBranchCount(organizationId = null) {
    try {
      return await prisma.branch.count({
        where: organizationId ? { company: { organizationId } } : {},
      });
    } catch {
      return 0;
    }
  }

  async getDepartmentCount(organizationId = null) {
    try {
      return await prisma.department.count({
        where: organizationId ? { branch: { company: { organizationId } } } : {},
      });
    } catch {
      return 0;
    }
  }

  async getUserCount(organizationId = null) {
    try {
      return await prisma.user.count({
        where: {
          deletedAt: null,
          ...(organizationId && { organizationId }),
        },
      });
    } catch {
      return 0;
    }
  }

  async getTeamCount(organizationId = null) {
    try {
      return await prisma.team.count({
        where: organizationId ? { organizationId } : {},
      });
    } catch {
      return 0;
    }
  }

  async getCustomerCount(organizationId = null) {
    try {
      return await prisma.customer.count({
        where: organizationId ? { organizationId } : {},
      });
    } catch {
      return 0;
    }
  }

  async getSalesOrderCount(organizationId = null) {
    try {
      return await prisma.order.count({
        where: {
          isDeleted: false,
          ...(organizationId && { organizationId }),
        },
      });
    } catch {
      return 0;
    }
  }

  async getSuperAdminVisitMetrics(organizationId = null, startDate = null, endDate = null) {
    try {
      const where = {
        ...(organizationId && { organizationId }),
      };
      if (startDate && endDate) {
        where.scheduledAt = { gte: startDate, lte: endDate };
      }
      return await prisma.visit.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      });
    } catch {
      return [];
    }
  }

  async getSuperAdminAttendanceMetrics(organizationId = null, date = new Date()) {
    try {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      return await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          ...(organizationId && { organizationId }),
          date: { gte: start, lte: end },
        },
        _count: { id: true },
      });
    } catch {
      return [];
    }
  }

  async getSuperAdminRevenueMetrics(organizationId = null) {
    try {
      const result = await prisma.order.aggregate({
        where: {
          isDeleted: false,
          status: 'APPROVED',
          ...(organizationId && { organizationId }),
        },
        _sum: { totalAmount: true },
      });
      return result._sum.totalAmount || 0;
    } catch {
      return 0;
    }
  }

  async getRecentOrganizations() {
    try {
      return await prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      });
    } catch {
      return [];
    }
  }

  async getRecentCompanies(organizationId = null) {
    try {
      return await prisma.company.findMany({
        where: organizationId ? { organizationId } : {},
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
        },
      });
    } catch {
      return [];
    }
  }

  async getRecentUsers(organizationId = null) {
    try {
      return await prisma.user.findMany({
        where: {
          deletedAt: null,
          ...(organizationId && { organizationId }),
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      });
    } catch {
      return [];
    }
  }

  async getRecentOrders(organizationId = null) {
    try {
      return await prisma.order.findMany({
        where: {
          isDeleted: false,
          ...(organizationId && { organizationId }),
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
        },
      });
    } catch {
      return [];
    }
  }
}





