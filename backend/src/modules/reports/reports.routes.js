import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReportsRepository } from './reports.repository.js';
import { authenticate, requireOrganization, authorize } from '../../middlewares/auth.middleware.js';
import { SYSTEM_PERMISSIONS } from '../permissions/constants/permission.constants.js';

const router = Router();

const repo = new ReportsRepository();
const service = new ReportsService(repo);
const controller = new ReportsController(service);

router.use(authenticate, requireOrganization);

router.get('/export', controller.downloadReport);
router.get('/forecast', authorize([SYSTEM_PERMISSIONS.VIEW_FORECAST]), controller.getForecast);

export default router;
