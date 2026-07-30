import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardRepository } from './dashboard.repository.js';
import { authenticate, requireOrganization, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

const repo = new DashboardRepository();
const service = new DashboardService(repo);
const controller = new DashboardController(service);

router.use(authenticate, requireOrganization);

router.get('/superadmin', controller.getSuperAdminDashboard);
router.get('/head-of-sales', controller.getHeadOfSalesDashboard);
router.get('/sales-managers-count', controller.getSalesManagerCount);
router.get('/present-sales-managers-count', controller.getPresentSalesManagerCount);
router.get('/executive', controller.getExecutiveDashboard);

router.get('/team', authorize(['analytics:team']), controller.getTeamDashboard);
router.get('/manager', controller.getManagerDashboard);
router.get('/me', controller.getUserDashboard);



export default router;

