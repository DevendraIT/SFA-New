import { Router } from 'express';
import { TargetPerformanceController } from './target-performance.controller.js';
import { TargetPerformanceService } from './target-performance.service.js';
import { TargetPerformanceRepository } from './target-performance.repository.js';
import { authenticate, requireOrganization, authorize } from '../../middlewares/auth.middleware.js';
import { SYSTEM_PERMISSIONS } from '../permissions/constants/permission.constants.js';
import validate from '../../middlewares/validation.middleware.js';
import { createTargetSchema } from './target-performance.validation.js';

const router = Router();
const repo = new TargetPerformanceRepository();
export const targetPerformanceService = new TargetPerformanceService(repo);
const controller = new TargetPerformanceController(targetPerformanceService);

router.use(authenticate, requireOrganization);

router.get('/targets', controller.getTargets);
router.post('/targets', validate(createTargetSchema), controller.createTarget);
router.post('/targets/plan', authorize([SYSTEM_PERMISSIONS.MANAGE_TARGETS]), controller.planTargets);
router.get('/leaderboard', controller.getLeaderboard);
router.get('/company-overview', controller.getCompanyOverview);

export default router;
