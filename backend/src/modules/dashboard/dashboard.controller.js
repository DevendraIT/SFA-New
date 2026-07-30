import { successResponse } from '../../shared/response.js';

export class DashboardController {
  constructor(dashboardService) {
    this.service = dashboardService;
  }

  getSuperAdminDashboard = async (req, res, next) => {
    try {
      const data = await this.service.getSuperAdminDashboard(req.user.organizationId);
      return successResponse(res, data, 'Super Admin dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getExecutiveDashboard = async (req, res, next) => {

    try {
      const data = await this.service.getExecutiveDashboard(req.user);
      return successResponse(res, data, 'Executive dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };


  getTeamDashboard = async (req, res, next) => {
    try {
      const data = await this.service.getTeamDashboard(req.user.organizationId, req.user.id);
      return successResponse(res, data, 'Team dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getUserDashboard = async (req, res, next) => {
    try {
      const data = await this.service.getUserDashboard(req.user.organizationId, req.user.id);
      return successResponse(res, data, 'User dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getHeadOfSalesDashboard = async (req, res, next) => {
    try {
      const data = await this.service.getHeadOfSalesDashboard(req.user);
      return successResponse(res, data, 'Head of Sales dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getSalesManagerCount = async (req, res, next) => {
    try {
      const data = await this.service.getSalesManagerCount(req.user);
      return successResponse(res, data, 'Sales manager count retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getPresentSalesManagerCount = async (req, res, next) => {
    try {
      const data = await this.service.getPresentSalesManagerCount(req.user);
      return successResponse(res, data, 'Present sales manager count retrieved.');
    } catch (err) {
      next(err);
    }
  };

  getManagerDashboard = async (req, res, next) => {

    try {
      const data = await this.service.getManagerDashboard(req.user);
      return successResponse(res, data, 'Manager dashboard data retrieved.');
    } catch (err) {
      next(err);
    }
  };
}

