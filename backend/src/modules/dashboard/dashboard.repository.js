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
    const where = {
      organizationId,
      deletedAt: null,
      ...(branchId && { branchId }),
      ...(departmentId && { departmentId }),
    };
    return prisma.user.count({ where });
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
    return prisma.customer.count({ where: { organizationId } });
  }

  async getManagerOrderMetrics(organizationId, branchId = null, departmentId = null, startDate = null, endDate = null) {
    const where = { organizationId, isDeleted: false };
    if (branchId || departmentId) {
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
    if (branchId || departmentId) {
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
    if (branchId || departmentId) {
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
    const where = {
      organizationId,
      isDeleted: false,
      userRoles: {
        some: {
          role: {
            name: { contains: 'Sales Manager', mode: 'insensitive' }
          }
        }
      }
    };
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;
    try {
      return await prisma.user.count({ where });
    } catch {
      return 0;
    }
  }

  async getPresentSalesManagerCount(organizationId, branchId = null, departmentId = null, date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const userWhere = {
      organizationId,
      isDeleted: false,
      userRoles: {
        some: {
          role: { name: { contains: 'Sales Manager', mode: 'insensitive' } }
        }
      }
    };
    if (branchId) userWhere.branchId = branchId;
    if (departmentId) userWhere.departmentId = departmentId;

    try {
      return await prisma.attendance.count({
        where: {
          organizationId,
          date: { gte: start, lte: end },
          status: 'PRESENT',
          user: userWhere,
        }
      });
    } catch {
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
                  users: {
                    where: {
                      userRoles: {
                        some: {
                          role: {
                            name: { contains: 'Company Admin', mode: 'insensitive' }
                          }
                        }
                      }
                    },
                    take: 1,
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          },
          department: { select: { name: true } }
        }
      });

      const companyAdmin = dbUser?.branch?.company?.users?.[0];
      const companyAdminName = companyAdmin ? `${companyAdmin.firstName ?? ''} ${companyAdmin.lastName ?? ''}`.trim() : 'Company Admin';
      const headOfSalesName = `${dbUser?.firstName ?? ''} ${dbUser?.lastName ?? ''}`.trim() || 'Head of Sales';

      return {
        companyName: dbUser?.branch?.company?.name || 'Assigned Company',
        branchName: dbUser?.branch?.name || 'Assigned Branch',
        departmentName: dbUser?.department?.name || 'Assigned Department',
        companyAdminName,
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
      isDeleted: false,
      userRoles: {
        some: {
          role: { name: { contains: 'Sales Manager', mode: 'insensitive' } }
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
          subordinates: { select: { id: true } },
          managedTeams: { select: { id: true } }
        }
      });

      return managers.map((m) => ({
        id: m.id,
        name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Sales Manager',
        email: m.email,
        executiveCount: m.subordinates?.length || 0,
        teamCount: m.managedTeams?.length || 0,
      }));
    } catch {
      return [];
    }
  }

  async getHeadOfSalesSalesExecutives(organizationId, branchId = null, departmentId = null) {
    const where = {
      organizationId,
      isDeleted: false,
      userRoles: {
        some: {
          role: { name: { contains: 'Sales Executive', mode: 'insensitive' } }
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
    } catch {
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
          leader: { select: { firstName: true, lastName: true } },
          members: { select: { id: true } }
        }
      });

      return teams.map((t) => ({
        id: t.id,
        name: t.name || 'Team',
        leadName: t.leader ? `${t.leader.firstName ?? ''} ${t.leader.lastName ?? ''}`.trim() : 'No Leader',
        memberCount: t.members?.length || 0,
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
          code: true,
          status: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              manager: { select: { firstName: true, lastName: true } }
            }
          }
        }
      });

      return customers.map((c) => ({
        id: c.id,
        name: c.name || 'Customer',
        code: c.code || '-',
        status: c.status || 'ACTIVE',
        executiveName: c.owner ? `${c.owner.firstName ?? ''} ${c.owner.lastName ?? ''}`.trim() : 'Unassigned',
        managerName: c.owner?.manager ? `${c.owner.manager.firstName ?? ''} ${c.owner.manager.lastName ?? ''}`.trim() : 'Unassigned',
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
          code: true,
          company: {
            select: {
              id: true,
              name: true,
              code: true,
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
          code: true,
        },
      });
    }

    return {
      company: branchInfo?.company || null,
      branch: branchInfo ? { id: branchInfo.id, name: branchInfo.name, code: branchInfo.code } : null,
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
          checkInTime: true,
          checkOutTime: true,
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
          code: true,
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
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              userRoles: { select: { role: { select: { name: true } } } },
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  async getOrganizationPerformanceMetrics(organizationId = null) {
    try {
      const users = await prisma.user.findMany({
        where: {
          deletedAt: null,
          ...(organizationId && { organizationId }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userRoles: {
            select: {
              role: {
                select: { name: true },
              },
            },
          },
          targets: {
            where: { status: 'ACTIVE' },
            select: {
              targetValue: true,
              achievedValue: true,
              metric: true,
            },
          },
          orders: {
            where: { isDeleted: false, status: { in: ['APPROVED', 'COMPLETED', 'DELIVERED'] } },
            select: {
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map((u) => {
        const roleName = u.userRoles?.[0]?.role?.name || 'Sales User';
        const assignedTarget = u.targets?.reduce((sum, t) => sum + (t.targetValue || 0), 0) || 0;
        const orderSales = u.orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
        const targetAchieved = u.targets?.reduce((sum, t) => sum + (t.achievedValue || 0), 0) || 0;
        const achievedSales = orderSales > 0 ? orderSales : targetAchieved;

        const targetVal = assignedTarget > 0 ? assignedTarget : (achievedSales > 0 ? achievedSales : 100000);
        const achievementPercentage = targetVal > 0 ? Math.round((achievedSales / targetVal) * 100) : 0;
        const pendingTarget = Math.max(0, targetVal - achievedSales);

        let performanceStatus = 'AT_RISK';
        if (achievementPercentage >= 100) performanceStatus = 'EXCELLENT';
        else if (achievementPercentage >= 75) performanceStatus = 'ON_TRACK';
        else if (achievementPercentage >= 50) performanceStatus = 'NEEDS_ATTENTION';

        return {
          id: u.id,
          employeeName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Employee',
          email: u.email,
          role: roleName,
          assignedTarget: targetVal,
          achievedSales,
          achievementPercentage,
          pendingTarget,
          performanceStatus,
        };
      });
    } catch (err) {
      console.error("Error in getOrganizationPerformanceMetrics:", err);
      return [];
    }
  }
}






