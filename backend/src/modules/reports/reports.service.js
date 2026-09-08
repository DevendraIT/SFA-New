import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export class ReportsService {
  constructor(reportsRepository) {
    this.repo = reportsRepository;
  }

  async generateReport(organizationId, type, startDate, endDate, format) {
    let data = [];
    let headers = [];

    if (type === 'ATTENDANCE') {
      const records = await this.repo.getAttendanceData(organizationId, startDate, endDate);
      data = records.map(r => ({
        Name: `${r.user.firstName} ${r.user.lastName}`,
        Date: r.date.toISOString().split('T')[0],
        Status: r.status,
        CheckIn: r.checkInAt ? r.checkInAt.toISOString() : 'N/A',
        CheckOut: r.checkOutAt ? r.checkOutAt.toISOString() : 'N/A',
      }));
      headers = ['Name', 'Date', 'Status', 'CheckIn', 'CheckOut'];
    } else if (type === 'VISITS') {
      const records = await this.repo.getVisitData(organizationId, startDate, endDate);
      data = records.map(r => ({
        User: `${r.user.firstName} ${r.user.lastName}`,
        Lead: r.lead ? `${r.lead.firstName} ${r.lead.lastName} (${r.lead.company || ''})` : 'N/A',
        Title: r.title,
        Status: r.status,
        ScheduledAt: r.scheduledAt.toISOString(),
      }));
      headers = ['User', 'Lead', 'Title', 'Status', 'ScheduledAt'];
    } else if (type === 'TARGETS') {
      const records = await this.repo.getTargetData(organizationId, null);
      data = records.map(r => ({
        Owner: r.user ? `${r.user.firstName} ${r.user.lastName}` : r.team?.name,
        Metric: r.metric,
        Target: r.targetValue,
        Achieved: r.achievedValue,
        Status: r.status,
      }));
      headers = ['Owner', 'Metric', 'Target', 'Achieved', 'Status'];
    } else if (type === 'ORDERS') {
      const records = await this.repo.getOrderData(organizationId, startDate, endDate);
      data = records.map(r => ({
        OrderNumber: r.orderNumber,
        Owner: r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : 'N/A',
        Customer: r.customer ? r.customer.name : 'N/A',
        TotalAmount: r.totalAmount,
        Currency: r.currency,
        Status: r.status,
        CreatedAt: r.createdAt.toISOString(),
      }));
      headers = ['OrderNumber', 'Owner', 'Customer', 'TotalAmount', 'Currency', 'Status', 'CreatedAt'];
    } else {
      throw new Error('Unsupported report type');
    }

    if (format === 'excel') {
      return this._generateExcel(data);
    } else if (format === 'pdf') {
      return this._generatePdf(headers, data, type);
    }

    return { data }; // JSON
  }

  _generateExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async _generatePdf(headers, data, title) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      doc.fontSize(18).text(`${title} Report`, { align: 'center' });
      doc.moveDown();

      if (data.length === 0) {
        doc.fontSize(12).text('No records found.');
      } else {
        doc.fontSize(10);
        let y = doc.y;
        
        // Headers
        let x = 50;
        headers.forEach(h => {
          doc.text(h, x, y, { width: 100 });
          x += 100;
        });
        
        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();

        // Data
        data.forEach(row => {
          x = 50;
          headers.forEach(h => {
            const val = row[h] ? String(row[h]) : '';
            doc.text(val.substring(0, 20), x, y, { width: 95 });
            x += 100;
          });
          y += 20;
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });
      }

      doc.end();
    });
  }

  async getSalesForecast(organizationId, timeframe = 'quarterly') {
    // In a real application, this would query historical data and apply a forecasting algorithm.
    // For this mock, we return a structured forecast based on recent target achievements.
    const historicalTargets = await this.repo.getTargetData(organizationId, null);
    
    let totalRevenueAchieved = 0;
    historicalTargets.forEach(t => {
      if (t.metric === 'REVENUE') totalRevenueAchieved += t.achievedValue;
    });

    const projectedRevenue = totalRevenueAchieved * 1.15; // Simple 15% growth projection

    return {
      timeframe,
      historicalRevenue: totalRevenueAchieved,
      projectedRevenue,
      confidenceInterval: '85%',
      trends: [
        { metric: 'REVENUE', trend: 'UPWARD', growthPercentage: 15 },
        { metric: 'NEW_LEADS', trend: 'STABLE', growthPercentage: 5 }
      ]
    };
  }

  async getOrganizationAnalytics(organizationId, userContext = null) {
    const raw = await this.repo.getOrganizationAnalytics(organizationId, userContext);
    const { orders, products, customers, targets, visits, branches, users, warehouses, stocks, tasks, dars, attendance } = raw;

    // 1. Branch Report
    const branchReport = branches.map((b) => {
      const bUsers = users.filter((u) => u.branchId === b.id);
      const bUserIds = new Set(bUsers.map((u) => u.id));
      
      const bOrders = orders.filter((o) => o.branchId === b.id || o.owner?.branchId === b.id || bUserIds.has(o.ownerId));
      const bCompletedOrders = bOrders.filter((o) => ["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status));
      const bCancelledOrders = bOrders.filter((o) => o.status === "CANCELLED");

      const bTasks = tasks.filter((t) => bUserIds.has(t.assignedToId) || t.assignedTo?.branchId === b.id);
      const bCompletedTasks = bTasks.filter((t) => ["COMPLETED", "CHECKED_OUT"].includes(t.status));

      const bVisits = visits.filter((v) => bUserIds.has(v.userId) || v.user?.branchId === b.id);
      const bCompletedVisits = bVisits.filter((v) => v.status === "COMPLETED");

      let bReqQty = 0;
      let bFulQty = 0;
      let bRevenue = 0;
      bOrders.forEach((o) => {
        bRevenue += Number(o.totalAmount || 0);
        (o.items || []).forEach((i) => {
          const q = Number(i.quantity || 0);
          bReqQty += q;
          if (["COMPLETED", "DELIVERED", "APPROVED"].includes(o.status)) bFulQty += q;
        });
      });

      const fulfillmentPct = bReqQty > 0 ? Math.round((bFulQty / bReqQty) * 100) : 0;

      return {
        id: b.id,
        name: b.name,
        code: b.code || "BR",
        memberCount: bUsers.length,
        teamSize: bUsers.length,
        totalOrders: bOrders.length,
        completedOrders: bCompletedOrders.length,
        cancelledOrders: bCancelledOrders.length,
        totalTasks: bTasks.length,
        completedTasks: bCompletedTasks.length,
        totalVisits: bVisits.length,
        completedVisits: bCompletedVisits.length,
        totalRevenue: bRevenue,
        requestedQuantity: bReqQty,
        fulfilledQuantity: bFulQty,
        fulfillmentRate: fulfillmentPct,
        fulfillmentPercentage: fulfillmentPct,
        orderCompletionRate: bOrders.length > 0 ? Math.round((bCompletedOrders.length / bOrders.length) * 100) : 0,
        taskCompletionRate: bTasks.length > 0 ? Math.round((bCompletedTasks.length / bTasks.length) * 100) : 0,
      };
    });

    // 2. Warehouses Report
    const warehousesReport = warehouses.map((w) => {
      const managerName = w.warehouseManager
        ? `${w.warehouseManager.firstName || ""} ${w.warehouseManager.lastName || ""}`.trim()
        : "Unassigned";
      const totalStockQty = (w.stocks || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
      const reservedStockQty = (w.stocks || []).reduce((sum, s) => sum + (s.reservedQuantity || 0), 0);
      const issueCount = (w.productIssues || []).length;
      const branchNames = (w.branches || []).map((b) => b.name).join(", ") || "All Branches";

      return {
        id: w.id,
        name: w.name,
        code: w.code || "WH",
        managerName,
        location: w.location || "Main Center",
        totalStockQuantity: totalStockQty,
        reservedStockQuantity: reservedStockQty,
        availableStockQuantity: Math.max(0, totalStockQty - reservedStockQty),
        productIssueCount: issueCount,
        assignedBranches: branchNames,
        isActive: w.isActive,
      };
    });

    // 3. Product Report
    const productReport = products.map((p) => {
      const pOrders = orders.filter((o) => (o.items || []).some((i) => i.productId === p.id));
      let unitsSold = 0;
      let revenue = 0;
      orders.forEach((o) => {
        (o.items || []).forEach((i) => {
          if (i.productId === p.id) {
            const q = Number(i.quantity || 0);
            unitsSold += q;
            revenue += q * Number(i.unitPrice || p.price || 0);
          }
        });
      });
      const totalStockQty = (p.stocks || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

      return {
        id: p.id,
        name: p.name,
        sku: p.sku || "N/A",
        category: p.category || "General",
        price: Number(p.price || 0),
        totalOrdersCount: pOrders.length,
        totalUnitsSold: unitsSold,
        totalRevenue: revenue,
        currentStockQuantity: totalStockQty,
      };
    });

    // 4. Stock per Branches Report
    const stockPerBranchesReport = stocks.map((s) => {
      const branchNames = (s.warehouse?.branches || []).map((b) => b.name).join(", ") || "General Stock";
      return {
        id: s.id,
        productName: s.product?.name || "Unknown Product",
        sku: s.product?.sku || "N/A",
        warehouseName: s.warehouse?.name || "Main Warehouse",
        branchNames,
        totalQuantity: s.quantity || 0,
        reservedQuantity: s.reservedQuantity || 0,
        availableQuantity: Math.max(0, (s.quantity || 0) - (s.reservedQuantity || 0)),
      };
    });

    // 5. Field Force Report (Strictly Sales Executives)
    const fieldExecutives = users.filter((u) => {
      const roleNames = Array.isArray(u.roles)
        ? u.roles.map((r) => (r.role?.name || r.name || "").toLowerCase())
        : [];
      return roleNames.some((r) => r.includes("sales executive") || r.includes("field executive"));
    });

    const completedTasksCount = tasks.filter((t) => ["COMPLETED", "CHECKED_OUT"].includes(t.status)).length;
    const inProgressTasksCount = tasks.filter((t) => ["IN_PROGRESS", "DELIVERY_IN_PROGRESS", "CHECKED_IN", "ARRIVED", "NAVIGATING", "ACCEPTED", "ASSIGNED"].includes(t.status)).length;
    const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;

    const workforceMembers = fieldExecutives.map((u) => {
      const uTasks = tasks.filter((t) => t.assignedToId === u.id);
      const uCompleted = uTasks.filter((t) => ["COMPLETED", "CHECKED_OUT"].includes(t.status)).length;
      const uInProgress = uTasks.filter((t) => ["IN_PROGRESS", "DELIVERY_IN_PROGRESS", "CHECKED_IN", "ARRIVED", "NAVIGATING", "ACCEPTED", "ASSIGNED"].includes(t.status)).length;
      const uPending = uTasks.filter((t) => t.status === "PENDING").length;

      return {
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        email: u.email,
        branchName: u.branch?.name || "Unassigned",
        totalTasks: uTasks.length,
        completedTasks: uCompleted,
        inProgressTasks: uInProgress,
        pendingTasks: uPending,
        taskCompletionRate: uTasks.length > 0 ? Math.round((uCompleted / uTasks.length) * 100) : 0,
      };
    });

    const fieldForceReport = {
      workforceCount: fieldExecutives.length,
      tasksSummary: {
        total: tasks.length,
        completed: completedTasksCount,
        inProgress: inProgressTasksCount,
        pending: pendingTasksCount,
        completionRate: tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0,
      },
      workforceList: workforceMembers,
    };

    // 6. Sales Orders Completion Report
    const draftOrders = orders.filter((o) => o.status === "DRAFT").length;
    const pendingOrders = orders.filter((o) => ["PENDING", "SUBMITTED", "IN_REVIEW"].includes(o.status)).length;
    const inProgressOrders = orders.filter((o) => ["APPROVED", "IN_PROGRESS", "DISPATCHED"].includes(o.status)).length;
    const completedOrders = orders.filter((o) => ["COMPLETED", "DELIVERED"].includes(o.status)).length;
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;

    let totalReqQty = 0;
    let totalFulQty = 0;
    orders.forEach((o) => {
      (o.items || []).forEach((i) => {
        const q = i.quantity || 0;
        totalReqQty += q;
        if (["COMPLETED", "DELIVERED"].includes(o.status)) totalFulQty += q;
      });
    });

    const salesOrdersCompletionReport = {
      totalOrders: orders.length,
      draftOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      requestedQuantity: totalReqQty,
      fulfilledQuantity: totalFulQty,
      pendingQuantity: Math.max(0, totalReqQty - totalFulQty),
      fulfillmentRate: totalReqQty > 0 ? Math.round((totalFulQty / totalReqQty) * 100) : 0,
      orderCompletionRate: orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0,
    };

    // 7. Individual User Report
    const individualUserReport = users.map((u) => {
      const roleNames = (u.roles || []).map((r) => r.role?.name || r.name || "");
      const isManager = roleNames.some((n) => n.toLowerCase().includes("manager") || n.toLowerCase().includes("head"));

      const uOrders = orders.filter((o) => o.ownerId === u.id);
      const uCompletedOrders = uOrders.filter((o) => ["COMPLETED", "DELIVERED"].includes(o.status));
      const uTasks = tasks.filter((t) => t.assignedToId === u.id);
      const uCompletedTasks = uTasks.filter((t) => t.status === "COMPLETED");
      const uVisits = visits.filter((v) => v.userId === u.id && v.status === "COMPLETED");

      let uReqQty = 0;
      let uFulQty = 0;
      uOrders.forEach((o) => {
        (o.items || []).forEach((i) => {
          const q = i.quantity || 0;
          uReqQty += q;
          if (["COMPLETED", "DELIVERED"].includes(o.status)) uFulQty += q;
        });
      });

      return {
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        email: u.email,
        branchName: u.branch?.name || "Unassigned",
        roleName: roleNames[0] || (isManager ? "Sales Manager" : "Sales Executive"),
        assignedTasksCount: uTasks.length,
        completedTasksCount: uCompletedTasks.length,
        completedVisitsCount: uVisits.length,
        totalOrdersPlaced: uOrders.length,
        completedOrdersCount: uCompletedOrders.length,
        requestedQuantity: uReqQty,
        fulfilledQuantity: uFulQty,
        fulfillmentRate: uReqQty > 0 ? Math.round((uFulQty / uReqQty) * 100) : 0,
      };
    });

    return {
      branchReport,
      warehousesReport,
      productReport,
      stockPerBranchesReport,
      fieldForceReport,
      salesOrdersCompletionReport,
      individualUserReport,
      summary: {
        totalBranches: branches.length,
        totalWarehouses: warehouses.length,
        totalProducts: products.length,
        totalUsers: users.length,
        totalOrders: orders.length,
        totalVisits: visits.length,
        totalTasks: tasks.length,
      },
    };
  }
}
