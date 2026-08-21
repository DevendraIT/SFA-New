import { Router } from 'express';
import { FieldForceController } from './field-force.controller.js';
import { FieldForceService } from './field-force.service.js';
import { FieldForceRepository } from './field-force.repository.js';
import { authenticate, requireOrganization } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validation.middleware.js';
import { uploadPhoto } from '../../middlewares/upload.middleware.js';
import {
  checkInSchema,
  planVisitSchema,
  completeVisitSchema,
  logExpenseSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} from './field-force.validation.js';

const router = Router();

const repo = new FieldForceRepository();
const service = new FieldForceService(repo);
const controller = new FieldForceController(service);

router.use(authenticate, requireOrganization);

// ===== FILE UPLOAD =====
router.post('/upload', uploadPhoto.single('photo'), controller.uploadFile);

// ===== VISITS =====
router.post('/visits', validate(planVisitSchema), controller.planVisit);
router.get('/visits', controller.listVisitsData);
router.get('/visits/:id', controller.getVisitDetail);
router.post('/visits/:id/start', controller.startVisit);
router.post('/visits/:id/complete', validate(completeVisitSchema), controller.completeVisit);
router.post('/visits/:id/notes', controller.addVisitNotes);
router.post('/visits/:id/photo', controller.uploadVisitPhoto);

// ===== EXPENSES =====
router.post('/expenses', validate(logExpenseSchema), controller.logExpense);
router.get('/expenses', controller.listExpensesData);
router.get('/expenses/:id', controller.getExpenseDetail);
router.patch('/expenses/:id/approve', controller.approveExpenseDetail);
router.patch('/expenses/:id/reject', controller.rejectExpenseDetail);

// ===== DAILY ACTIVITY REPORT =====
router.post('/dar', controller.generateDar);
router.get('/dar', controller.listDailyActivityReportsData);
router.get('/dar/:id', controller.getDailyActivityReportDetail);
router.patch('/dar/:id/submit', controller.submitDailyActivityReport);
router.patch('/dar/:id/approve', controller.approveDailyActivityReport);

// ===== TASKS =====
router.post(
  '/tasks',
  authenticate,
  validate(createTaskSchema),
  controller.createTask
);
router.get('/tasks', controller.listTasksData);
router.get('/tasks/:id', controller.getTaskDetail);
router.get('/tasks/:id/route', controller.getTaskRoute);
router.patch('/tasks/:id/status', validate(updateTaskStatusSchema), controller.updateTaskStatus);
router.patch('/tasks/:id/complete', controller.completeTaskDetail);
router.post('/tasks/:id/send-delivery-otp', controller.sendDeliveryOtp);
router.post('/tasks/:id/verify-delivery-otp', controller.verifyDeliveryOtp);

// ===== BEAT PLANS =====
router.post('/beat-plans', controller.createBeatPlan);
router.post('/beat-plans/assign', controller.assignBeatPlan);
router.get('/beat-plans', controller.listBeatPlansData);
router.get('/beat-plans/:id', controller.getBeatPlanDetail);
router.post('/beat-plans/:id/approve', controller.approveBeatPlan);

// ===== CALENDAR =====
router.post('/calendar', controller.createCalendarEvent);
router.get('/calendar', controller.listCalendarEventsData);
router.get('/calendar/:id', controller.getCalendarEventDetail);

// ===== ROUTE OPTIMIZATION =====
router.post('/route/optimize', controller.optimizeRoute);

// router.get("/tomtom-test", authenticate, controller.testTomTom);

// ===== ANALYTICS & SUMMARIES =====
router.get('/analytics/visits', controller.getVisitsSummary);
router.get('/analytics/expenses', controller.getExpenseSummary);

export default router;