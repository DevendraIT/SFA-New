import { successResponse } from '../../shared/response.js';

export class ReportsController {
  constructor(reportsService) {
    this.service = reportsService;
  }

  downloadReport = async (req, res, next) => {
    try {
      const { type, startDate, endDate, format } = req.query;
      
      const fileBuffer = await this.service.generateReport(
        req.user.organizationId,
        type,
        startDate,
        endDate,
        format || 'json'
      );

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type.toLowerCase()}_report.xlsx`);
        return res.send(fileBuffer);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type.toLowerCase()}_report.pdf`);
        return res.send(fileBuffer);
      }

      // Default JSON response
      return successResponse(res, fileBuffer, 'Report generated.');
    } catch (err) {
      next(err);
    }
  };

  getForecast = async (req, res, next) => {
    try {
      const { timeframe } = req.query;
      const forecast = await this.service.getSalesForecast(req.user.organizationId, timeframe);
      return successResponse(res, forecast, 'Sales forecast generated successfully.');
    } catch (err) {
      next(err);
    }
  };
}
