import express from 'express';
import { franchiseController } from './controllers/franchise.controller.js';
import { requireFranchiseAdmin } from './middlewares/franchise.middleware.js';

const router = express.Router();

// 1. Franchise Authentication
router.post('/login', franchiseController.login);

// 2. Organization Provisioning, Listing, Update & Delete (Protected)
router.post('/organizations', requireFranchiseAdmin, franchiseController.provisionOrganization);
router.get('/organizations', requireFranchiseAdmin, franchiseController.getOrganizations);
router.put('/organizations/:orgId', requireFranchiseAdmin, franchiseController.updateOrganization);
router.delete('/organizations/:orgId', requireFranchiseAdmin, franchiseController.deleteOrganization);
router.get('/metrics', requireFranchiseAdmin, franchiseController.getMetrics);

// 3. IT360 Direct SSO Token Generation
router.post('/organizations/:orgId/generate-token', requireFranchiseAdmin, franchiseController.generateToken);

// 4. Franchise Profile & Settings
router.get('/profile', requireFranchiseAdmin, franchiseController.getProfile);
router.put('/profile', requireFranchiseAdmin, franchiseController.updateProfile);
router.post('/change-password', requireFranchiseAdmin, franchiseController.changePassword);

export default router;
