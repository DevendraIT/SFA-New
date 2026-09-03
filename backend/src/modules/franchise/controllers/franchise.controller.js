import { franchiseService } from '../services/franchise.service.js';

export class FranchiseController {
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await franchiseService.authenticateFranchise(email, password);
      return res.status(200).json({
        success: true,
        message: 'Franchise Admin authenticated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  provisionOrganization = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const { organization, superAdmin } = req.body;

      const result = await franchiseService.provisionOrganizationAndSuperAdmin({
        franchiseId,
        organizationData: organization,
        superAdminData: superAdmin,
      });

      return res.status(201).json({
        success: true,
        message: 'Organization and Super Admin provisioned successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getOrganizations = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const organizations = await franchiseService.getOrganizationsByFranchise(franchiseId);
      return res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (err) {
      next(err);
    }
  };

  getMetrics = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const metrics = await franchiseService.getFranchiseMetrics(franchiseId);
      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  };

  generateToken = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const { orgId } = req.params;
      const result = await franchiseService.generateSuperAdminSsoToken(franchiseId, orgId);
      return res.status(200).json({
        success: true,
        message: 'SSO token generated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  updateOrganization = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const { orgId } = req.params;
      const result = await franchiseService.updateOrganization(franchiseId, orgId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteOrganization = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id || null;
      const { orgId } = req.params;
      const result = await franchiseService.deleteOrganization(franchiseId, orgId);
      return res.status(200).json({
        success: true,
        message: 'Organization and all associated data deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id;
      const result = await franchiseService.getFranchiseProfile(franchiseId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id;
      const result = await franchiseService.updateFranchiseProfile(franchiseId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const franchiseId = req.franchise?.id;
      const result = await franchiseService.changeFranchisePassword(franchiseId, req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const franchiseController = new FranchiseController();
