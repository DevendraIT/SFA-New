import cacheService from '../../shared/cache/cache.service.js';

export class TargetPerformanceService {
  constructor(targetPerformanceRepository) {
    this.repo = targetPerformanceRepository;
  }

  _invalidate(orgId) {
    if (!orgId) return;
    cacheService.invalidatePrefixes([
      `target:list:${orgId}:`,
      `target:overview:${orgId}:`,
    ]);
  }

  async getTargets(organizationId, query) {
    const cacheKey = `target:list:${organizationId}:${JSON.stringify(query || {})}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const targets = await this.repo.getTargets(organizationId, query);
    const result = targets.map(t => {
      const achievementPercent = t.targetValue > 0 ? (t.achievedValue / t.targetValue) * 100 : 0;
      return {
        ...t,
        achievementPercent: Math.min(100, Math.round(achievementPercent * 100) / 100),
        performanceScore: this.calculatePerformanceScore(t)
      };
    });

    cacheService.set(cacheKey, result, 300);
    return result;
  }

  async createTarget(organizationId, data) {
    const target = await this.repo.createTarget(organizationId, data);
    this._invalidate(organizationId);
    return target;
  }

  async planTargets(organizationId, data) {
    let result;
    if (Array.isArray(data.targets)) {
      result = await Promise.all(data.targets.map(t => this.repo.createTarget(organizationId, t)));
    } else {
      result = await this.repo.createTarget(organizationId, data);
    }
    this._invalidate(organizationId);
    return result;
  }

  async getLeaderboard(organizationId, metric) {
    const leaders = await this.repo.getLeaderboard(organizationId, metric);
    return leaders.map(l => ({
      ...l,
      achievementPercent: l.targetValue > 0 ? Math.min(100, Math.round((l.achievedValue / l.targetValue) * 10000) / 100) : 0
    }));
  }

  async recordAchievement(organizationId, userId, metric, value = 1) {
    await this.repo.incrementTargetAchievement(organizationId, userId, metric, value);
  }

  calculatePerformanceScore(target) {
    // Basic performance score based on how close to target deadline vs achievement
    if (!target.startDate || !target.endDate) return 0;
    const now = new Date();
    const totalDuration = new Date(target.endDate) - new Date(target.startDate);
    const elapsed = now - new Date(target.startDate);
    const timeRatio = elapsed / totalDuration;
    const achievementRatio = target.targetValue > 0 ? (target.achievedValue / target.targetValue) : 0;
    
    // If they achieved 50% in 10% of the time, they are performing well.
    if (timeRatio <= 0) return 100; // Just started
    const score = (achievementRatio / timeRatio) * 100;
    return Math.min(100, Math.round(score * 100) / 100);
  }

  async getCompanyOverview(organizationId, userContext = null) {
    const userId = userContext?.id || userContext?.userId;
    const cacheKey = `target:overview:${organizationId}:${userId || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const raw = await this.repo.getCompanyOverview(organizationId, userContext);
    const { targets, orders, branches, users, visits, tasks } = raw;

    // Operational KPI Summaries
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => ["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status));
    const completedOrdersCount = completedOrders.length;

    const completedVisitsCount = visits.filter((v) => v.status === "COMPLETED").length;
    const totalVisitsCount = visits.length;

    const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
    const totalTasksCount = tasks.length;

    // Revenue & Quantity Fulfillment Metrics from all Sales Orders
    let totalRevenue = 0;
    let requestedQuantity = 0;
    let fulfilledQuantity = 0;

    // Revenue Trend Maps
    const monthlyRevenueMap = {};
    const weeklyRevenueMap = {};
    const dailyRevenueMap = {};

    orders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      totalRevenue += amt;

      const d = new Date(o.createdAt);
      const monthKey = d.toLocaleString("default", { month: "short" });
      const dayKey = d.toISOString().split("T")[0];

      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const weekKey = `W${weekNum}`;

      if (!monthlyRevenueMap[monthKey]) monthlyRevenueMap[monthKey] = { period: monthKey, revenue: 0, orders: 0 };
      if (!weeklyRevenueMap[weekKey]) weeklyRevenueMap[weekKey] = { period: weekKey, revenue: 0, orders: 0 };
      if (!dailyRevenueMap[dayKey]) dailyRevenueMap[dayKey] = { period: dayKey, revenue: 0, orders: 0 };

      monthlyRevenueMap[monthKey].orders += 1;
      monthlyRevenueMap[monthKey].revenue += amt;

      weeklyRevenueMap[weekKey].orders += 1;
      weeklyRevenueMap[weekKey].revenue += amt;

      dailyRevenueMap[dayKey].orders += 1;
      dailyRevenueMap[dayKey].revenue += amt;

      (o.items || []).forEach((item) => {
        const q = item.quantity || 0;
        requestedQuantity += q;
        if (["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status)) {
          fulfilledQuantity += q;
        }
      });
    });

    const pendingQuantity = Math.max(0, requestedQuantity - fulfilledQuantity);
    const fulfillmentRate = requestedQuantity > 0 ? Math.round((fulfilledQuantity / requestedQuantity) * 100) : 0;

    const revenueTrends = {
      monthly: Object.values(monthlyRevenueMap),
      weekly: Object.values(weeklyRevenueMap),
      daily: Object.values(dailyRevenueMap),
    };

    // Categorize Users (Sales Managers vs Sales Executives)
    const executives = [];
    const managers = [];

    users.forEach((u) => {
      const roleNames = Array.isArray(u.roles)
        ? u.roles.map((r) => (r.role?.name || r.name || "").toLowerCase())
        : [];

      const isSalesManager = roleNames.some((r) => r.includes("sales manager") || r.includes("head of sales"));
      const isSalesExecutive = roleNames.some((r) => r.includes("sales executive"));

      const uOrders = orders.filter((o) => o.ownerId === u.id);
      const uCompletedOrders = uOrders.filter((o) => ["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status));
      const uTasks = tasks.filter((t) => t.assignedToId === u.id);
      const uCompletedTasks = uTasks.filter((t) => t.status === "COMPLETED");

      let uReqQty = 0;
      let uFulQty = 0;
      let uOrderVal = 0;
      uOrders.forEach((o) => {
        uOrderVal += Number(o.totalAmount || 0);
        (o.items || []).forEach((item) => {
          const q = item.quantity || 0;
          uReqQty += q;
          if (["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status)) uFulQty += q;
        });
      });

      const userInfo = {
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        email: u.email,
        branchName: u.branch?.name || "Unassigned",
        teamName: u.team?.name || u.branch?.name || "Sales Team",
        roleName: u.roles?.[0]?.role?.name || (isSalesManager ? "Sales Manager" : "Sales Executive"),
        
        // Sales Executive Target Metrics (Tasks)
        assignedTasks: uTasks.length,
        completedTasks: uCompletedTasks.length,
        pendingTasks: Math.max(0, uTasks.length - uCompletedTasks.length),
        taskCompletionRate: uTasks.length > 0 ? Math.round((uCompletedTasks.length / uTasks.length) * 100) : 0,

        // Sales Manager Target Metrics (Orders)
        ordersReceived: uOrders.length,
        ordersCompleted: uCompletedOrders.length,
        totalOrderValue: uOrderVal,
        pendingOrders: Math.max(0, uOrders.length - uCompletedOrders.length),
        orderCompletionRate: uOrders.length > 0 ? Math.round((uCompletedOrders.length / uOrders.length) * 100) : 0,

        requestedQty: uReqQty,
        fulfilledQty: uFulQty,
        fulfillmentRate: uReqQty > 0 ? Math.round((uFulQty / uReqQty) * 100) : 0,
      };

      if (isSalesManager) {
        managers.push(userInfo);
      } else if (isSalesExecutive) {
        executives.push(userInfo);
      }
    });

    // Branch Performance Breakdown
    const branchPerformance = branches.map((b) => {
      const branchUsers = users.filter((u) => u.branchId === b.id);
      const branchUserIds = new Set(branchUsers.map((u) => u.id));

      const branchOrders = orders.filter((o) => o.owner?.branchId === b.id || branchUserIds.has(o.ownerId));
      const branchCompletedOrders = branchOrders.filter((o) => ["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status));
      const branchTasks = tasks.filter((t) => branchUserIds.has(t.assignedToId));
      const branchCompletedTasks = branchTasks.filter((t) => t.status === "COMPLETED");

      let bReqQty = 0;
      let bFulQty = 0;
      let bRevenue = 0;
      branchOrders.forEach((o) => {
        bRevenue += Number(o.totalAmount || 0);
        (o.items || []).forEach((item) => {
          const q = item.quantity || 0;
          bReqQty += q;
          if (["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status)) bFulQty += q;
        });
      });

      return {
        id: b.id,
        name: b.name,
        code: b.code || "BR",
        memberCount: branchUsers.length,
        totalOrders: branchOrders.length,
        completedOrders: branchCompletedOrders.length,
        pendingOrders: Math.max(0, branchOrders.length - branchCompletedOrders.length),
        totalTasks: branchTasks.length,
        completedTasks: branchCompletedTasks.length,
        pendingTasks: Math.max(0, branchTasks.length - branchCompletedTasks.length),
        totalRevenue: bRevenue,
        requestedQty: bReqQty,
        fulfilledQty: bFulQty,
        fulfillmentRate: bReqQty > 0 ? Math.round((bFulQty / bReqQty) * 100) : 0,
        taskCompletionRate: branchTasks.length > 0 ? Math.round((branchCompletedTasks.length / branchTasks.length) * 100) : 0,
        orderCompletionRate: branchOrders.length > 0 ? Math.round((branchCompletedOrders.length / branchOrders.length) * 100) : 0,
      };
    });

    const result = {
      totalRevenue,
      revenueTrends,
      kpiSummary: {
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        fulfillment: {
          requestedQuantity,
          fulfilledQuantity,
          pendingQuantity,
          fulfillmentRate,
        },
      },
      branchPerformance,
      executivesPerformance: executives,
      managersPerformance: managers,
    };

    cacheService.set(cacheKey, result, 300);
    return result;
  }
}
