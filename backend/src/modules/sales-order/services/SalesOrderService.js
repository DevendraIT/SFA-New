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

export class SalesOrderService {
  constructor(salesOrderRepository) {
    this.salesOrderRepository = salesOrderRepository;
  }

  /**
   * Get paginated orders list with filters and search
   */
  async getOrdersList(queryParams, userContext) {
    try {
      // Build filters based on user context and permissions
      const filters = this.buildUserFilters(queryParams, userContext);
      
      // Get orders with pagination
      const { orders, total } = await this.salesOrderRepository.findMany({
        filters,
        pagination: {
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        },
        sorting: {
          sortBy: queryParams.sortBy || 'createdAt',
          sortOrder: queryParams.sortOrder || 'desc',
        },
        searchTerm: queryParams.q,
      });

      // Transform to DTOs
      const orderDtos = orders.map(order => new OrderListDto(order));

      return {
        success: true,
        data: {
          orders: orderDtos,
          pagination: {
            page: queryParams.page || 1,
            limit: queryParams.limit || 20,
            total,
            totalPages: Math.ceil(total / (queryParams.limit || 20)),
          },
        },
      };
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

      // Log activity
      await this.logActivity(createdOrder.id, ACTIVITY_TYPE.CREATED, 'Order created', userContext.userId);

      // Emit events
      await SalesOrderEventEmitter.emitOrderCreated(createdOrder, userContext.userId, userContext.organizationId);

      // Check if auto-approval is possible
      if (!OrderBusinessRules.requiresApproval(createDto)) {
        await this.changeOrderStatus(createdOrder.id, ORDER_STATUS.APPROVED, 'Auto-approved', userContext);
      }

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

      // Add note
      const note = await this.salesOrderRepository.addNote(orderId, noteText, userContext.userId);

      // Log activity
      await this.logActivity(orderId, ACTIVITY_TYPE.NOTE_ADDED, 'Note added to order', userContext.userId, {
        noteId: note.id,
        noteText,
      });

      return {
        success: true,
        data: note,
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

    // Apply user-specific filters based on roles and permissions
    if (!userContext.roles?.includes('Administrator')) {
      // Non-admins can only see orders in their territory/branch
      if (userContext.territoryId) {
        filters.territoryId = userContext.territoryId;
      }
      if (userContext.branchId) {
        filters.branchId = userContext.branchId;
      }
    }

    return filters;
  }

  /**
   * Validate user access to order
   */
  validateUserAccess(order, userContext, operation) {
    // Administrator bypass
    if (userContext.roles?.includes('Administrator')) {
      return true;
    }

    // Check organization context
    if (order.organizationId !== userContext.organizationId) {
      throw AppError.forbidden('Access denied: Order belongs to different organization');
    }

    // Check ownership for sensitive operations
    if (['update', 'delete'].includes(operation) && order.ownerId !== userContext.userId) {
      // Check if user has override permissions
      const hasOverridePermission = userContext.permissions?.includes(`override:orders_${operation}`);
      if (!hasOverridePermission) {
        throw AppError.forbidden(`Access denied: You can only ${operation} your own orders`);
      }
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
