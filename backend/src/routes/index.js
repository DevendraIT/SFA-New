import express from "express";
import swaggerUi from "swagger-ui-express";
import config from "../config/env.js";
import swaggerSpec from "../config/swagger.js";
import healthRouter from "./health.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    name: "SFA (Sales Force Automation) API",
    version: config.API_VERSION,
    status: "healthy",
    docs: `/api/${config.API_VERSION}/docs`,
  });
});

if (config.SWAGGER_ENABLED) {
  router.use("/docs", swaggerUi.serve);
  router.get("/docs", swaggerUi.setup(swaggerSpec));
}

router.use("/health", healthRouter);

// Auth
import authRouter from "../modules/auth/index.js";
router.use("/auth", authRouter);

// Organization Setup
import organizationRouter from "../modules/organization/index.js";
router.use("/organization", organizationRouter);

// Teams
import teamRouter from "../modules/team/index.js";
router.use("/teams", teamRouter);

// Roles
import roleRouter from "../modules/roles/index.js";
router.use("/roles", roleRouter);

// Users
import usersRouter from "../modules/users/index.js";
router.use("/users", usersRouter);


// Customers
import customerRouter from "../modules/customers/index.js";
router.use("/customers", customerRouter);

// Inventory
import inventoryRouter from "../modules/inventory/index.js";
router.use("/inventory", inventoryRouter);

// Sales Orders
import salesOrderRouter from "../modules/sales-order/index.js";
router.use("/orders", salesOrderRouter);

// Permissions
import permissionRouter from "../modules/permissions/index.js";
router.use("/permissions", permissionRouter);

// AI Lead Engine removed

// Field Force
import fieldForceRouter from "../modules/field-force/index.js";
router.use("/field-force", fieldForceRouter);

// Target & Performance
import targetPerformanceRouter from "../modules/target-performance/index.js";
router.use("/target-performance", targetPerformanceRouter);

// Dashboard
import dashboardRouter from "../modules/dashboard/index.js";
router.use("/dashboard", dashboardRouter);

// Reports
import reportsRouter from "../modules/reports/index.js";
router.use("/reports", reportsRouter);

// Notifications
import notificationsRouter from "../modules/notifications/index.js";
router.use("/notifications", notificationsRouter);

// CRM Integration
import crmIntegrationRouter from "../modules/crm-integration/index.js";
router.use("/crm-integration", crmIntegrationRouter);

export default router;
