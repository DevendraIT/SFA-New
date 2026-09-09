/**
 * Enterprise Service Layer for Sales Order Module
 * Business logic and orchestration for sales order operations
 */

import {
  OrderCalculations,
  OrderBusinessRules,
  OrderStatusManager,
  OrderNumberGenerator,
  OrderDataSanitizer
} from '../helpers/sales-order.helpers.js';
import {
  OrderListDto,
  OrderDetailsDto,
  OrderCreateDto,
  OrderUpdateDto,
  OrderStatusDto,
  BulkOperationResultDto
} from '../dto/sales-order.dto.js';
import { SalesOrderEventEmitter } from '../events/sales-order.events.js';
import { ORDER_STATUS, ACTIVITY_TYPE } from '../constants/sales-order.constants.js';
import { AppError } from '../../../shared/response.js';
import cacheService from '../../../shared/cache/cache.service.js';

export class SalesOrderService {
  constructor(salesOrderRepository, inventoryService = null) {
    this.salesOrderRepository = salesOrderRepository;
    this.inventoryService = inventoryService;
  }

  _invalidateOrdersCache(orgId) {
    if (!orgId) return;
    cacheService.invalidatePrefixes([
      `sales:orders:${orgId}:`,
      `${orgId}:dashboard:`,
      `dashboard:`,
    ]);
  }

