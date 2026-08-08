import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller.js';
import { InventoryService } from '../services/inventory.service.js';
import { InventoryRepository } from '../repositories/inventory.repository.js';
import { authenticate, requireOrganization, authorize } from '../../../middlewares/auth.middleware.js';
import validate from '../../../middlewares/validation.middleware.js';
import { INVENTORY_PERMISSIONS } from '../permissions/inventory.permissions.js';
import {
  createProductSchema,
  updateProductSchema,
  updateBasicProductSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  addStockSchema,
  reduceStockSchema,
  transferStockSchema,
  assignWarehouseManagerSchema,
  createWarehouseManagerSchema,
  updateWarehouseManagerSchema,
  createProductIssueSchema,
  updateProductIssueSchema
} from '../validators/inventory.validation.js';

const router = Router();

const repo = new InventoryRepository();
const service = new InventoryService(repo);
const controller = new InventoryController(service);

router.use(authenticate, requireOrganization);

// ===== PRODUCTS =====
router.get(
  '/products',
  authorize([INVENTORY_PERMISSIONS.READ_PRODUCTS]),
  controller.getProductsList
);

router.get(
  '/products/:id',
  authorize([INVENTORY_PERMISSIONS.READ_PRODUCTS]),
  controller.getProductById
);

router.post(
  '/products',
  authorize([INVENTORY_PERMISSIONS.CREATE_PRODUCTS]),
  validate(createProductSchema),
  controller.createProduct
);

router.put(
  '/products/:id',
  authorize([INVENTORY_PERMISSIONS.UPDATE_PRODUCTS]),
  validate(updateProductSchema),
  controller.updateProduct
);

router.patch(
  '/products/:id/basic',
  authorize([INVENTORY_PERMISSIONS.UPDATE_BASIC_PRODUCTS, INVENTORY_PERMISSIONS.UPDATE_PRODUCTS]),
  validate(updateBasicProductSchema),
  controller.updateProduct
);

// ===== WAREHOUSES =====
router.get(
  '/warehouses',
  authorize([INVENTORY_PERMISSIONS.READ_WAREHOUSES]),
  controller.getWarehouses
);

router.post(
  '/warehouses',
  authorize([INVENTORY_PERMISSIONS.CREATE_WAREHOUSES]),
  validate(createWarehouseSchema),
  controller.createWarehouse
);

router.put(
  '/warehouses/:id',
  authorize([INVENTORY_PERMISSIONS.UPDATE_WAREHOUSES]),
  validate(updateWarehouseSchema),
  controller.updateWarehouse
);

// ===== STOCK MANAGEMENT =====
router.post(
  '/stock/add',
  authorize([INVENTORY_PERMISSIONS.MANAGE_STOCK]),
  validate(addStockSchema),
  controller.addStock
);

router.post(
  '/stock/reduce',
  authorize([INVENTORY_PERMISSIONS.MANAGE_STOCK]),
  validate(reduceStockSchema),
  controller.reduceStock
);

router.post(
  '/stock/transfer',
  authorize([INVENTORY_PERMISSIONS.MANAGE_STOCK]),
  validate(transferStockSchema),
  controller.transferStock
);

// ===== WAREHOUSE MANAGERS =====
router.post(
  '/warehouse-managers',
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS]),
  validate(createWarehouseManagerSchema),
  controller.createWarehouseManager
);

router.get(
  '/warehouse-managers',
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS]),
  controller.getWarehouseManagers
);

router.get(
  '/warehouse-managers/:id',
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS]),
  controller.getWarehouseManagerById
);

router.get(
  '/warehouse-managers/:id/warehouse',
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS, INVENTORY_PERMISSIONS.READ_WAREHOUSES]),
  controller.getWarehouseForManager
);

router.post(
  ['/warehouses/:warehouseId/manager', '/warehouses/:id/manager'],
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS]),
  validate(assignWarehouseManagerSchema),
  controller.assignWarehouseManager
);

router.patch(
  ['/warehouses/:warehouseId/manager', '/warehouses/:id/manager'],
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS]),
  validate(updateWarehouseManagerSchema),
  controller.updateWarehouseManager
);

router.get(
  ['/warehouses/:warehouseId/manager', '/warehouses/:id/manager'],
  authorize([INVENTORY_PERMISSIONS.MANAGE_WAREHOUSE_MANAGERS, INVENTORY_PERMISSIONS.READ_WAREHOUSES]),
  controller.getManagerForWarehouse
);

// ===== PRODUCT ISSUES =====
router.post(
  ['/product-issues', '/product-issue'],
  authorize([INVENTORY_PERMISSIONS.MANAGE_PRODUCT_ISSUES]),
  validate(createProductIssueSchema),
  controller.createProductIssue
);

router.get(
  ['/product-issues', '/product-issue'],
  authorize([INVENTORY_PERMISSIONS.READ_PRODUCT_ISSUES]),
  controller.getProductIssues
);

router.get(
  ['/product-issues/:id', '/product-issue/:id'],
  authorize([INVENTORY_PERMISSIONS.READ_PRODUCT_ISSUES]),
  controller.getProductIssueById
);

router.patch(
  ['/product-issues/:id/status', '/product-issue/:id/status'],
  authorize([INVENTORY_PERMISSIONS.MANAGE_PRODUCT_ISSUES]),
  validate(updateProductIssueSchema),
  controller.updateProductIssueStatus
);

export default router;
