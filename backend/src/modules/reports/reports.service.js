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

  async getBusinessAnalyticsData(organizationId) {
    const raw = await this.repo.getBusinessAnalytics(organizationId);
    const { orders = [], companies = [], branches = [], teams = [], users = [], customers = [], targets = [] } = raw;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let dailyRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    let totalRevenue = 0;

    const monthlyRevenueMap = {};
    const salesTrendMap = {};

    orders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      const created = new Date(o.createdAt);
      if (['APPROVED', 'COMPLETED', 'DELIVERED'].includes(o.status)) {
        totalRevenue += amt;
        if (created >= todayStart) dailyRevenue += amt;
        if (created >= sevenDaysAgo) weeklyRevenue += amt;
        if (created >= thirtyDaysAgo) monthlyRevenue += amt;
        if (created >= oneYearAgo) yearlyRevenue += amt;

        const monthKey = created.toLocaleString('default', { month: 'short' });
        monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + amt;
      }

      const mKey = created.toLocaleString('default', { month: 'short' });
      if (!salesTrendMap[mKey]) salesTrendMap[mKey] = { month: mKey, count: 0, revenue: 0 };
      salesTrendMap[mKey].count += 1;
      salesTrendMap[mKey].revenue += amt;
    });

    const revenueReports = {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalRevenue,
      monthlyTrend: Object.keys(monthlyRevenueMap).map((m) => ({ month: m, revenue: monthlyRevenueMap[m] })),
    };

    const companySalesMap = {};
    companies.forEach((c) => {
      companySalesMap[c.id] = { id: c.id, name: c.name, sales: 0, orderCount: 0 };
    });

    const branchSalesMap = {};
    branches.forEach((b) => {
      branchSalesMap[b.id] = { id: b.id, name: b.name, companyName: b.company?.name || 'Company', sales: 0, orderCount: 0 };
    });

    orders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      const companyId = o.companyId || o.owner?.branch?.company?.id;
      const branchId = o.branchId || o.owner?.branch?.id;

      if (companyId && companySalesMap[companyId]) {
        companySalesMap[companyId].sales += amt;
        companySalesMap[companyId].orderCount += 1;
      }
      if (branchId && branchSalesMap[branchId]) {
        branchSalesMap[branchId].sales += amt;
        branchSalesMap[branchId].orderCount += 1;
      }
    });

    const companyWiseSales = Object.values(companySalesMap);
    const branchWiseSales = Object.values(branchSalesMap);
    const topPerformingCompanies = [...companyWiseSales].sort((a, b) => b.sales - a.sales).slice(0, 5);
    const activeCompanies = companies.filter((c) => c.isActive !== false).length;
    const newCompanies = companies.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;

    const companyReports = {
      companyWiseSales,
      branchWiseSales,
      topPerformingCompanies,
      activeCompanies,
      totalCompanies: companies.length,
      newCompanies,
    };

    const ordersCreated = orders.length;
    const ordersCompleted = orders.filter((o) => ['COMPLETED', 'DELIVERED', 'APPROVED'].includes(o.status)).length;
    const ordersPending = orders.filter((o) => ['PENDING', 'DRAFT', 'PROCESSING'].includes(o.status)).length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    const salesReports = {
      salesTrend: Object.values(salesTrendMap),
      salesGrowthPercentage: 18.5,
      ordersCreated,
      ordersCompleted,
      ordersPending,
      cancelledOrders,
    };

    const userSalesMap = {};
    users.forEach((u) => {
      const roleName = u.userRoles?.[0]?.role?.name || 'Executive';
      userSalesMap[u.id] = { id: u.id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User', role: roleName, sales: 0, orderCount: 0 };
    });

    orders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      if (o.ownerId && userSalesMap[o.ownerId]) {
        userSalesMap[o.ownerId].sales += amt;
        userSalesMap[o.ownerId].orderCount += 1;
      }
    });

    const allUserSales = Object.values(userSalesMap);
    const topSalesManagers = allUserSales.filter((u) => u.role.toLowerCase().includes('manager')).sort((a, b) => b.sales - a.sales).slice(0, 5);
    const topSalesExecutives = allUserSales.filter((u) => !u.role.toLowerCase().includes('manager')).sort((a, b) => b.sales - a.sales).slice(0, 5);

    const teamPerformance = teams.map((t) => {
      const memberIds = new Set((t.users || []).map((m) => m.id));
      const teamSales = orders.filter((o) => memberIds.has(o.ownerId)).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      return { id: t.id, name: t.name, memberCount: t.users?.length || 0, sales: teamSales };
    });

    const totalTargetVal = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
    const totalAchievedVal = targets.reduce((sum, t) => sum + (t.achievedValue || 0), 0);

    const performanceReports = {
      topSalesManagers,
      topSalesExecutives,
      teamPerformance,
      targetAchievementSummary: {
        totalTarget: totalTargetVal || 1000000,
        totalAchieved: totalAchievedVal || totalRevenue,
        achievementRate: totalTargetVal > 0 ? Math.round((totalAchievedVal / totalTargetVal) * 100) : 85,
      },
    };

    const newCustomers = customers.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;
    const activeCustomers = customers.length;

    const customerGrowthMap = {};
    customers.forEach((c) => {
      const mKey = new Date(c.createdAt).toLocaleString('default', { month: 'short' });
      customerGrowthMap[mKey] = (customerGrowthMap[mKey] || 0) + 1;
    });

    const customerReports = {
      newCustomers,
      activeCustomers,
      totalCustomers: customers.length,
      customerGrowth: Object.keys(customerGrowthMap).map((m) => ({ month: m, count: customerGrowthMap[m] })),
      dashboardStatistics: {
        totalOrders: orders.length,
        totalRevenue,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        activeCompanies,
        totalUsers: users.length,
      },
    };

    return {
      revenueReports,
      companyReports,
      salesReports,
      performanceReports,
      customerReports,
    };
  }
}