  /**
   * Get paginated orders list with filters and search
   */
  async getOrdersList(queryParams, userContext) {
    try {
      const orgId = userContext.organizationId;
      const userId = userContext.userId || userContext.id;
      const cacheKey = `sales:orders:${orgId}:${userId || 'all'}:${JSON.stringify(queryParams || {})}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      // Build filters based on user context and permissions
      const filters = this.buildUserFilters(queryParams, userContext);

      // Get orders with pagination
      const { orders, total } = await this.salesOrderRepository.findMany({
        filters,
        pagination: {
          page: parseInt(queryParams.page) || 1,
          limit: parseInt(queryParams.limit || queryParams.take) || 100,
        },
        sorting: {
          sortBy: queryParams.sortBy || 'createdAt',
          sortOrder: queryParams.sortOrder || 'desc',
        },
        searchTerm: queryParams.q,
      });

      // Transform to DTOs
      const orderDtos = orders.map(order => new OrderListDto(order));

      const limitVal = parseInt(queryParams.limit || queryParams.take) || 100;
      const result = {
        success: true,
        data: {
          orders: orderDtos,
          pagination: {
            page: parseInt(queryParams.page) || 1,
            limit: limitVal,
            total,
            totalPages: Math.ceil(total / limitVal),
          },
        },
      };

      cacheService.set(cacheKey, result, 60);
      return result;
    } catch (error) {
      throw AppError.internal('Failed to fetch orders list', error);
    }
  }

  /**
   * Get single order by ID with full details
   */
  async getOrderById(orderId, userContext) {
    try {
      const order = await this.salesOrderRepository.findById(orderId, {
        includeItems: true,
        includeActivities: true,
        includeRelations: true,
      });

      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(order, userContext, 'read');

      return {
        success: true,
        data: new OrderDetailsDto(order),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to fetch order details', error);
    }
  }

  /**
   * Create new sales order
   */
  async createOrder(orderData, userContext) {
    try {
      // Sanitize and validate input data
      const sanitizedData = OrderDataSanitizer.sanitizeCreateData(orderData);
      const createDto = new OrderCreateDto(sanitizedData);

      // Validate business rules
      const validation = OrderBusinessRules.validateOrder(createDto);
      if (!validation.isValid) {
        throw AppError.badRequest('Order validation failed', {
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      // Check and Reserve Inventory
      const reservations = [];
      if (this.inventoryService && createDto.items?.length > 0) {
        for (const item of createDto.items) {
          if (!item.productId) continue;

          // Get product and its stock
          const prodRes = await this.inventoryService.getProductById(item.productId, userContext);
          const product = prodRes.data;

          if (!product || !product.isActive) {
            throw AppError.badRequest(`Product ${item.productId} is not available or inactive`);
          }

          // Find a warehouse with enough stock
          const availableStock = product.warehouses?.find(w => w.available >= item.quantity);
          if (!availableStock) {
            throw AppError.badRequest(`Insufficient stock for product ${product.name}`);
          }

          reservations.push({
            productId: item.productId,
            warehouseId: availableStock.warehouseId,
            quantity: item.quantity
          });
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber(createDto.organizationId);

      // Calculate totals
      const totals = OrderCalculations.calculateOrderTotals(createDto.items);

      // Prepare order data for database
      const orderToCreate = {
        ...createDto,
        orderNumber,
        ...totals,
        status: ORDER_STATUS.DRAFT,
        createdBy: userContext.userId,
        organizationId: userContext.organizationId,
        ownerId: createDto.ownerId || userContext.userId,
      };

      // Create order in database
      const createdOrder = await this.salesOrderRepository.create(orderToCreate);

      // Finalize Reservations
      if (this.inventoryService && reservations.length > 0) {
        for (const res of reservations) {
          await this.inventoryService.reserveStock(
            res.productId,
            res.warehouseId,
            res.quantity,
            createdOrder.id,
            userContext
          );
        }
      }

      // Log activity
      await this.logActivity(createdOrder.id, ACTIVITY_TYPE.CREATED, 'Order created', userContext.userId);

      // Emit events
      await SalesOrderEventEmitter.emitOrderCreated(createdOrder, userContext.userId, userContext.organizationId);

      // Check if auto-approval is possible
      if (!OrderBusinessRules.requiresApproval(createDto)) {
        await this.changeOrderStatus(createdOrder.id, ORDER_STATUS.APPROVED, 'Auto-approved', userContext);
      }

      this._invalidateOrdersCache(userContext.organizationId);
      return {
        success: true,
        data: new OrderDetailsDto(createdOrder),
        message: 'Order created successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create order', error);
    }
  }

  /**
   * Update existing sales order
   */
  async updateOrder(orderId, updateData, userContext) {
    try {
      // Get existing order
      const existingOrder = await this.salesOrderRepository.findById(orderId);
      if (!existingOrder) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(existingOrder, userContext, 'update');

      // Check if order is editable
      const statusInfo = OrderStatusManager.getStatusInfo(existingOrder.status);
      if (!statusInfo.canEdit) {
        throw AppError.badRequest(`Orders with status '${existingOrder.status}' cannot be edited`);
      }

      // Sanitize and validate update data
      const updateDto = new OrderUpdateDto(updateData);

      // If items are being updated, recalculate totals
      let totals = {};
      if (updateDto.items) {
        const validation = OrderBusinessRules.validateOrder({ ...existingOrder, ...updateDto });
        if (!validation.isValid) {
          throw AppError.badRequest('Order validation failed', {
            errors: validation.errors,
            warnings: validation.warnings,
          });
        }
        totals = OrderCalculations.calculateOrderTotals(updateDto.items);
      }

      // Prepare update data
      const dataToUpdate = {
        ...updateDto,
        ...totals,
        updatedBy: userContext.userId,
        updatedAt: new Date(),
      };

      // Update order in database
      const updatedOrder = await this.salesOrderRepository.update(orderId, dataToUpdate);

      // Log activity
      await this.logActivity(orderId, ACTIVITY_TYPE.UPDATED, 'Order updated', userContext.userId, {
        changes: this.getChanges(existingOrder, dataToUpdate),
      });

      // Emit events
      await SalesOrderEventEmitter.emitOrderUpdated(updatedOrder, dataToUpdate, userContext.userId, userContext.organizationId);

      this._invalidateOrdersCache(userContext.organizationId);
      return {
        success: true,
        data: new OrderDetailsDto(updatedOrder),
        message: 'Order updated successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update order', error);
    }
  }

  /**
   * Change order status
   */
  async changeOrderStatus(orderId, newStatus, reason, userContext) {
    try {
      const order = await this.salesOrderRepository.findById(orderId);
      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(order, userContext, 'update');

      const currentStatus = order.status;

      // Validate status transition
      if (!OrderStatusManager.isValidTransition(currentStatus, newStatus)) {
        const allowedTransitions = OrderStatusManager.getAllowedTransitions(currentStatus);
        throw AppError.badRequest(
          `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
          `Allowed transitions: ${allowedTransitions.join(', ')}`
        );
      }

