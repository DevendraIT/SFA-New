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
}
