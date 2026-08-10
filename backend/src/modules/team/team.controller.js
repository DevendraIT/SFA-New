import { ApiResponse } from '../../shared/response.js';

/**
 * Team Controller
 * Thin HTTP layer — delegates all logic to TeamService
 */
export class TeamController {
  constructor(teamService) {
    this.service = teamService;
  }

  listTeams = async (req, res, next) => {
    try {
      const { teams, meta } = await this.service.listTeams(req.user.organizationId, req.query, req.user);
      res.json(ApiResponse.success('Teams retrieved successfully.', { teams }, meta));
    } catch (error) {
      next(error);
    }
  };

  getTeam = async (req, res, next) => {
    try {
      const team = await this.service.getTeam(req.params.id, req.user.organizationId, req.user);
      res.json(ApiResponse.success('Team retrieved successfully.', team));
    } catch (error) {
      next(error);
    }
  };

  createTeam = async (req, res, next) => {
    try {
      const team = await this.service.createTeam(req.user.organizationId, req.body, req);
      res.status(201).json(ApiResponse.success('Team created successfully.', team));
    } catch (error) {
      next(error);
    }
  };

  updateTeam = async (req, res, next) => {
    try {
      const team = await this.service.updateTeam(req.params.id, req.user.organizationId, req.body, req);
      res.json(ApiResponse.success('Team updated successfully.', team));
    } catch (error) {
      next(error);
    }
  };

  deleteTeam = async (req, res, next) => {
    try {
      await this.service.deleteTeam(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Team deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  restoreTeam = async (req, res, next) => {
    try {
      const team = await this.service.restoreTeam(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Team restored successfully.', team));
    } catch (error) {
      next(error);
    }
  };
}
