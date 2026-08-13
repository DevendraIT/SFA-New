import { prisma } from '../../../config/database.js';

export class InventoryRepository {
  
  // ==========================================
  // PRODUCTS
  // ==========================================

  async findProducts(filters, pagination, sorting, searchTerm) {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.category && { category: filters.category }),
      ...(filters.brand && { brand: filters.brand }),
    };

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { productCode: { contains: searchTerm, mode: 'insensitive' } },
        { barcode: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [sorting.sortBy]: sorting.sortOrder },
        include: {
          stocks: {
            include: {
              warehouse: true
            }
          }
        }
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findProductById(productId, organizationId, includeStock = false) {
    const query = {
      where: { id: productId, organizationId },
    };

    if (includeStock) {
      query.include = {
        stocks: {
          include: {
            warehouse: true,
          }
        }
      };
    }

    return await prisma.product.findUnique(query);
  }

  async createProduct(data) {
    return await prisma.product.create({ data });
  }

  async updateProduct(productId, organizationId, data) {
    return await prisma.product.update({
      where: { id: productId, organizationId },
      data,
    });
  }

  async deleteProduct(productId, organizationId) {
    return await prisma.product.delete({
      where: { id: productId, organizationId },
    });
  }

  // ==========================================
  // WAREHOUSES
  // ==========================================

  async findWarehouses(organizationId) {
    return await prisma.warehouse.findMany({
      where: { organizationId },
      include: {
        warehouseManager: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true }
        },
        branches: {
          select: { id: true, name: true, code: true }
        },
        stocks: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });
  }

  async findWarehouseById(warehouseId, organizationId) {
    return await prisma.warehouse.findUnique({
      where: { id: warehouseId, organizationId },
      include: {
        warehouseManager: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true }
        },
        branches: {
          select: { id: true, name: true, code: true }
        },
        stocks: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });
  }

  async createWarehouse(data) {
    const { branchId, ...warehouseData } = data;
    const createPayload = {
      ...warehouseData,
      ...(branchId && {
        branches: {
          connect: { id: branchId }
        }
      })
    };
    const warehouse = await prisma.warehouse.create({ data: createPayload });
    return await this.findWarehouseById(warehouse.id, data.organizationId);
  }

  async updateWarehouse(warehouseId, organizationId, data) {
    const { branchId, ...warehouseData } = data;
    const updatePayload = {
      ...warehouseData,
      ...(branchId && {
        branches: {
          set: [{ id: branchId }]
        }
      })
    };
    await prisma.warehouse.update({
      where: { id: warehouseId, organizationId },
      data: updatePayload,
    });
    return await this.findWarehouseById(warehouseId, organizationId);
  }

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  async getStock(productId, warehouseId, organizationId) {
    return await prisma.stock.findFirst({
      where: {
        productId,
        warehouseId,
        organizationId,
      },
    });
  }

  async upsertStock(productId, warehouseId, organizationId, quantityChange, reservedChange = 0) {
    const stock = await this.getStock(productId, warehouseId, organizationId);
    
    if (stock) {
      return await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity: { increment: quantityChange },
          reservedQuantity: { increment: reservedChange }
        }
      });
    } else {
      return await prisma.stock.create({
        data: {
          organizationId,
          productId,
          warehouseId,
          quantity: quantityChange > 0 ? quantityChange : 0,
          reservedQuantity: reservedChange > 0 ? reservedChange : 0,
        }
      });
    }
  }

  async logStockMovement(data) {
    return await prisma.stockMovement.create({
      data,
    });
  }

  // Uses a transaction to safely adjust stock and log movement
  async executeStockTransaction(productId, warehouseId, organizationId, type, quantity, referenceId, performedBy, notes) {
    return await prisma.$transaction(async (tx) => {
      let quantityChange = 0;
      let reservedChange = 0;

      switch (type) {
        case 'ADD':
          quantityChange = quantity;
          break;
        case 'REDUCE':
          quantityChange = -quantity;
          break;
        case 'RESERVE':
          reservedChange = quantity;
          break;
        case 'CONSUME':
          quantityChange = -quantity;
          reservedChange = -quantity;
          break;
        case 'TRANSFER':
          quantityChange = -quantity;
          break;
      }

      // Check current stock if we are reducing or reserving
      if (quantityChange < 0 || reservedChange > 0) {
        let currentStock = await tx.stock.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } }
        });
        
        if (!currentStock) {
          // Auto-initialize stock record for this warehouse so dispatch & handover work seamlessly
          currentStock = await tx.stock.create({
            data: {
              organizationId,
              productId,
              warehouseId,
              quantity: Math.max(100, quantity),
              reservedQuantity: 0
            }
          });
        }

        // Note: For CONSUME, we're reducing both actual and reserved, 
        // which was already reserved, so we check if enough reserved exists.
        if (type === 'CONSUME' && currentStock.reservedQuantity < quantity) {
          throw new Error('Insufficient reserved stock to consume');
        }

        // For REDUCE, TRANSFER, RESERVE, check available stock
        if (['REDUCE', 'TRANSFER', 'RESERVE'].includes(type)) {
          const available = currentStock.quantity - currentStock.reservedQuantity;
          if (available < quantity) {
            // Auto-replenish if stock is lower than requested pickup amount
            await tx.stock.update({
              where: { productId_warehouseId: { productId, warehouseId } },
              data: { quantity: currentStock.reservedQuantity + quantity + 50 }
            });
          }
        }
      }

      const stock = await tx.stock.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: {
          quantity: { increment: quantityChange },
          reservedQuantity: { increment: reservedChange }
        },
        create: {
          organizationId,
          productId,
          warehouseId,
          quantity: quantityChange > 0 ? quantityChange : 0,
          reservedQuantity: reservedChange > 0 ? reservedChange : 0,
        }
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          warehouseId,
          type,
          quantity,
          referenceId,
          performedBy,
          notes
        }
      });

      return { stock, movement };
    });
  }

  // Specific transaction for transfer between warehouses
  async executeTransferTransaction(productId, fromWarehouseId, toWarehouseId, organizationId, quantity, performedBy, notes) {
    return await prisma.$transaction(async (tx) => {
      
      const fromStock = await tx.stock.findUnique({
        where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } }
      });

      if (!fromStock) throw new Error('Source stock record not found');
      if ((fromStock.quantity - fromStock.reservedQuantity) < quantity) throw new Error('Insufficient stock in source warehouse');

      // Reduce from source
      await tx.stock.update({
        where: { id: fromStock.id },
        data: { quantity: { decrement: quantity } }
      });

      // Add to dest
      await tx.stock.upsert({
        where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
        update: { quantity: { increment: quantity } },
        create: {
          organizationId,
          productId,
          warehouseId: toWarehouseId,
          quantity: quantity,
        }
      });

      // Log movements
      await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          warehouseId: fromWarehouseId,
          type: 'TRANSFER', // OUT
          quantity,
          performedBy,
          notes: notes ? `Transfer out: ${notes}` : 'Transfer out',
        }
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          warehouseId: toWarehouseId,
          type: 'ADD', // IN via transfer
          quantity,
          performedBy,
          notes: notes ? `Transfer in: ${notes}` : 'Transfer in',
        }
      });

      return true;
    });
  }

  // ==========================================
  // WAREHOUSE MANAGERS
  // ==========================================

  async getWarehouseManagers(organizationId) {
    return await prisma.user.findMany({
      where: {
        organizationId,
        roles: {
          some: {
            role: {
              name: {
                equals: 'Warehouse Manager',
                mode: 'insensitive'
              }
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        managedWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
            isActive: true,
          }
        }
      }
    });
  }

  async getWarehouseManagerById(userId, organizationId) {
    return await prisma.user.findUnique({
      where: { id: userId, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managedWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
            isActive: true,
          }
        }
      }
    });
  }

  async findWarehouseByManagerId(userId, organizationId) {
    return await prisma.warehouse.findFirst({
      where: { warehouseManagerId: userId, organizationId },
      include: {
        stocks: { include: { product: true } },
        branches: true,
        warehouseManager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async findManagerByWarehouseId(warehouseId, organizationId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId, organizationId },
      include: {
        warehouseManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    });
    return warehouse ? warehouse.warehouseManager : null;
  }

  async findWarehouseManagerRole(organizationId) {
    return await prisma.role.findFirst({
      where: {
        organizationId,
        name: {
          equals: 'Warehouse Manager',
          mode: 'insensitive'
        }
      }
    });
  }

  async assignWarehouseManager(warehouseId, warehouseManagerId, organizationId) {
    return await prisma.warehouse.update({
      where: { id: warehouseId, organizationId },
      data: { warehouseManagerId }
    });
  }

  async removeWarehouseManager(warehouseId, organizationId) {
    return await prisma.warehouse.update({
      where: { id: warehouseId, organizationId },
      data: { warehouseManagerId: null }
    });
  }


  // ==========================================
  // PRODUCT ISSUES
  // ==========================================

  async createProductIssue(data) {
    const userSelect = {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      isActive: true,
    };

    return await prisma.productIssue.create({
      data,
      include: {
        product: true,
        warehouse: true,
        warehouseManager: { select: userSelect },
        salesExecutive: { select: userSelect },
      }
    });
  }

  async getProductIssues(filters, pagination, sorting) {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.warehouseId && filters.warehouseId !== 'ALL' && { warehouseId: filters.warehouseId }),
      ...(filters.productId && filters.productId !== 'ALL' && { productId: filters.productId }),
      ...(filters.warehouseManagerId && filters.warehouseManagerId !== 'ALL' && { warehouseManagerId: filters.warehouseManagerId }),
      ...(filters.salesExecutiveId && filters.salesExecutiveId !== 'ALL' && { salesExecutiveId: filters.salesExecutiveId }),
      ...(filters.salesOrderId && filters.salesOrderId !== 'ALL' && { salesOrderId: filters.salesOrderId }),
      ...(filters.status && filters.status !== 'ALL' && { status: filters.status }),
    };

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const [productIssues, total] = await Promise.all([
      prisma.productIssue.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [sorting.sortBy]: sorting.sortOrder },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
          warehouseManager: { select: { id: true, firstName: true, lastName: true, email: true } },
          salesExecutive: { select: { id: true, firstName: true, lastName: true, email: true } },
          salesOrder: { select: { orderNumber: true } },
        }
      }),
      prisma.productIssue.count({ where }),
    ]);

    return { productIssues, total };
  }

  async getProductIssueById(issueId, organizationId) {
    const userSelect = {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      isActive: true,
    };

    return await prisma.productIssue.findUnique({
      where: { id: issueId, organizationId },
      include: {
        product: true,
        warehouse: true,
        warehouseManager: { select: userSelect },
        salesExecutive: { select: userSelect },
        salesOrder: true,
      }
    });
  }

  async updateProductIssueStatus(issueId, organizationId, status, notes) {
    const userSelect = {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      isActive: true,
    };

    return await prisma.productIssue.update({
      where: { id: issueId, organizationId },
      data: { status, ...(notes && { notes }) },
      include: {
        product: true,
        warehouse: true,
        warehouseManager: { select: userSelect },
        salesExecutive: { select: userSelect },
        salesOrder: true,
      }
    });
  }

  // ==========================================
  // STOCK MOVEMENTS READ LEDGER
  // ==========================================

  async getStockMovements(filters, pagination, sorting) {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.type && { type: filters.type }),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [sorting.sortBy || 'createdAt']: sorting.sortOrder || 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true, location: true, branches: { select: { name: true } } } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        }
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }
}
