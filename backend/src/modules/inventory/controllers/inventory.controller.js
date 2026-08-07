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
}