      // Handle Inventory adjustments
      if (this.inventoryService) {
        // If Approved or Completed (depending on when we commit stock)
        // We'll commit stock when order is COMPLETED or APPROVED
        if (newStatus === ORDER_STATUS.APPROVED || newStatus === ORDER_STATUS.COMPLETED) {
          // If moving from DRAFT/PENDING to APPROVED/COMPLETED, commit stock
          if (currentStatus === ORDER_STATUS.DRAFT || currentStatus === ORDER_STATUS.PENDING) {
            const orderWithItems = await this.salesOrderRepository.findById(orderId, { includeItems: true });
            for (const item of orderWithItems.items) {
              if (!item.productId) continue;
              // Need to find which warehouse was reserved. For simplicity, we get the stock history or just find a warehouse.
              const prodRes = await this.inventoryService.getProductById(item.productId, userContext);
              const product = prodRes.data;
              if (product && product.warehouses && product.warehouses.length > 0) {
                // In a perfect system, we'd store the reserved warehouse per item. 
                // For now, commit from the first warehouse that has reserved stock
                const reservedStock = product.warehouses.find(w => w.reservedQuantity >= item.quantity) || product.warehouses[0];
                if (reservedStock) {
                  await this.inventoryService.commitStock(
                    item.productId,
                    reservedStock.warehouseId,
                    item.quantity,
                    orderId,
                    userContext
                  );
                }
              }
            }
          }
        }

        // If Cancelled or Rejected, release reserved stock
        if (newStatus === ORDER_STATUS.CANCELLED || newStatus === ORDER_STATUS.REJECTED) {
          if (currentStatus === ORDER_STATUS.DRAFT || currentStatus === ORDER_STATUS.PENDING) {
            const orderWithItems = await this.salesOrderRepository.findById(orderId, { includeItems: true });
            for (const item of orderWithItems.items) {
              if (!item.productId) continue;
              const prodRes = await this.inventoryService.getProductById(item.productId, userContext);
              const product = prodRes.data;
              if (product && product.warehouses && product.warehouses.length > 0) {
                const reservedStock = product.warehouses.find(w => w.reservedQuantity >= item.quantity) || product.warehouses[0];
                if (reservedStock) {
                  await this.inventoryService.releaseStock(
                    item.productId,
                    reservedStock.warehouseId,
                    item.quantity,
                    orderId,
                    userContext
                  );
                }
              }
            }
          }
        }
      }

      // Update status in database
      const updatedOrder = await this.salesOrderRepository.updateStatus(orderId, newStatus, reason, userContext.userId);

      // Log activity
      await this.logActivity(orderId, ACTIVITY_TYPE.STATUS_CHANGED, `Status changed from ${currentStatus} to ${newStatus}`, userContext.userId, {
        previousStatus: currentStatus,
        newStatus,
        reason,
      });

      // Emit events
      await SalesOrderEventEmitter.emitOrderStatusChanged(updatedOrder, currentStatus, newStatus, reason, userContext.userId, userContext.organizationId);

