export class DashboardService {
  constructor(dashboardRepository) {
    this.repo = dashboardRepository;
  }

  async getSuperAdminDashboard(organizationId = null) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      organizationCount,
      companyCount,
      branchCount,
      departmentCount,
      userCount,
      teamCount,
      customerCount,
      salesOrderCount,
      visitMetricsAll,
      visitMetricsToday,
      attendanceMetrics,
      revenueMetrics,
      recentOrganizations,
      recentCompanies,
      recentUsers,
      recentOrders,
      orderMetrics,
    ] = await Promise.all([
      this.repo.getOrganizationCount(),
      this.repo.getCompanyCount(organizationId),
      this.repo.getBranchCount(organizationId),
      this.repo.getDepartmentCount(organizationId),
      this.repo.getUserCount(organizationId),
      this.repo.getTeamCount(organizationId),
      this.repo.getCustomerCount(organizationId),
      this.repo.getSalesOrderCount(organizationId),
      this.repo.getSuperAdminVisitMetrics(organizationId, null, null),
      this.repo.getSuperAdminVisitMetrics(organizationId, todayStart, todayEnd),
      this.repo.getSuperAdminAttendanceMetrics(organizationId, now),
      this.repo.getSuperAdminRevenueMetrics(organizationId),
      this.repo.getRecentOrganizations(),
      this.repo.getRecentCompanies(organizationId),
      this.repo.getRecentUsers(organizationId),
      this.repo.getRecentOrders(organizationId),
      this.repo.getOrderMetrics(organizationId, null, null, null),
    ]);

    const formattedAllVisits = this._formatGroupBy(visitMetricsAll, 'status');
    const formattedTodayVisits = this._formatGroupBy(visitMetricsToday, 'status');
    const formattedAttendance = this._formatGroupBy(attendanceMetrics, 'status');
    const formattedOrders = this._formatOrderGroupBy(orderMetrics, 'status');

    const completedVisits = (formattedAllVisits['COMPLETED'] || 0) + (formattedTodayVisits['COMPLETED'] || 0);
    const pendingVisits = (formattedAllVisits['PLANNED'] || 0) + (formattedTodayVisits['PLANNED'] || 0) + (formattedTodayVisits['IN_PROGRESS'] || 0);
    const todayVisitsCount = Object.values(formattedTodayVisits).reduce((a, b) => a + b, 0);
    const totalVisits = completedVisits + pendingVisits + todayVisitsCount;

    return {
      organizationOverview: {
        organizations: organizationCount,
        companies: companyCount,
        branches: branchCount,
        departments: departmentCount,
        teams: teamCount,
        users: userCount,
      },
      cards: {
        totalOrganizations: organizationCount,
        totalCompanies: companyCount,
        totalBranches: branchCount,
        totalDepartments: departmentCount,
        totalTeams: teamCount,
        totalUsers: userCount,
        totalCustomers: customerCount,
        totalSalesOrders: salesOrderCount,
        totalVisits,
        todayVisits: todayVisitsCount,
        pendingVisits,
        completedVisits,
        presentEmployees: formattedAttendance['PRESENT'] || 0,
        absentEmployees: formattedAttendance['ABSENT'] || 0,
        leaveRequests: formattedAttendance['LEAVE'] || 0,
        totalRevenue: revenueMetrics,
      },
      orders: formattedOrders,
      visitSummary: formattedAllVisits,
      attendanceToday: formattedAttendance,
      recentOrganizations,
      recentCompanies,
      recentUsers,
      recentOrders,
    };
  }

  async getExecutiveDashboard(userParam) {

    const organizationId = typeof userParam === 'object' ? userParam.organizationId : userParam;
    const userId = typeof userParam === 'object' ? userParam.id : null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      visitMetricsAll,
      visitMetricsToday,
      targetMetrics,
      orderMetrics,
      taskMetrics,
      todayTaskCount,
      customerCount,
      attendanceRecord,
      recentOrdersList,
      organizationInfo
    ] = await Promise.all([
      this.repo.getVisitMetrics(organizationId, userId, null, null),
      this.repo.getVisitMetrics(organizationId, userId, todayStart, todayEnd),
      this.repo.getTargetMetrics(organizationId, userId),
      this.repo.getOrderMetrics(organizationId, userId, firstDayOfMonth, now),
      this.repo.getTaskMetrics(organizationId, userId),
      this.repo.getTodayTaskCount(organizationId, userId),
      this.repo.getExecutiveCustomerCount(organizationId, userId),
      this.repo.getExecutiveAttendance(organizationId, userId, now),
      this.repo.getExecutiveRecentOrders(organizationId, userId),
      this.repo.getExecutiveOrganizationAndManagerInfo(userId),
    ]);

    const formattedAllVisits = this._formatGroupBy(visitMetricsAll, 'status');
    const formattedTodayVisits = this._formatGroupBy(visitMetricsToday, 'status');
    const formattedOrders = this._formatOrderGroupBy(orderMetrics, 'status');

    const completedVisits = (formattedAllVisits['COMPLETED'] || 0) + (formattedTodayVisits['COMPLETED'] || 0);
    const pendingVisits = (formattedAllVisits['PLANNED'] || 0) + (formattedTodayVisits['PLANNED'] || 0) + (formattedTodayVisits['IN_PROGRESS'] || 0);
    const todayVisitsCount = Object.values(formattedTodayVisits).reduce((a, b) => a + b, 0);

    const approvedOrders = formattedOrders['APPROVED']?.count || 0;
    const pendingOrders = (formattedOrders['PENDING']?.count || 0) + (formattedOrders['DRAFT']?.count || 0);
    const totalOrdersCount = Object.values(formattedOrders).reduce((sum, item) => sum + (item.count || 0), 0);

    return {
      todayVisits: todayVisitsCount,
      pendingVisits,
      completedVisits,
      totalAssignedCustomers: customerCount,
      totalSalesOrders: totalOrdersCount,
      approvedOrders,
      pendingOrders,
      attendanceStatus: attendanceRecord ? attendanceRecord.status : 'NOT_CHECKED_IN',
      checkInTime: attendanceRecord?.checkInTime || null,
      checkOutTime: attendanceRecord?.checkOutTime || null,
      organizationInfo,
      myVisits: formattedTodayVisits,
      myTargets: targetMetrics,
      myOrders: formattedOrders,
      myTasks: this._formatTaskSummary(taskMetrics, todayTaskCount),
      recentOrders: recentOrdersList,

      recentActivities: [
        { title: "Dashboard Accessed", description: "Personal sales dashboard loaded", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
        { title: "Today's Schedule", description: `${todayVisitsCount} visit(s) scheduled for today`, time: "Today" },
        { title: "Order Overview", description: `${approvedOrders} approved order(s) placed`, time: "Today" },
      ],
    };
  }

  async getTeamDashboard(organizationId, managerId) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [visitMetrics, targetMetrics, orderMetrics, taskMetrics, todayTaskCount] = await Promise.all([
      this.repo.getVisitMetrics(organizationId, null, firstDayOfMonth, now),
      this.repo.getTargetMetrics(organizationId),
      this.repo.getOrderMetrics(organizationId, null, firstDayOfMonth, now),
      this.repo.getTaskMetrics(organizationId, null, managerId),
      this.repo.getTodayTaskCount(organizationId, null, managerId),
    ]);

    return {
      teamVisits: this._formatGroupBy(visitMetrics, 'status'),
      teamTargets: targetMetrics,
      teamOrders: this._formatOrderGroupBy(orderMetrics, 'status'),
      teamTasks: this._formatTaskSummary(taskMetrics, todayTaskCount),
    };
  }

  async getUserDashboard(organizationId, userId) {
    return this.getExecutiveDashboard({ organizationId, id: userId });
  }


  _formatTaskSummary(data, todayCount) {
    const summary = {
      assigned: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      todaysTasks: todayCount || 0,
      byStatus: {}
    };

    for (const row of data) {
      const status = row.status;
      const count = row._count.id;
      summary.byStatus[status] = count;
      summary.assigned += count;

      if (status === 'PENDING' || status === 'ASSIGNED' || status === 'ACCEPTED') {
        summary.pending += count;
      } else if (status === 'IN_PROGRESS' || status === 'NAVIGATING' || status === 'ARRIVED' || status === 'CHECKED_IN' || status === 'DELIVERY_IN_PROGRESS' || status === 'PAYMENT_COLLECTED' || status === 'PHOTO_UPLOADED' || status === 'VISIT_NOTES_COMPLETED') {
        summary.inProgress += count;
      } else if (status === 'COMPLETED' || status === 'CHECKED_OUT') {
        summary.completed += count;
      }
    }

    return summary;
  }

  _formatGroupBy(data, key) {
    const result = {};
    for (const row of data) {
      result[row[key]] = row._count.id;
    }
    return result;
  }

  _formatOrderGroupBy(data, key) {
    const result = {};
    for (const row of data) {
      result[row[key]] = {
        count: row._count.id,
        revenue: row._sum.totalAmount || 0,
      };
    }
    return result;
  }

  async getHeadOfSalesDashboard(user) {
    const { organizationId, branchId, departmentId } = user;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalSalesManagers,
      presentSalesManagers,
      totalSalesExecutives,
      totalTeams,
      totalCustomers,
      orderMetrics,
      todayVisitMetrics,
      allVisitMetrics,
      attendanceRaw,
      targetMetrics,
      organizationInfo,
      reportingInfo,
      salesManagersList,
      salesExecutivesList,
      teamsList,
      customersList,
      recentVisitsList,
      recentOrdersList,
    ] = await Promise.all([
      this.repo.getSalesManagerCount(organizationId, branchId, departmentId),
      this.repo.getPresentSalesManagerCount(organizationId, branchId, departmentId, now),
      this.repo.getManagerUserCount(organizationId, branchId, departmentId),
      this.repo.getManagerTeamCount(organizationId, branchId, departmentId),
      this.repo.getManagerCustomerCount(organizationId),
      this.repo.getManagerOrderMetrics(organizationId, branchId, departmentId, firstDayOfMonth, now),
      this.repo.getManagerVisitMetrics(organizationId, branchId, departmentId, todayStart, todayEnd),
      this.repo.getManagerVisitMetrics(organizationId, branchId, departmentId, null, null),
      this.repo.getManagerAttendanceMetrics(organizationId, branchId, departmentId, now),
      this.repo.getTargetMetrics(organizationId),
      this.repo.getManagerOrganizationInfo(branchId, departmentId),
      this.repo.getHeadOfSalesReportingInfo(user),
      this.repo.getHeadOfSalesSalesManagers(organizationId, branchId, departmentId),
      this.repo.getHeadOfSalesSalesExecutives(organizationId, branchId, departmentId),
      this.repo.getHeadOfSalesTeams(organizationId, branchId, departmentId),
      this.repo.getHeadOfSalesCustomers(organizationId),
      this.repo.getHeadOfSalesVisits(organizationId, branchId, departmentId),
      this.repo.getRecentOrders(organizationId),
    ]);


    const formattedOrders = this._formatOrderGroupBy(orderMetrics, 'status');
    const todayVisitsFormatted = this._formatGroupBy(todayVisitMetrics, 'status');
    const allVisitsFormatted = this._formatGroupBy(allVisitMetrics, 'status');
    const attendanceFormatted = this._formatAttendance(attendanceRaw, totalSalesExecutives + totalSalesManagers);

    const completedVisits = (allVisitsFormatted['COMPLETED'] || 0) + (todayVisitsFormatted['COMPLETED'] || 0);
    const pendingVisits = (allVisitsFormatted['PLANNED'] || 0) + (todayVisitsFormatted['PLANNED'] || 0) + (todayVisitsFormatted['IN_PROGRESS'] || 0);
    const todayVisitsCount = Object.values(todayVisitsFormatted).reduce((a, b) => a + b, 0);

    const approvedOrders = formattedOrders['APPROVED']?.count || 0;
    const pendingOrders = (formattedOrders['PENDING']?.count || 0) + (formattedOrders['DRAFT']?.count || 0);
    const revenue = (formattedOrders['APPROVED']?.revenue || 0) + (formattedOrders['COMPLETED']?.revenue || 0);
    const totalSalesOrders = Object.values(formattedOrders).reduce((sum, item) => sum + (item.count || 0), 0);

    return {
      totalSalesManagers,
      presentSalesManagers,
      totalSalesExecutives,
      totalTeams,

      totalCustomers,
      totalSalesOrders,
      todayVisits: todayVisitsCount,
      pendingVisits,
      completedVisits,
      revenue,
      approvedOrders,
      pendingOrders,
      attendance: attendanceFormatted,
      organizationInfo: {
        ...organizationInfo,
        ...reportingInfo,
      },
      salesManagers: salesManagersList,
      salesExecutives: salesExecutivesList,
      teams: teamsList,
      customers: customersList,
      recentVisits: recentVisitsList,
      recentOrders: recentOrdersList,
      teamVisits: {
        COMPLETED: completedVisits,
        PENDING: pendingVisits,
        IN_PROGRESS: todayVisitsFormatted['IN_PROGRESS'] || 0,
      },
      teamTargets: targetMetrics,
      teamOrders: formattedOrders,
      recentActivities: [
        { title: "Head of Sales Control Center", description: `Scope: ${reportingInfo.companyName || 'Company'} — ${reportingInfo.branchName || 'Branch'} — ${reportingInfo.departmentName || 'Department'}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
        { title: "Reporting Structure", description: `Head of Sales: ${reportingInfo.headOfSalesName} | Reporting Admin: ${reportingInfo.companyAdminName}`, time: "Live" },
        { title: "Field Operations Active", description: `${todayVisitsCount} scheduled visits and ${totalSalesOrders} active sales orders`, time: "Today" },
      ],
    };
  }


  async getManagerDashboard(user) {

    const { organizationId, id: userId, branchId, departmentId } = user;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalSalesExecutives,
      totalTeams,
      totalCustomers,
      orderMetrics,
      todayVisitMetrics,
      allVisitMetrics,
      attendanceRaw,
      taskMetrics,
      todayTaskCount,
      recentTasks,
      targetMetrics,
      organizationInfo,
    ] = await Promise.all([
      this.repo.getManagerUserCount(organizationId, branchId, departmentId),
      this.repo.getManagerTeamCount(organizationId, branchId, departmentId),
      this.repo.getManagerCustomerCount(organizationId),
      this.repo.getManagerOrderMetrics(organizationId, branchId, departmentId, firstDayOfMonth, now),
      this.repo.getManagerVisitMetrics(organizationId, branchId, departmentId, todayStart, todayEnd),
      this.repo.getManagerVisitMetrics(organizationId, branchId, departmentId, null, null),
      this.repo.getManagerAttendanceMetrics(organizationId, branchId, departmentId, now),
      this.repo.getTaskMetrics(organizationId, null, userId),
      this.repo.getTodayTaskCount(organizationId, null, userId),
      this.repo.getManagerTasks(organizationId, userId, branchId, departmentId),
      this.repo.getTargetMetrics(organizationId),
      this.repo.getManagerOrganizationInfo(branchId, departmentId),
    ]);


    const formattedOrders = this._formatOrderGroupBy(orderMetrics, 'status');
    const todayVisitsFormatted = this._formatGroupBy(todayVisitMetrics, 'status');
    const allVisitsFormatted = this._formatGroupBy(allVisitMetrics, 'status');
    const attendanceFormatted = this._formatAttendance(attendanceRaw, totalSalesExecutives);

    const completedVisits = (allVisitsFormatted['COMPLETED'] || 0) + (todayVisitsFormatted['COMPLETED'] || 0);
    const pendingVisits = (allVisitsFormatted['PLANNED'] || 0) + (todayVisitsFormatted['PLANNED'] || 0) + (todayVisitsFormatted['IN_PROGRESS'] || 0);
    const todayVisitsCount = Object.values(todayVisitsFormatted).reduce((a, b) => a + b, 0);

    const approvedOrders = formattedOrders['APPROVED']?.count || 0;
    const pendingOrders = (formattedOrders['PENDING']?.count || 0) + (formattedOrders['DRAFT']?.count || 0);
    const revenue = (formattedOrders['APPROVED']?.revenue || 0) + (formattedOrders['COMPLETED']?.revenue || 0);
    const totalSalesOrders = Object.values(formattedOrders).reduce((sum, item) => sum + (item.count || 0), 0);

    return {
      totalSalesExecutives,
      totalTeams,
      totalCustomers,
      totalSalesOrders,
      todayVisits: todayVisitsCount,
      pendingVisits,
      completedVisits,
      revenue,
      approvedOrders,
      pendingOrders,
      attendance: attendanceFormatted,
      organizationInfo,
      teamVisits: {

        COMPLETED: completedVisits,
        PENDING: pendingVisits,
        IN_PROGRESS: todayVisitsFormatted['IN_PROGRESS'] || 0,
      },
      teamTargets: targetMetrics,
      teamOrders: formattedOrders,
      teamTasks: this._formatTaskSummary(taskMetrics, todayTaskCount),
      recentTasks,
      recentActivities: [
        { title: "Team Dashboard Access", description: `Manager accessed dashboard for scope`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
        { title: "Today's Visits Recorded", description: `${todayVisitsCount} visits scheduled/active today`, time: "Today" },
        { title: "Orders Overview", description: `${approvedOrders} approved orders generating revenue`, time: "Today" },
      ],
    };
  }

  _formatAttendance(data, totalUsers) {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfday = 0;

    for (const row of data) {
      const status = row.status;
      const count = row._count.id;
      if (status === 'PRESENT') present += count;
      else if (status === 'ABSENT') absent += count;
      else if (status === 'LEAVE') leave += count;
      else if (status === 'HALFDAY') halfday += count;
    }

    const recorded = present + absent + leave + halfday;
    if (totalUsers > recorded) {
      absent += (totalUsers - recorded);
    }
    const total = present + absent + leave + halfday;
    const rate = total > 0 ? Math.round(((present + halfday * 0.5) / total) * 100) : 100;

    return { present, absent, leave, halfday, rate };
  }

  async refreshCache(organizationId, dashboardType) {
    // In a real application, this would invalidate the Redis cache for the given dashboard type
    // and re-aggregate data in the background. For this mock, it simply logs.
    return { success: true, organizationId, dashboardType };
  }
}

