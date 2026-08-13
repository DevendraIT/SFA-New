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

  async deleteProduct(productId, userContext) {
    const product = await this.inventoryRepository.findProductById(productId, userContext.organizationId);
    if (!product) throw AppError.notFound('Product not found');
    await this.inventoryRepository.deleteProduct(productId, userContext.organizationId);
    return {
      success: true,
      message: 'Product deleted successfully',
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

  // ==========================================
  // WAREHOUSE MANAGERS
  // ==========================================

  async getWarehouseManagers(userContext) {
    const managers = await this.inventoryRepository.getWarehouseManagers(userContext.organizationId);
    return { success: true, data: managers };
  }

  async getWarehouseManagerById(userId, userContext) {
    const manager = await this.inventoryRepository.getWarehouseManagerById(userId, userContext.organizationId);
    if (!manager) throw AppError.notFound('Warehouse Manager not found');
    return { success: true, data: manager };
  }

  async getWarehouseForManager(managerId, userContext) {
    let warehouse = await this.inventoryRepository.findWarehouseByManagerId(managerId, userContext.organizationId);

    const { prisma } = await import('../../../config/database.js');
    if (!warehouse) {
      const userRec = await prisma.user.findUnique({
        where: { id: managerId },
        select: { branchId: true }
      });
      if (userRec?.branchId) {
        warehouse = await prisma.warehouse.findFirst({
          where: {
            organizationId: userContext.organizationId,
            branches: { some: { id: userRec.branchId } }
          },
          include: {
            stocks: { include: { product: true } },
            branches: true
          }
        });
      }
    }

    if (!warehouse) {
      warehouse = await prisma.warehouse.findFirst({
        where: { organizationId: userContext.organizationId, isActive: true },
        include: {
          stocks: { include: { product: true } },
          branches: true
        }
      });
    }

    if (!warehouse) throw AppError.notFound('No active warehouse found in organization');

    if (!warehouse.stocks) {
      const fullWarehouse = await prisma.warehouse.findUnique({
        where: { id: warehouse.id },
        include: {
          stocks: { include: { product: true } },
          branches: true
        }
      });
      if (fullWarehouse) warehouse = fullWarehouse;
    }

    return { success: true, data: warehouse };
  }

  async getManagerForWarehouse(warehouseId, userContext) {
    const warehouse = await this.inventoryRepository.findWarehouseById(warehouseId, userContext.organizationId);
    if (!warehouse) throw AppError.notFound('Warehouse not found');

    const manager = await this.inventoryRepository.findManagerByWarehouseId(warehouseId, userContext.organizationId);
    return { success: true, data: manager };
  }

  async createWarehouseManager(data, userContext) {
    let targetUserId = data.userId;

    const { prisma } = await import('../../../config/database.js');

    // 1. If email is provided, check if user already exists in organization
    if (!targetUserId && data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          organizationId: userContext.organizationId,
          email: data.email.toLowerCase().trim()
        }
      });
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    }

    // 2. If user exists (either via userId or existing email), ensure WAREHOUSE_MANAGER role is assigned
    if (targetUserId) {
      const existingUser = await this.inventoryRepository.getWarehouseManagerById(targetUserId, userContext.organizationId);
      if (!existingUser) {
        throw AppError.notFound('User not found in this organization');
      }

      // Check if user already has WAREHOUSE_MANAGER role; if not, assign it
      const hasRole = existingUser.roles?.some(r => r.role?.name?.toLowerCase() === 'warehouse manager');
      if (!hasRole) {
        const wmRole = await this.inventoryRepository.findWarehouseManagerRole(userContext.organizationId);
        if (wmRole) {
          await prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: targetUserId,
                roleId: wmRole.id
              }
            },
            create: {
              userId: targetUserId,
              roleId: wmRole.id
            },
            update: {}
          });
        }
      }
    } else {
      // Create new user using bcrypt & prisma
      const existingRole = await this.inventoryRepository.findWarehouseManagerRole(userContext.organizationId);
      const roleId = existingRole ? existingRole.id : undefined;

      let passwordHash = data.password;
      try {
        const bcrypt = await import('bcryptjs');
        passwordHash = await bcrypt.hash(data.password, 10);
      } catch (err) {
        // Fallback
      }

      const newUser = await prisma.user.create({
        data: {
          organizationId: userContext.organizationId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase().trim(),
          passwordHash,
          phoneNumber: data.phoneNumber || null,
          emailVerifiedAt: new Date(),
          ...(roleId && {
            roles: {
              create: {
                roleId
              }
            }
          })
        }
      });
      targetUserId = newUser.id;
    }

    // 2. Assign warehouse if warehouseId is provided
    let assignedWarehouse = null;
    if (data.warehouseId) {
      const warehouse = await this.inventoryRepository.findWarehouseById(data.warehouseId, userContext.organizationId);
      if (!warehouse) throw AppError.notFound('Warehouse not found in this organization');

      // Check if manager is already assigned to another warehouse
      const existingAssignment = await this.inventoryRepository.findWarehouseByManagerId(targetUserId, userContext.organizationId);
      if (existingAssignment && existingAssignment.id !== data.warehouseId) {
        throw AppError.badRequest('This Warehouse Manager is already assigned to another warehouse. A manager can manage only ONE warehouse.');
      }

      assignedWarehouse = await this.inventoryRepository.assignWarehouseManager(data.warehouseId, targetUserId, userContext.organizationId);
    }

    const updatedUser = await this.inventoryRepository.getWarehouseManagerById(targetUserId, userContext.organizationId);

    // Format clean response without sensitive fields or managedWarehouses array
    const manager = updatedUser ? {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isActive: updatedUser.isActive,
    } : null;

    const warehouse = (assignedWarehouse || updatedUser?.managedWarehouse) ? {
      id: (assignedWarehouse || updatedUser.managedWarehouse).id,
      name: (assignedWarehouse || updatedUser.managedWarehouse).name,
      code: (assignedWarehouse || updatedUser.managedWarehouse).code,
      location: (assignedWarehouse || updatedUser.managedWarehouse).location,
      isActive: (assignedWarehouse || updatedUser.managedWarehouse).isActive,
    } : null;

    return {
      success: true,
      data: {
        manager,
        warehouse
      },
      message: 'Warehouse Manager created/assigned successfully'
    };
  }

  async assignWarehouseManager(warehouseId, warehouseManagerId, userContext) {
    // Validate warehouse exists
    const warehouse = await this.inventoryRepository.findWarehouseById(warehouseId, userContext.organizationId);
    if (!warehouse) throw AppError.notFound('Warehouse not found');

    // Validate manager exists in organization and not managing another warehouse
    if (warehouseManagerId) {
      const manager = await this.inventoryRepository.getWarehouseManagerById(warehouseManagerId, userContext.organizationId);
      if (!manager) throw AppError.notFound('Manager user not found in this organization');

      const existingAssignment = await this.inventoryRepository.findWarehouseByManagerId(warehouseManagerId, userContext.organizationId);
      if (existingAssignment && existingAssignment.id !== warehouseId) {
        throw AppError.badRequest('This Warehouse Manager is already assigned to another warehouse. A manager can manage only ONE warehouse.');
      }
    }

    const updated = await this.inventoryRepository.assignWarehouseManager(warehouseId, warehouseManagerId, userContext.organizationId);
    return { success: true, data: updated, message: 'Warehouse manager assigned successfully' };
  }

  // ==========================================
  // PRODUCT ISSUES
  // ==========================================

  async createProductIssue(data, userContext) {
    // Verify product exists in organization
    const product = await this.inventoryRepository.findProductById(data.productId, userContext.organizationId);
    if (!product) throw AppError.notFound('Product not found in this organization');

    // Verify warehouse exists in organization
    const warehouse = await this.inventoryRepository.findWarehouseById(data.warehouseId, userContext.organizationId);
    if (!warehouse) throw AppError.notFound('Warehouse not found in this organization');

    // Security Check: If user is a Warehouse Manager, ensure they can only issue from their assigned warehouse
    const userRoles = userContext.roles || [];
    const isWarehouseManagerOnly = userRoles.includes('Warehouse Manager') || userRoles.includes('WAREHOUSE_MANAGER');
    if (isWarehouseManagerOnly && warehouse.warehouseManagerId !== userContext.userId) {
      throw AppError.forbidden('You are only authorized to issue products from your assigned warehouse');
    }
    
    // Check stock availability
    const available = await this.checkAvailability(data.productId, data.warehouseId, data.quantity, userContext.organizationId);
    if (!available) throw AppError.badRequest('Insufficient available stock for this issue request');

    // Automatically resolve warehouse manager ID from request body, warehouse assigned manager, or logged in user
    const assignedManagerId = data.warehouseManagerId || warehouse.warehouseManagerId || userContext.userId;

    const issue = await this.inventoryRepository.createProductIssue({
      ...data,
      warehouseManagerId: assignedManagerId,
      organizationId: userContext.organizationId,
      status: 'PENDING',
    });
    return { success: true, data: issue, message: 'Product issue created successfully' };
  }

  async getProductIssues(queryParams, userContext) {
    const pagination = {
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 20,
    };
    const sorting = {
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
    };
    const filters = {
      organizationId: userContext.organizationId,
      ...queryParams
    };
    
    const result = await this.inventoryRepository.getProductIssues(filters, pagination, sorting);
    return { success: true, data: result };
  }

  async getProductIssueById(issueId, userContext) {
    const issue = await this.inventoryRepository.getProductIssueById(issueId, userContext.organizationId);
    if (!issue) throw AppError.notFound('Product issue not found');
    return { success: true, data: issue };
  }

  async updateProductIssueStatus(issueId, updateData, userContext) {
    const issue = await this.inventoryRepository.getProductIssueById(issueId, userContext.organizationId);
    if (!issue) throw AppError.notFound('Product issue not found');

    if (updateData.status === 'ISSUED' && issue.status !== 'ISSUED') {
      // Must reduce stock
      await this.reduceStock({
        productId: issue.productId,
        warehouseId: issue.warehouseId,
        quantity: issue.quantity,
        referenceId: issue.id,
        notes: `Product issued to sales executive ${issue.salesExecutiveId}`
      }, userContext);

      // Extract task ID if present in issue notes and update task status
      if (issue.notes && issue.notes.includes('Ref: ')) {
        try {
          const match = issue.notes.match(/Ref:\s*([a-f0-9\-]+)/i);
          if (match && match[1]) {
            const taskId = match[1];
            const { prisma } = await import('../../../config/database.js');
            const currentTask = await prisma.task.findUnique({ where: { id: taskId }, select: { metadata: true } });
            const existingMeta = typeof currentTask?.metadata === 'object' && currentTask?.metadata !== null ? currentTask.metadata : {};
            await prisma.task.update({
              where: { id: taskId },
              data: {
                status: 'DELIVERY_IN_PROGRESS',
                metadata: {
                  ...existingMeta,
                  pickupStatus: 'PICKED_UP',
                  stockPickedUpAt: new Date().toISOString(),
                }
              }
            }).catch(e => console.warn('Task status update warning:', e.message));
          }
        } catch (e) {
          console.warn('Failed to update task status on product issue:', e);
        }
      }
    } else if (updateData.status === 'RETURNED' && issue.status === 'ISSUED') {
      // Add stock back
      await this.addStock({
        productId: issue.productId,
        warehouseId: issue.warehouseId,
        quantity: issue.quantity,
        referenceId: issue.id,
        notes: `Product returned by sales executive ${issue.salesExecutiveId}`
      }, userContext);
    }

    const updated = await this.inventoryRepository.updateProductIssueStatus(issueId, userContext.organizationId, updateData.status, updateData.notes);
    return { success: true, data: updated, message: 'Product issue status updated' };
  }

  // ==========================================
  // STOCK MOVEMENTS READ LEDGER
  // ==========================================

  async getStockMovements(queryParams, userContext) {
    const pagination = {
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 100,
    };
    const sorting = {
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
    };
    const filters = {
      organizationId: userContext.organizationId,
      ...queryParams
    };

    const userRoles = userContext.roles || [];
    const isWM = userRoles.includes('Warehouse Manager') || userRoles.includes('WAREHOUSE_MANAGER');
    if (isWM) {
      const assignedWh = await this.inventoryRepository.findWarehouseByManagerId(userContext.userId, userContext.organizationId);
      if (assignedWh) {
        filters.warehouseId = assignedWh.id;
      }
    }

    const result = await this.inventoryRepository.getStockMovements(filters, pagination, sorting);
    return { success: true, data: result };
  }
}