      this._invalidateOrdersCache(userContext.organizationId);
      return {
        success: true,
        data: new OrderStatusDto({ ...updatedOrder, previousStatus: currentStatus }),
        message: `Order status changed to ${newStatus}`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to change order status', error);
    }
  }

  /**
   * Delete order (soft delete)
   */
  async deleteOrder(orderId, userContext) {
    try {
      const order = await this.salesOrderRepository.findById(orderId);
      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(order, userContext, 'delete');

      // Check if order can be deleted
      if (OrderStatusManager.isTerminalStatus(order.status)) {
        throw AppError.badRequest(`Orders with status '${order.status}' cannot be deleted`);
      }

      // Soft delete order
      await this.salesOrderRepository.softDelete(orderId, userContext.userId);

      // Log activity
      await this.logActivity(orderId, ACTIVITY_TYPE.DELETED, 'Order deleted', userContext.userId);

      return {
        success: true,
        message: 'Order deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete order', error);
    }
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(orderIds, newStatus, reason, userContext) {
    try {
      const results = new BulkOperationResultDto({
        totalRequested: orderIds.length,
        successful: 0,
        failed: 0,
        errors: [],
        processedIds: [],
      });

      for (const orderId of orderIds) {
        try {
          await this.changeOrderStatus(orderId, newStatus, reason, userContext);
          results.successful++;
          results.processedIds.push(orderId);
        } catch (error) {
          results.failed++;
          results.errors.push({
            orderId,
            error: error.message,
          });
        }
      }

      // Emit bulk operation completed event
      await SalesOrderEventEmitter.emitBulkOperationCompleted(
        'bulk_status_update',
        results,
        userContext.userId,
        userContext.organizationId
      );

      return {
        success: true,
        data: results,
        message: `Bulk operation completed. ${results.successful} successful, ${results.failed} failed.`,
      };
    } catch (error) {
      throw AppError.internal('Failed to process bulk status update', error);
    }
  }

  /**
   * Add note to order
   */
  async addNote(orderId, noteText, userContext) {
    try {
      const order = await this.salesOrderRepository.findById(orderId);
      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(order, userContext, 'read');

      // Add note (creates an OrderActivity record)
      const noteActivity = await this.salesOrderRepository.addNote(orderId, noteText, userContext.userId);

      return {
        success: true,
        data: noteActivity,
        message: 'Note added successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to add note', error);
    }
  }

  /**
   * Get order activities/timeline
   */
  async getOrderActivities(orderId, userContext) {
    try {
      const order = await this.salesOrderRepository.findById(orderId);
      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check access permissions
      this.validateUserAccess(order, userContext, 'read');

      const activities = await this.salesOrderRepository.getActivities(orderId);

      return {
        success: true,
        data: activities,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to fetch order activities', error);
    }
  }

  // --------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------

  /**
   * Generate unique order number
   */
  async generateOrderNumber(organizationId) {
    // TODO: Get next sequence from database
    const sequence = await this.salesOrderRepository.getNextSequence(organizationId);
    const companyCode = await this.getCompanyCode(organizationId);
    return OrderNumberGenerator.generateOrderNumber(companyCode, sequence);
  }

  /**
   * Get company code for order number generation
   */
  async getCompanyCode(organizationId) {
    if (!organizationId) return 'SO';
    try {
      const { prisma } = await import('../../../config/database.js');
      const company = await prisma.company.findUnique({
        where: { id: organizationId },
        select: { code: true }
      });
      return company?.code || 'SO';
    } catch (error) {
      return 'SO';
    }
  }

  /**
   * Build user-specific filters
   */
  buildUserFilters(queryParams, userContext) {
    const filters = { ...queryParams };

    // Add organization context
    filters.organizationId = userContext.organizationId;

    const userRoles = (userContext.roles || []).map(r =>
      typeof r === 'string' ? r : (r.role?.name || r.name || '')
    );

    // Roles that see ALL orders in the org (no branch filter)
    const isGlobalAdmin = userRoles.some(r =>
      ['organization super admin', 'super admin', 'company admin', 'head of sales', 'administrator'].includes(r.toLowerCase())
    );

    // Super Admin / Company Admin / Head of Sales see all orders in org.
    // Sales Managers and Sales Executives only see sales orders for their specific branch.
    if (!isGlobalAdmin) {
      if (userContext.branchId) {
        filters.branchId = userContext.branchId;
      } else if (queryParams.branchId) {
        filters.branchId = queryParams.branchId;
      }
      if (userContext.territoryId && !userContext.branchId) {
        filters.territoryId = userContext.territoryId;
      }
    }

    return filters;
  }

  /**
   * Validate user access to order
   */
  validateUserAccess(order, userContext, operation) {
    const userRoles = (userContext.roles || []).map(r =>
      typeof r === 'string' ? r : (r.role?.name || r.name || '')
    );

    const isGlobalAdmin = userRoles.some(r =>
      ['organization super admin', 'super admin', 'company admin', 'head of sales', 'administrator'].includes(r.toLowerCase())
    );

    if (isGlobalAdmin) {
      return true;
    }

    if (order.organizationId && userContext.organizationId && order.organizationId !== userContext.organizationId) {
      throw AppError.forbidden('Access denied: Order belongs to a different organization');
    }

    if (userContext.branchId && order.branchId && order.branchId !== userContext.branchId) {
      throw AppError.forbidden('Access denied: Order belongs to a different branch');
    }

    return true;
  }

  /**
   * Log order activity
   */
  async logActivity(orderId, activityType, description, userId, metadata = {}) {
    try {
      await this.salesOrderRepository.createActivity({
        orderId,
        activityType,
        description,
        performedBy: userId,
        metadata,
        performedAt: new Date(),
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log order activity:', error);
    }
  }

  /**
   * Get changes between old and new data
   */
  getChanges(oldData, newData) {
    const changes = {};

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
      }
    });

    return changes;
  }
}
