import express from 'express';
import { authenticate, requireOrganization } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/auth.middleware.js';
import validate from '../../../middlewares/validation.middleware.js';
import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { OrganizationService } from '../services/organization.service.js';
import { OrganizationController } from '../controllers/organization.controller.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createBranchSchema,
  updateBranchSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createTerritorySchema,
  updateTerritorySchema,
  listQuerySchema,
  listOrganizationsQuerySchema,
  idParamSchema,
} from '../validators/organization.validation.js';
import ORGANIZATION_PERMISSIONS from '../permissions/organization.permission.js';

const router = express.Router();

const organizationRepository = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);
const organizationController = new OrganizationController(organizationService);

// All routes require authentication and an active organization context
router.use(authenticate, requireOrganization);

const P = ORGANIZATION_PERMISSIONS;

// --------------------------------------------------
// Organization (current tenant)
// --------------------------------------------------

// Get current organization - no special permission needed, user is in org context
router.get(
  '/current',
  organizationController.getOrganization
);

// Update current organization - only org admins
router.put(
  '/current',
  authorize(P.UPDATE_ORGANIZATION),
  validate(updateOrganizationSchema, 'body'),
  organizationController.updateOrganization
);

// List all organizations
router.get(
  '/',
  authorize(P.READ_ORGANIZATION),
  validate(listOrganizationsQuerySchema, 'query'),
  organizationController.listOrganizations
);


router.get(
  '/branches',
  authorize(P.READ_BRANCHES),
  validate(listQuerySchema, 'query'),
  organizationController.listBranches
);

router.get(
  '/departments',
  authorize(P.READ_DEPARTMENTS),
  validate(listQuerySchema, 'query'),
  organizationController.listDepartments
);

router.get(
  '/territories',
  authorize(P.READ_TERRITORIES),
  validate(listQuerySchema, 'query'),
  organizationController.listTerritories
);


// Create new organization
router.post(
  '/',
  authorize(P.CREATE_ORGANIZATION),
  validate(createOrganizationSchema, 'body'),
  organizationController.createOrganization
);

// Get specific organization by ID - MUST come after /current and /statistics
router.get(
  '/:id',
  authorize(P.READ_ORGANIZATION),
  validate(idParamSchema, 'params'),
  organizationController.getOrganization
);

router.get(
  '/:id/statistics',
  authorize(P.READ_ORGANIZATION),
  validate(idParamSchema, 'params'),
  organizationController.getStatistics
);

router.patch(
  '/:id/activate',
  authorize(P.UPDATE_ORGANIZATION),
  validate(idParamSchema, 'params'),
  organizationController.activateOrganization
);

router.patch(
  '/:id/deactivate',
  authorize(P.UPDATE_ORGANIZATION),
  validate(idParamSchema, 'params'),
  organizationController.deactivateOrganization
);

router.delete(
  '/:id',
  authorize(P.DELETE_ORGANIZATION),
  validate(idParamSchema, 'params'),
  organizationController.deleteOrganization
);

// --------------------------------------------------
// Branches
// --------------------------------------------------


router.post(
  '/branches',
  authorize(P.CREATE_BRANCH),
  validate(createBranchSchema, 'body'),
  organizationController.createBranch
);

router.get(
  '/branches/:id',
  authorize(P.READ_BRANCHES),
  validate(idParamSchema, 'params'),
  organizationController.getBranch
);

router.put(
  '/branches/:id',
  authorize(P.UPDATE_BRANCH),
  validate(idParamSchema, 'params'),
  validate(updateBranchSchema, 'body'),
  organizationController.updateBranch
);

router.delete(
  '/branches/:id',
  authorize(P.DELETE_BRANCH),
  validate(idParamSchema, 'params'),
  organizationController.deleteBranch
);

router.patch(
  '/branches/:id/restore',
  authorize(P.UPDATE_BRANCH),
  validate(idParamSchema, 'params'),
  organizationController.restoreBranch
);

// --------------------------------------------------
// Departments
// --------------------------------------------------


router.post(
  '/departments',
  authorize(P.CREATE_DEPARTMENT),
  validate(createDepartmentSchema, 'body'),
  organizationController.createDepartment
);

router.get(
  '/departments/:id',
  authorize(P.READ_DEPARTMENTS),
  validate(idParamSchema, 'params'),
  organizationController.getDepartment
);

router.put(
  '/departments/:id',
  authorize(P.UPDATE_DEPARTMENT),
  validate(idParamSchema, 'params'),
  validate(updateDepartmentSchema, 'body'),
  organizationController.updateDepartment
);

router.delete(
  '/departments/:id',
  authorize(P.DELETE_DEPARTMENT),
  validate(idParamSchema, 'params'),
  organizationController.deleteDepartment
);

router.patch(
  '/departments/:id/restore',
  authorize(P.UPDATE_DEPARTMENT),
  validate(idParamSchema, 'params'),
  organizationController.restoreDepartment
);

// --------------------------------------------------
// Territories
// --------------------------------------------------


router.post(
  '/territories',
  authorize(P.CREATE_TERRITORY),
  validate(createTerritorySchema, 'body'),
  organizationController.createTerritory
);

router.get(
  '/territories/:id',
  authorize(P.READ_TERRITORIES),
  validate(idParamSchema, 'params'),
  organizationController.getTerritory
);

router.put(
  '/territories/:id',
  authorize(P.UPDATE_TERRITORY),
  validate(idParamSchema, 'params'),
  validate(updateTerritorySchema, 'body'),
  organizationController.updateTerritory
);

router.delete(
  '/territories/:id',
  authorize(P.DELETE_TERRITORY),
  validate(idParamSchema, 'params'),
  organizationController.deleteTerritory
);

router.patch(
  '/territories/:id/restore',
  authorize(P.UPDATE_TERRITORY),
  validate(idParamSchema, 'params'),
  organizationController.restoreTerritory
);

export default router;
export { organizationController, organizationService, organizationRepository };
