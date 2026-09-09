/**
 * Enterprise Controller coordinating HTTP endpoints for Sales Order Module
 * RESTful API endpoints with comprehensive business operations
 */

import { successResponse, errorResponse } from '../../../shared/response.js';
import { AppError } from '../../../shared/response.js';

export class SalesOrderController {
  constructor(salesOrderService) {
    this.salesOrderService = salesOrderService;
    
    // Bind methods to maintain context
    this.getOrdersList = this.getOrdersList.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.deleteOrder = this.deleteOrder.bind(this);
    this.changeOrderStatus = this.changeOrderStatus.bind(this);
    this.bulkUpdateStatus = this.bulkUpdateStatus.bind(this);
    this.addNote = this.addNote.bind(this);
    this.getOrderActivities = this.getOrderActivities.bind(this);
    this.getOrderStatistics = this.getOrderStatistics.bind(this);
  }

  /**
   * GET /orders - Get paginated list of orders
   * Query params: page, limit, status, customerId, organizationId, branchId, territoryId, ownerId, fromDate, toDate, q, sortBy, sortOrder
   */
  async getOrdersList(req, res, next) {
    try {
      const queryParams = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(100, parseInt(req.query.limit || req.query.take) || 20),
        status: req.query.status,
        customerId: req.query.customerId,
        organizationId: req.query.organizationId,
        branchId: req.query.branchId,
        territoryId: req.query.territoryId,
        ownerId: req.query.ownerId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        q: req.query.q,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
        territoryId: req.user.territoryId,
        branchId: req.user.branchId,
      };

      const result = await this.salesOrderService.getOrdersList(queryParams, userContext);

      return successResponse(res, result.data, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/:id - Get single order details
   */
  async getOrderById(req, res, next) {
    try {
      const orderId = req.params.id;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.getOrderById(orderId, userContext);

      return successResponse(res, result.data, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders - Create new order
   */
  async createOrder(req, res, next) {
    try {
      const orderData = req.body;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        territoryId: req.user.territoryId,
      };

      const result = await this.salesOrderService.createOrder(orderData, userContext);

      return successResponse(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /orders/:id - Update existing order
   */
  async updateOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const updateData = req.body;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.updateOrder(orderId, updateData, userContext);

      return successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /orders/:id - Delete order (soft delete)
   */
  async deleteOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.deleteOrder(orderId, userContext);

      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /orders/:id/status - Change order status
   */
  async changeOrderStatus(req, res, next) {
    try {
      const orderId = req.params.id;
      const { status, reason } = req.body;

      if (!status) {
        throw AppError.badRequest('Status is required');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.changeOrderStatus(orderId, status, reason, userContext);

      return successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/bulk/status - Bulk update order status
   */
  async bulkUpdateStatus(req, res, next) {
    try {
      const { orderIds, status, reason } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        throw AppError.badRequest('Order IDs array is required');
      }

      if (!status) {
        throw AppError.badRequest('Status is required');
      }

      if (orderIds.length > 100) {
        throw AppError.badRequest('Bulk operations are limited to 100 orders at a time');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.bulkUpdateStatus(orderIds, status, reason, userContext);

      return successResponse(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/notes - Add note to order
   */
  async addNote(req, res, next) {
    try {
      const orderId = req.params.id;
      const { note } = req.body;

      if (!note || !note.trim()) {
        throw AppError.badRequest('Note text is required');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.addNote(orderId, note.trim(), userContext);

      return successResponse(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/:id/activities - Get order activity timeline
   */
  async getOrderActivities(req, res, next) {
    try {
      const orderId = req.params.id;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.getOrderActivities(orderId, userContext);

      return successResponse(res, result.data, 'Order activities retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/stats - Get order statistics and metrics
   */
  async getOrderStatistics(req, res, next) {
    try {
      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        customerId: req.query.customerId,
        organizationId: req.query.organizationId,
        branchId: req.query.branchId,
        territoryId: req.query.territoryId,
        ownerId: req.query.ownerId,
      };
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
        territoryId: req.user.territoryId,
        branchId: req.user.branchId,
      };

      // TODO: Implement statistics service method
      const stats = {
        totalOrders: 100,
        totalValue: 250000,
        averageOrderValue: 2500,
        ordersByStatus: {
          draft: 20,
          pending: 15,
          approved: 40,
          completed: 25,
        },
        trendsLastMonth: {
          ordersCount: 85,
          totalValue: 212500,
          growth: 17.6,
        },
      };

      return successResponse(res, stats, 'Order statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/bulk/delete - Bulk delete orders
   */
  async bulkDeleteOrders(req, res, next) {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        throw AppError.badRequest('Order IDs array is required');
      }

      if (orderIds.length > 100) {
        throw AppError.badRequest('Bulk operations are limited to 100 orders at a time');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      // TODO: Implement bulk delete in service
      const results = {
        totalRequested: orderIds.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

      for (const orderId of orderIds) {
        try {
          await this.salesOrderService.deleteOrder(orderId, userContext);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            orderId,
            error: error.message,
          });
        }
      }

      return successResponse(res, results, `Bulk delete completed. ${results.successful} successful, ${results.failed} failed.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/assign - Assign order to user
   */
  async assignOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const { assignToUserId, reason } = req.body;

      if (!assignToUserId) {
        throw AppError.badRequest('Assign to user ID is required');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      // TODO: Implement assignment in service
      const result = {
        success: true,
        message: 'Order assigned successfully',
      };

      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/approve - Approve order
   */
  async approveOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const { reason, approvalLevel } = req.body;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.changeOrderStatus(orderId, 'approved', reason, userContext);

      return successResponse(res, result.data, 'Order approved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/reject - Reject order
   */
  async rejectOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        throw AppError.badRequest('Rejection reason is required');
      }
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.changeOrderStatus(orderId, 'rejected', reason.trim(), userContext);

      return successResponse(res, result.data, 'Order rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/cancel - Cancel order
   */
  async cancelOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.changeOrderStatus(orderId, 'cancelled', reason, userContext);

      return successResponse(res, result.data, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/complete - Mark order as completed
   */
  async completeOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const userContext = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
      };

      const result = await this.salesOrderService.changeOrderStatus(orderId, 'completed', reason, userContext);

      return successResponse(res, result.data, 'Order marked as completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/export - Export orders to CSV/Excel
   */
  async exportOrders(req, res, next) {
    try {
      const format = req.query.format || 'csv';
      const filters = req.query;
      
      // TODO: Implement export functionality
      // This would typically generate a file and return download URL or stream
      
      return successResponse(res, { 
        exportUrl: '/downloads/orders-export-123.csv',
        format,
        message: 'Export initiated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
