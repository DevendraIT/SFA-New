import { AppError } from '../../../shared/response.js';
import { ProductListDto, ProductDetailsDto, WarehouseDto, StockMovementDto } from '../dto/inventory.dto.js';
import { InventoryEventPublisher } from '../events/inventory.events.js';
import { STOCK_MOVEMENT_TYPE, PRODUCT_STATUS } from '../constants/inventory.constants.js';

export class InventoryService {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  async getProductsList(queryParams, userContext) {
    const filters = {
      organizationId: userContext.organizationId,
      isActive: queryParams.isActive !== undefined ? queryParams.isActive === 'true' : undefined,
      category: queryParams.category,
      brand: queryParams.brand,
    };

    const pagination = {
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 20,
    };

    const sorting = {
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
    };

    const { products, total } = await this.inventoryRepository.findProducts(
      filters,
      pagination,
      sorting,
      queryParams.q
    );

    return {
      success: true,
      data: {
        products: products.map(p => new ProductListDto(p)),
        pagination: {
          ...pagination,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    };
  }

  async getProductById(productId, userContext) {
    const product = await this.inventoryRepository.findProductById(productId, userContext.organizationId, true);

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    return {
      success: true,
      data: new ProductDetailsDto(product),
    };
  }

  async createProduct(productData, userContext) {
    const data = {
      ...productData,
      organizationId: userContext.organizationId,
    };

    const product = await this.inventoryRepository.createProduct(data);

    InventoryEventPublisher.emitProductCreated(product, userContext.userId, userContext.organizationId);

    return {
      success: true,
      data: new ProductDetailsDto(product),
      message: 'Product created successfully',
    };
  }

  async updateProduct(productId, updateData, userContext) {
    const existing = await this.inventoryRepository.findProductById(productId, userContext.organizationId);
    if (!existing) {
      throw AppError.notFound('Product not found');
    }

    const product = await this.inventoryRepository.updateProduct(productId, userContext.organizationId, updateData);

    InventoryEventPublisher.emitProductUpdated(product, updateData, userContext.userId, userContext.organizationId);

    return {
      success: true,
      data: new ProductDetailsDto(product),
      message: 'Product updated successfully',
    };
  }

  // ==========================================
  // WAREHOUSES
  // ==========================================

  async getWarehouses(userContext) {
    const warehouses = await this.inventoryRepository.findWarehouses(userContext.organizationId);
    return {
      success: true,
      data: warehouses.map(w => new WarehouseDto(w)),
    };
  }

  async createWarehouse(data, userContext) {
    const warehouse = await this.inventoryRepository.createWarehouse({
      ...data,
      organizationId: userContext.organizationId,
    });
    return {
      success: true,
      data: new WarehouseDto(warehouse),
      message: 'Warehouse created successfully',
    };
  }

  async updateWarehouse(warehouseId, data, userContext) {
    const warehouse = await this.inventoryRepository.updateWarehouse(warehouseId, userContext.organizationId, data);
    return {
      success: true,
      data: new WarehouseDto(warehouse),
      message: 'Warehouse updated successfully',
    };
  }

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  // Exposed for SalesOrderService and Workflow Integration
  async checkAvailability(productId, warehouseId, requiredQuantity, organizationId) {
    const stock = await this.inventoryRepository.getStock(productId, warehouseId, organizationId);
    if (!stock) return false;

    const available = stock.quantity - stock.reservedQuantity;
    return available >= requiredQuantity;
  }

  // Exposed for SalesOrderService
  async reserveStock(productId, warehouseId, quantity, referenceId, userContext) {
    try {
      const result = await this.inventoryRepository.executeStockTransaction(
        productId,
        warehouseId,
        userContext.organizationId,
        STOCK_MOVEMENT_TYPE.RESERVE,
        quantity,
        referenceId,
        userContext.userId,
        `Order reservation for ${referenceId}`
      );

      InventoryEventPublisher.emitStockReserved(productId, warehouseId, quantity, referenceId, userContext.userId, userContext.organizationId);

      return { success: true, data: result };
    } catch (error) {
      throw AppError.badRequest('Failed to reserve stock: ' + error.message);
    }
  }

  // Exposed for SalesOrderService (e.g. order cancelled)
  async releaseStock(productId, warehouseId, quantity, referenceId, userContext) {
    try {
      // Releasing stock is essentially reducing the reserved quantity without changing actual quantity
      // We can model this as a negative RESERVE or just direct update
      const result = await this.inventoryRepository.upsertStock(productId, warehouseId, userContext.organizationId, 0, -quantity);

      // Log it
      await this.inventoryRepository.logStockMovement({
        organizationId: userContext.organizationId,
        productId,
        warehouseId,
        type: 'REDUCE', // Custom logical mapping
        quantity: -quantity, // Just to denote release in logs if needed, but keeping it simple
        referenceId,
        performedBy: userContext.userId,
        notes: `Released reservation for ${referenceId}`
      });

      return { success: true, data: result };
    } catch (error) {
      throw AppError.badRequest('Failed to release stock: ' + error.message);
    }
  }

  // Exposed for SalesOrderService (e.g. order completed)
  async commitStock(productId, warehouseId, quantity, referenceId, userContext) {
    try {
      const result = await this.inventoryRepository.executeStockTransaction(
        productId,
        warehouseId,
        userContext.organizationId,
        STOCK_MOVEMENT_TYPE.CONSUME,
        quantity,
        referenceId,
        userContext.userId,
        `Order consumed for ${referenceId}`
      );

      return { success: true, data: result };
    } catch (error) {
      throw AppError.badRequest('Failed to commit stock: ' + error.message);
    }
  }

  // API Methods for Inventory Manager
  async addStock(data, userContext) {
    try {
      const result = await this.inventoryRepository.executeStockTransaction(
        data.productId,
        data.warehouseId,
        userContext.organizationId,
        STOCK_MOVEMENT_TYPE.ADD,
        data.quantity,
        data.referenceId || null,
        userContext.userId,
        data.notes || 'Manual stock add'
      );

      InventoryEventPublisher.emitStockAdded(data.productId, data.warehouseId, data.quantity, userContext.userId, userContext.organizationId);

      return { success: true, message: 'Stock added successfully' };
    } catch (error) {
      throw AppError.badRequest(error.message);
    }
  }

  async reduceStock(data, userContext) {
    try {
      await this.inventoryRepository.executeStockTransaction(
        data.productId,
        data.warehouseId,
        userContext.organizationId,
        STOCK_MOVEMENT_TYPE.REDUCE,
        data.quantity,
        data.referenceId || null,
        userContext.userId,
        data.notes || 'Manual stock reduction'
      );

      // Check low stock
      const product = await this.inventoryRepository.findProductById(data.productId, userContext.organizationId, true);
      const stock = product.stocks.find(s => s.warehouse.id === data.warehouseId);
      if (stock && product.minimumStock && (stock.quantity - stock.reservedQuantity) <= product.minimumStock) {
        InventoryEventPublisher.emitStockLow(data.productId, data.warehouseId, stock.quantity, product.minimumStock, userContext.organizationId);
      }

      return { success: true, message: 'Stock reduced successfully' };
    } catch (error) {
      throw AppError.badRequest(error.message);
    }
  }

  async transferStock(data, userContext) {
    try {
      await this.inventoryRepository.executeTransferTransaction(
        data.productId,
        data.fromWarehouseId,
        data.toWarehouseId,
        userContext.organizationId,
        data.quantity,
        userContext.userId,
        data.notes
      );

      InventoryEventPublisher.emitStockTransferred(data.productId, data.fromWarehouseId, data.toWarehouseId, data.quantity, userContext.userId, userContext.organizationId);

      return { success: true, message: 'Stock transferred successfully' };
    } catch (error) {
      throw AppError.badRequest(error.message);
    }
  }
}
