import { ApiResponse } from '../../../shared/response.js';

/**
 * Organization Controller
 * Thin HTTP layer — delegates all logic to OrganizationService
 */
export class OrganizationController {
  constructor(organizationService) {
    this.service = organizationService;
  }

  // --------------------------------------------------
  // Organization
  // --------------------------------------------------

  listOrganizations = async (req, res, next) => {
    try {
      const { organizations, meta } = await this.service.listOrganizations(req.query);
      res.json(ApiResponse.success('Organizations retrieved successfully.', { organizations }, meta));
    } catch (error) {
      next(error);
    }
  };

  getOrganization = async (req, res, next) => {
    try {
      const org = await this.service.getOrganization(req.user.organizationId);
      res.json(ApiResponse.success('Organization retrieved successfully.', org));
    } catch (error) {
      next(error);
    }
  };

  createOrganization = async (req, res, next) => {
    try {
      const organization = await this.service.createOrganization(req.body, req);
      res.status(201).json(ApiResponse.success('Organization created successfully.', organization));
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (req, res, next) => {
    try {
      const updated = await this.service.updateOrganization(req.user.organizationId, req.body, req);
      res.json(ApiResponse.success('Organization updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  activateOrganization = async (req, res, next) => {
    try {
      const updated = await this.service.activateOrganization(req.params.id, req);
      res.json(ApiResponse.success('Organization activated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deactivateOrganization = async (req, res, next) => {
    try {
      const updated = await this.service.deactivateOrganization(req.params.id, req);
      res.json(ApiResponse.success('Organization deactivated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteOrganization = async (req, res, next) => {
    try {
      await this.service.deleteOrganization(req.params.id, req);
      res.json(ApiResponse.success('Organization deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getStatistics = async (req, res, next) => {
    try {
      const statistics = await this.service.getStatistics(req.params.id, req);
      res.json(ApiResponse.success('Organization statistics retrieved successfully.', statistics));
    } catch (error) {
      next(error);
    }
  };

  // --------------------------------------------------
  // Branch
  // --------------------------------------------------

  listBranches = async (req, res, next) => {
    try {
      const { branches, meta } = await this.service.listBranches(req.user.organizationId, req.query);
      res.json(ApiResponse.success('Branches retrieved successfully.', { branches }, meta));
    } catch (error) {
      next(error);
    }
  };

  getBranch = async (req, res, next) => {
    try {
      const branch = await this.service.getBranch(req.params.id, req.user.organizationId);
      res.json(ApiResponse.success('Branch retrieved successfully.', branch));
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req, res, next) => {
    try {
      const branch = await this.service.createBranch(req.user.organizationId, req.body, req);
      res.status(201).json(ApiResponse.success('Branch created successfully.', branch));
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (req, res, next) => {
    try {
      const branch = await this.service.updateBranch(req.params.id, req.user.organizationId, req.body, req);
      res.json(ApiResponse.success('Branch updated successfully.', branch));
    } catch (error) {
      next(error);
    }
  };

  deleteBranch = async (req, res, next) => {
    try {
      await this.service.deleteBranch(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Branch deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  restoreBranch = async (req, res, next) => {
    try {
      const branch = await this.service.restoreBranch(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Branch restored successfully.', branch));
    } catch (error) {
      next(error);
    }
  };

  // --------------------------------------------------
  // Department
  // --------------------------------------------------

  listDepartments = async (req, res, next) => {
    try {
      const { departments, meta } = await this.service.listDepartments(req.user.organizationId, req.query);
      res.json(ApiResponse.success('Departments retrieved successfully.', { departments }, meta));
    } catch (error) {
      next(error);
    }
  };

  getDepartment = async (req, res, next) => {
    try {
      const department = await this.service.getDepartment(req.params.id, req.user.organizationId);
      res.json(ApiResponse.success('Department retrieved successfully.', department));
    } catch (error) {
      next(error);
    }
  };

  createDepartment = async (req, res, next) => {
    try {
      const department = await this.service.createDepartment(req.user.organizationId, req.body, req);
      res.status(201).json(ApiResponse.success('Department created successfully.', department));
    } catch (error) {
      next(error);
    }
  };

  updateDepartment = async (req, res, next) => {
    try {
      const department = await this.service.updateDepartment(req.params.id, req.user.organizationId, req.body, req);
      res.json(ApiResponse.success('Department updated successfully.', department));
    } catch (error) {
      next(error);
    }
  };

  deleteDepartment = async (req, res, next) => {
    try {
      await this.service.deleteDepartment(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Department deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  restoreDepartment = async (req, res, next) => {
    try {
      const department = await this.service.restoreDepartment(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Department restored successfully.', department));
    } catch (error) {
      next(error);
    }
  };

  // --------------------------------------------------
  // Territory
  // --------------------------------------------------

  listTerritories = async (req, res, next) => {
    try {
      const { territories, meta } = await this.service.listTerritories(req.user.organizationId, req.query);
      res.json(ApiResponse.success('Territories retrieved successfully.', { territories }, meta));
    } catch (error) {
      next(error);
    }
  };

  getTerritory = async (req, res, next) => {
    try {
      const territory = await this.service.getTerritory(req.params.id, req.user.organizationId);
      res.json(ApiResponse.success('Territory retrieved successfully.', territory));
    } catch (error) {
      next(error);
    }
  };

  createTerritory = async (req, res, next) => {
    try {
      const territory = await this.service.createTerritory(req.user.organizationId, req.body, req);
      res.status(201).json(ApiResponse.success('Territory created successfully.', territory));
    } catch (error) {
      next(error);
    }
  };

  updateTerritory = async (req, res, next) => {
    try {
      const territory = await this.service.updateTerritory(req.params.id, req.user.organizationId, req.body, req);
      res.json(ApiResponse.success('Territory updated successfully.', territory));
    } catch (error) {
      next(error);
    }
  };

  deleteTerritory = async (req, res, next) => {
    try {
      await this.service.deleteTerritory(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Territory deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  restoreTerritory = async (req, res, next) => {
    try {
      const territory = await this.service.restoreTerritory(req.params.id, req.user.organizationId, req);
      res.json(ApiResponse.success('Territory restored successfully.', territory));
    } catch (error) {
      next(error);
    }
  };
}
