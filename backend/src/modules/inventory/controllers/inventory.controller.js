import { asyncHandler } from '../../../middlewares/error.middleware.js';

export class InventoryController {
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  getProductsList = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getProductsList(req.query, req.user);
    res.json(result);
  });

  getProductById = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getProductById(req.params.id, req.user);
    res.json(result);
  });

  createProduct = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.createProduct(req.body, req.user);
    res.status(201).json(result);
  });

  updateProduct = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.updateProduct(req.params.id, req.body, req.user);
    res.json(result);
  });

  deleteProduct = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.deleteProduct(req.params.id, req.user);
    res.json(result);
  });

  // ==========================================
  // WAREHOUSES
  // ==========================================

  getWarehouses = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getWarehouses(req.user);
    res.json(result);
  });

  createWarehouse = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.createWarehouse(req.body, req.user);
    res.status(201).json(result);
  });

  updateWarehouse = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.updateWarehouse(req.params.id, req.body, req.user);
    res.json(result);
  });

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  addStock = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.addStock(req.body, req.user);
    res.json(result);
  });

  reduceStock = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.reduceStock(req.body, req.user);
    res.json(result);
  });

  transferStock = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.transferStock(req.body, req.user);
    res.json(result);
  });

  // ==========================================
  // WAREHOUSE MANAGERS
  // ==========================================

  createWarehouseManager = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.createWarehouseManager(req.body, req.user);
    res.status(201).json(result);
  });

  getWarehouseManagers = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getWarehouseManagers(req.user);
    res.json(result);
  });

  getWarehouseManagerById = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getWarehouseManagerById(req.params.id, req.user);
    res.json(result);
  });

  getWarehouseForManager = asyncHandler(async (req, res) => {
    const targetId = req.params.id === 'me' ? (req.user?.id || req.user?.userId) : req.params.id;
    const result = await this.inventoryService.getWarehouseForManager(targetId, req.user);
    res.json(result);
  });

  assignWarehouseManager = asyncHandler(async (req, res) => {
    const warehouseId = req.params.warehouseId || req.params.id;
    const result = await this.inventoryService.assignWarehouseManager(warehouseId, req.body.userId, req.user);
    res.json(result);
  });

  updateWarehouseManager = asyncHandler(async (req, res) => {
    const warehouseId = req.params.warehouseId || req.params.id;
    const result = await this.inventoryService.assignWarehouseManager(warehouseId, req.body.userId || null, req.user);
    res.json(result);
  });

  getManagerForWarehouse = asyncHandler(async (req, res) => {
    const warehouseId = req.params.warehouseId || req.params.id;
    const result = await this.inventoryService.getManagerForWarehouse(warehouseId, req.user);
    res.json(result);
  });

  // ==========================================
  // PRODUCT ISSUES
  // ==========================================

  createProductIssue = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.createProductIssue(req.body, req.user);
    res.status(201).json(result);
  });

  getProductIssues = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getProductIssues(req.query, req.user);
    res.json(result);
  });

  getProductIssueById = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getProductIssueById(req.params.id, req.user);
    res.json(result);
  });

  updateProductIssueStatus = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.updateProductIssueStatus(req.params.id, req.body, req.user);
    res.json(result);
  });

  // ==========================================
  // STOCK MOVEMENTS
  // ==========================================

  getStockMovements = asyncHandler(async (req, res) => {
    const result = await this.inventoryService.getStockMovements(req.query, req.user);
    res.json(result);
  });
}
