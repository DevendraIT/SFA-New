import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireOrganization } from '../../../middlewares/auth.middleware.js';
import { AppError } from '../../../shared/response.js';
import { CRMIntegrationRepository } from '../repositories/crm-integration.repository.js';
import { CRMIntegrationService } from '../services/crm-integration.service.js';
import { CRMIntegrationController } from '../controllers/crm-integration.controller.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];
    const isExcel =
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls');

    if (isExcel) {
      cb(null, true);
    } else {
      cb(new AppError('Only .xlsx and .xls Excel files are allowed!'), false);
    }
  },
});

const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return next(
          AppError.badRequest(
            `Upload error: ${err.message}. Please select file key 'file' and attach a valid .xlsx or .xls file.`
          )
        );
      }
      return next(err);
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find((f) => f.fieldname === 'file') || req.files[0];
    }
    next();
  });
};

export const requireCRMUploadAccess = (req, res, next) => {
  try {
    if (!req.user || !req.user.roles) {
      throw AppError.unauthorized('Authentication required');
    }

    if (process.env.SKIP_PERMISSION_CHECK === 'true') {
      return next();
    }

    const userRoles = req.user.roles.map((r) => (r ? r.toLowerCase() : ''));

    const allowedKeywords = [
      'sales manager',
      'manager',
      'head of sales',
      'admin',
      'super admin',
      'organization super admin',
      'company admin',
    ];

    const hasAccess = userRoles.some((role) =>
      allowedKeywords.some((allowed) => role.includes(allowed))
    );

    if (!hasAccess) {
      throw AppError.forbidden(
        'Permission denied: Only Sales Managers and Admins are authorized to upload CRM Excel files.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

const repo = new CRMIntegrationRepository();
const service = new CRMIntegrationService(repo);
const controller = new CRMIntegrationController(service);

const router = Router();

router.use(authenticate, requireOrganization);

// Upload & Import (Restricted to Sales Managers and Admins)
router.post('/import', requireCRMUploadAccess, handleUpload, controller.importExcel);

// Import History & Details
router.get('/imports', controller.listImports);
router.get('/imports/:id', controller.getImportById);

// Manual Mapping Endpoints
router.patch('/import-rows/:id/product', controller.mapProduct);
router.patch('/import-rows/:id/branch', controller.mapBranch);
router.patch('/import-rows/:id/territory', controller.mapTerritory);

// Template & Export
router.get('/template', controller.getTemplate);
router.get('/export', controller.exportData);

export default router;
