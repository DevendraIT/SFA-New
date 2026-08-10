import express from "express";
import { SalesOrderRepository } from "../repositories/SalesOrderRepository.js";
import { SalesOrderService } from "../services/SalesOrderService.js";
import { SalesOrderController } from "../controllers/SalesOrderController.js";
import { InventoryRepository } from "../../inventory/repositories/inventory.repository.js";
import { InventoryService } from "../../inventory/services/inventory.service.js";
import { validate } from "../../../middlewares/validation.middleware.js";
import { authenticate, requireOrganization } from "../../../middlewares/auth.middleware.js";
import { 
  listOrdersQuerySchema, 
  createOrderSchema, 
  updateOrderSchema,
  updateOrderStatusSchema,
  bulkOrderStatusSchema,
  idParamSchema 
} from "../validators/sales-order.validation.js";
import {
  requireReadOrderPermission,
  requireCreateOrderPermission,
  requireUpdateOrderPermission,
  requireDeleteOrderPermission,
  requireApproveOrderPermission,
  loadOrder,
  requireOrderAccess,
  requireEditableOrder,
  validateStatusTransition,
  validateBusinessRules,
  checkApprovalRequirements,
  orderCreationRateLimit,
  bulkOperationRateLimit,
  auditOrderOperation,
  parsePagination,
  parseSorting,
  parseFilters,
} from "../middleware/sales-order.middleware.js";

const router = express.Router();

// Initialize dependencies
const salesOrderRepository = new SalesOrderRepository();
const inventoryRepository = new InventoryRepository();
const inventoryService = new InventoryService(inventoryRepository);
const salesOrderService = new SalesOrderService(salesOrderRepository, inventoryService);
const salesOrderController = new SalesOrderController(salesOrderService);

// Apply authentication middleware
router.use(authenticate);
router.use(requireOrganization);

// Apply audit logging to all routes
router.use(auditOrderOperation);

// --------------------------------------------------
// Order CRUD Routes
// --------------------------------------------------

/**
 * GET /orders - Get paginated list of orders
 * Query: page, limit, status, customerId, organizationId, branchId, territoryId, ownerId, fromDate, toDate, q, sortBy, sortOrder
 */
router.get('/',
  requireReadOrderPermission,
  validate({ query: listOrdersQuerySchema }),
  parsePagination,
  parseSorting,
  parseFilters,
  salesOrderController.getOrdersList
);

/**
 * POST /orders - Create new order
 */
router.post('/',
  requireCreateOrderPermission,
  orderCreationRateLimit,
  validate({ body: createOrderSchema }),
  validateBusinessRules,
  checkApprovalRequirements,
  salesOrderController.createOrder
);

/**
 * GET /orders/stats - Get order statistics
 */
router.get('/stats',
  requireReadOrderPermission,
  salesOrderController.getOrderStatistics
);

/**
 * GET /orders/export - Export orders
 */
router.get('/export',
  requireReadOrderPermission,
  salesOrderController.exportOrders
);

/**
 * GET /orders/:id - Get single order details
 */
router.get('/:id',
  requireReadOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.getOrderById
);

/**
 * PUT /orders/:id - Update existing order
 */
router.put('/:id',
  requireUpdateOrderPermission,
  validate({ 
    params: idParamSchema,
    body: updateOrderSchema 
  }),
  loadOrder,
  requireOrderAccess,
  requireEditableOrder,
  validateBusinessRules,
  salesOrderController.updateOrder
);

/**
 * DELETE /orders/:id - Delete order (soft delete)
 */
router.delete('/:id',
  requireDeleteOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.deleteOrder
);

// --------------------------------------------------
// Order Status Management Routes
// --------------------------------------------------

/**
 * PATCH /orders/:id/status - Change order status
 */
router.patch('/:id/status',
  requireUpdateOrderPermission,
  validate({ 
    params: idParamSchema,
    body: updateOrderStatusSchema 
  }),
  loadOrder,
  requireOrderAccess,
  validateStatusTransition,
  checkApprovalRequirements,
  salesOrderController.changeOrderStatus
);

/**
 * POST /orders/:id/approve - Approve order
 */
router.post('/:id/approve',
  requireApproveOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  checkApprovalRequirements,
  salesOrderController.approveOrder
);

/**
 * POST /orders/:id/reject - Reject order
 */
router.post('/:id/reject',
  requireApproveOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  checkApprovalRequirements,
  salesOrderController.rejectOrder
);

/**
 * POST /orders/:id/cancel - Cancel order
 */
router.post('/:id/cancel',
  requireUpdateOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.cancelOrder
);

/**
 * POST /orders/:id/complete - Mark order as completed
 */
router.post('/:id/complete',
  requireUpdateOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.completeOrder
);

// --------------------------------------------------
// Order Assignment Routes
// --------------------------------------------------

/**
 * POST /orders/:id/assign - Assign order to user
 */
router.post('/:id/assign',
  requireUpdateOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.assignOrder
);

// --------------------------------------------------
// Order Activity Routes
// --------------------------------------------------

/**
 * GET /orders/:id/activities - Get order activity timeline
 */
router.get('/:id/activities',
  requireReadOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.getOrderActivities
);

/**
 * POST /orders/:id/notes - Add note to order
 */
router.post('/:id/notes',
  requireUpdateOrderPermission,
  validate({ params: idParamSchema }),
  loadOrder,
  requireOrderAccess,
  salesOrderController.addNote
);

// --------------------------------------------------
// Bulk Operations Routes
// --------------------------------------------------

/**
 * POST /orders/bulk/status - Bulk update order status
 */
router.post('/bulk/status',
  requireUpdateOrderPermission,
  bulkOperationRateLimit,
  validate({ body: bulkOrderStatusSchema }),
  checkApprovalRequirements,
  salesOrderController.bulkUpdateStatus
);

/**
 * POST /orders/bulk/delete - Bulk delete orders
 */
router.post('/bulk/delete',
  requireDeleteOrderPermission,
  bulkOperationRateLimit,
  salesOrderController.bulkDeleteOrders
);

// --------------------------------------------------
// Error Handling
// --------------------------------------------------
router.use((error, req, res, next) => {
  // Handle specific sales order errors
  if (error.code === 'ORDER_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'The requested order could not be found',
      },
    });
  }
  
  // Pass to general error handler
  next(error);
});

export default router;
export { salesOrderController, salesOrderService, salesOrderRepository };
