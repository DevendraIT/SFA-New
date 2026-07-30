import { successResponse } from '../../shared/response.js';

export class TargetPerformanceController {
  constructor(targetPerformanceService) {
    this.service = targetPerformanceService;
  }

  getTargets = async (req, res, next) => {
    try {
      const result = await this.service.getTargets(req.user.organizationId, req.query);
      return successResponse(res, result, 'Targets retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  createTarget = async (req, res, next) => {
    try {
      const result = await this.service.createTarget(req.user.organizationId, req.body);
      return successResponse(res, result, 'Target created successfully.', 201);
    } catch (err) {
      next(err);
    }
  };

  planTargets = async (req, res, next) => {
    try {
      const result = await this.service.planTargets(req.user.organizationId, req.body);
      return successResponse(res, result, 'Targets planned successfully.', 201);
    } catch (err) {
      next(err);
    }
  };

  getLeaderboard = async (req, res, next) => {
    try {
      const { metric } = req.query;
      const result = await this.service.getLeaderboard(req.user.organizationId, metric);
      return successResponse(res, result, 'Leaderboard retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  getCompanyOverview = async (req, res, next) => {
    try {
      const result = await this.service.getCompanyOverview(req.user.organizationId);
      return successResponse(res, result, 'Company performance overview retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };
}
