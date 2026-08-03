/**
 * Sales Order Module - Domain Events
 * Enterprise event-driven architecture for inter-module communication
 */

import { EventEmitter } from 'events';
import { INTEGRATION_EVENTS, ACTIVITY_TYPE } from '../constants/sales-order.constants.js';

// --------------------------------------------------
// Event Emitter Instance
// --------------------------------------------------
const salesOrderEventEmitter = new EventEmitter();

// --------------------------------------------------
// Event Type Definitions
// --------------------------------------------------
export const SALES_ORDER_EVENTS = {
  // Core Order Events
  ORDER_CREATED: 'sales_order.created',
  ORDER_UPDATED: 'sales_order.updated',
  ORDER_DELETED: 'sales_order.deleted',
  
  // Status Change Events
  ORDER_STATUS_CHANGED: 'sales_order.status_changed',
  ORDER_SUBMITTED: 'sales_order.submitted',
  ORDER_APPROVED: 'sales_order.approved',
  ORDER_REJECTED: 'sales_order.rejected',
  ORDER_CANCELLED: 'sales_order.cancelled',
  ORDER_COMPLETED: 'sales_order.completed',
  ORDER_ON_HOLD: 'sales_order.on_hold',

  // Approval Events
  APPROVAL_REQUIRED: 'sales_order.approval_required',
  APPROVAL_GRANTED: 'sales_order.approval_granted',
  APPROVAL_DENIED: 'sales_order.approval_denied',
  APPROVAL_ESCALATED: 'sales_order.approval_escalated',

  // Assignment Events
  ORDER_ASSIGNED: 'sales_order.assigned',
  ORDER_REASSIGNED: 'sales_order.reassigned',
  ORDER_UNASSIGNED: 'sales_order.unassigned',

  // Activity Events
  NOTE_ADDED: 'sales_order.note_added',
  DOCUMENT_ATTACHED: 'sales_order.document_attached',
  ACTIVITY_LOGGED: 'sales_order.activity_logged',

  // Integration Events
  ERP_SYNC_REQUIRED: 'sales_order.erp_sync_required',
  INVENTORY_CHECK_REQUIRED: 'sales_order.inventory_check_required',
  NOTIFICATION_TRIGGER: 'sales_order.notification_trigger',
  AUDIT_LOG_REQUIRED: 'sales_order.audit_log_required',

  // Business Events
  HIGH_VALUE_ORDER_CREATED: 'sales_order.high_value_created',
  OVERDUE_ORDER_DETECTED: 'sales_order.overdue_detected',
  BULK_OPERATION_COMPLETED: 'sales_order.bulk_operation_completed',
};

// --------------------------------------------------
// Event Payload Builders
// --------------------------------------------------
export class EventPayloadBuilder {
  static buildOrderEvent(order, eventType, metadata = {}) {
    return {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      source: 'sales-order-module',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName || order.customer?.name,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        ownerId: order.ownerId,
        organizationId: order.organizationId,
        branchId: order.branchId,
        ...metadata,
      },
      correlationId: metadata.correlationId || order.id,
      userId: metadata.userId,
      organizationId: metadata.organizationId,
    };
  }

  static buildStatusChangeEvent(order, previousStatus, newStatus, reason, userId) {
    return this.buildOrderEvent(order, SALES_ORDER_EVENTS.ORDER_STATUS_CHANGED, {
      previousStatus,
      newStatus,
      reason,
      userId,
      statusChangedAt: new Date().toISOString(),
    });
  }

  static buildApprovalEvent(order, approvalLevel, approverUserId, decision, reason) {
    return this.buildOrderEvent(order, 
      decision === 'approved' ? SALES_ORDER_EVENTS.APPROVAL_GRANTED : SALES_ORDER_EVENTS.APPROVAL_DENIED, 
      {
        approvalLevel,
        approverUserId,
        decision,
        reason,
        approvedAt: new Date().toISOString(),
      }
    );
  }

  static buildActivityEvent(order, activityType, description, userId, metadata = {}) {
    return this.buildOrderEvent(order, SALES_ORDER_EVENTS.ACTIVITY_LOGGED, {
      activityType,
      description,
      performedBy: userId,
      performedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  static generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// --------------------------------------------------
// Event Emitters
// --------------------------------------------------
export class SalesOrderEventEmitter {
  /**
   * Emit order created event
   */
  static async emitOrderCreated(order, userId, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.ORDER_CREATED, {
      userId,
      organizationId,
      createdAt: order.createdAt,
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ORDER_CREATED, payload);
    
    // Also emit integration events if needed
    if (order.totalAmount > 50000) { // High value threshold
      this.emitHighValueOrderCreated(order, userId, organizationId);
    }
    
    return payload.eventId;
  }

  /**
   * Emit order updated event
   */
  static async emitOrderUpdated(order, changes, userId, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.ORDER_UPDATED, {
      userId,
      organizationId,
      changes,
      updatedAt: new Date().toISOString(),
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ORDER_UPDATED, payload);
    return payload.eventId;
  }

  /**
   * Emit order status changed event
   */
  static async emitOrderStatusChanged(order, previousStatus, newStatus, reason, userId, organizationId) {
    const payload = EventPayloadBuilder.buildStatusChangeEvent(order, previousStatus, newStatus, reason, userId);
    payload.data.organizationId = organizationId;

    // Emit general status change event
    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ORDER_STATUS_CHANGED, payload);

    // Emit specific status events
    const statusEventMap = {
      'pending': SALES_ORDER_EVENTS.ORDER_SUBMITTED,
      'approved': SALES_ORDER_EVENTS.ORDER_APPROVED,
      'rejected': SALES_ORDER_EVENTS.ORDER_REJECTED,
      'cancelled': SALES_ORDER_EVENTS.ORDER_CANCELLED,
      'completed': SALES_ORDER_EVENTS.ORDER_COMPLETED,
      'on_hold': SALES_ORDER_EVENTS.ORDER_ON_HOLD,
    };

    const specificEvent = statusEventMap[newStatus];
    if (specificEvent) {
      salesOrderEventEmitter.emit(specificEvent, payload);
    }

    // Trigger integration events for specific statuses
    if (['approved', 'completed'].includes(newStatus)) {
      this.emitERPSyncRequired(order, userId, organizationId);
    }

    return payload.eventId;
  }

  /**
   * Emit approval required event
   */
  static async emitApprovalRequired(order, approvalLevel, userId, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.APPROVAL_REQUIRED, {
      approvalLevel,
      userId,
      organizationId,
      requiredAt: new Date().toISOString(),
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.APPROVAL_REQUIRED, payload);
    return payload.eventId;
  }

  /**
   * Emit approval decision event
   */
  static async emitApprovalDecision(order, approvalLevel, approverUserId, decision, reason, organizationId) {
    const payload = EventPayloadBuilder.buildApprovalEvent(order, approvalLevel, approverUserId, decision, reason);
    payload.data.organizationId = organizationId;

    const eventType = decision === 'approved' ? SALES_ORDER_EVENTS.APPROVAL_GRANTED : SALES_ORDER_EVENTS.APPROVAL_DENIED;
    salesOrderEventEmitter.emit(eventType, payload);
    
    return payload.eventId;
  }

  /**
   * Emit order assignment event
   */
  static async emitOrderAssigned(order, previousOwnerId, newOwnerId, assignedBy, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.ORDER_ASSIGNED, {
      previousOwnerId,
      newOwnerId,
      assignedBy,
      organizationId,
      assignedAt: new Date().toISOString(),
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ORDER_ASSIGNED, payload);
    return payload.eventId;
  }

  /**
   * Emit activity logged event
   */
  static async emitActivityLogged(order, activityType, description, userId, organizationId, metadata = {}) {
    const payload = EventPayloadBuilder.buildActivityEvent(order, activityType, description, userId, {
      organizationId,
      ...metadata,
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ACTIVITY_LOGGED, payload);
    return payload.eventId;
  }

  /**
   * Emit ERP sync required event
   */
  static async emitERPSyncRequired(order, userId, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.ERP_SYNC_REQUIRED, {
      userId,
      organizationId,
      syncRequiredAt: new Date().toISOString(),
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.ERP_SYNC_REQUIRED, payload);
    return payload.eventId;
  }

  /**
   * Emit high value order created event
   */
  static async emitHighValueOrderCreated(order, userId, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.HIGH_VALUE_ORDER_CREATED, {
      userId,
      organizationId,
      threshold: 50000,
      actualAmount: order.totalAmount,
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.HIGH_VALUE_ORDER_CREATED, payload);
    return payload.eventId;
  }

  /**
   * Emit notification trigger event
   */
  static async emitNotificationTrigger(order, notificationType, recipients, data, organizationId) {
    const payload = EventPayloadBuilder.buildOrderEvent(order, SALES_ORDER_EVENTS.NOTIFICATION_TRIGGER, {
      notificationType,
      recipients,
      notificationData: data,
      organizationId,
      triggeredAt: new Date().toISOString(),
    });

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.NOTIFICATION_TRIGGER, payload);
    return payload.eventId;
  }

  /**
   * Emit bulk operation completed event
   */
  static async emitBulkOperationCompleted(operation, results, userId, organizationId) {
    const payload = {
      eventId: EventPayloadBuilder.generateEventId(),
      eventType: SALES_ORDER_EVENTS.BULK_OPERATION_COMPLETED,
      timestamp: new Date().toISOString(),
      source: 'sales-order-module',
      data: {
        operation,
        results,
        userId,
        organizationId,
        completedAt: new Date().toISOString(),
      },
    };

    salesOrderEventEmitter.emit(SALES_ORDER_EVENTS.BULK_OPERATION_COMPLETED, payload);
    return payload.eventId;
  }
}

// --------------------------------------------------
// Event Listeners Registration
// --------------------------------------------------
export class SalesOrderEventListeners {
  /**
   * Register all default event listeners
   */
  static registerDefaultListeners() {
    // Audit logging
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_CREATED, this.handleAuditLog);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_UPDATED, this.handleAuditLog);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_STATUS_CHANGED, this.handleAuditLog);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_DELETED, this.handleAuditLog);

    // Notification triggers
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.APPROVAL_REQUIRED, this.handleApprovalNotification);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_APPROVED, this.handleApprovalCompletedNotification);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_REJECTED, this.handleRejectionNotification);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.HIGH_VALUE_ORDER_CREATED, this.handleHighValueOrderNotification);

    // Integration hooks
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ERP_SYNC_REQUIRED, this.handleERPSyncHook);
    salesOrderEventEmitter.on(SALES_ORDER_EVENTS.ORDER_APPROVED, this.handleInventoryCheckHook);

    console.log('Sales Order event listeners registered');
  }

  /**
   * Handle audit log creation
   */
  static async handleAuditLog(payload) {
    try {
      // TODO: Integrate with audit logging service
      console.log('Audit Log:', {
        action: payload.eventType,
        entityId: payload.data.orderId,
        userId: payload.data.userId,
        timestamp: payload.timestamp,
        details: payload.data,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Handle approval notification
   */
  static async handleApprovalNotification(payload) {
    try {
      // TODO: Integrate with notification service
      console.log('Approval Notification:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
        approvalLevel: payload.data.approvalLevel,
        amount: payload.data.totalAmount,
      });
    } catch (error) {
      console.error('Failed to send approval notification:', error);
    }
  }

  /**
   * Handle approval completed notification
   */
  static async handleApprovalCompletedNotification(payload) {
    try {
      console.log('Order Approved Notification:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
        approvedAt: payload.timestamp,
      });
    } catch (error) {
      console.error('Failed to send approval completion notification:', error);
    }
  }

  /**
   * Handle rejection notification
   */
  static async handleRejectionNotification(payload) {
    try {
      console.log('Order Rejection Notification:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
        reason: payload.data.reason,
      });
    } catch (error) {
      console.error('Failed to send rejection notification:', error);
    }
  }

  /**
   * Handle high value order notification
   */
  static async handleHighValueOrderNotification(payload) {
    try {
      console.log('High Value Order Alert:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
        amount: payload.data.actualAmount,
        threshold: payload.data.threshold,
      });
    } catch (error) {
      console.error('Failed to send high value order notification:', error);
    }
  }

  /**
   * Handle ERP sync hook
   */
  static async handleERPSyncHook(payload) {
    try {
      console.log('ERP Sync Triggered:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
        status: payload.data.status,
      });
      // TODO: Queue ERP sync job
    } catch (error) {
      console.error('Failed to trigger ERP sync:', error);
    }
  }

  /**
   * Handle inventory check hook
   */
  static async handleInventoryCheckHook(payload) {
    try {
      console.log('Inventory Check Triggered:', {
        orderId: payload.data.orderId,
        orderNumber: payload.data.orderNumber,
      });
      // TODO: Queue inventory check job
    } catch (error) {
      console.error('Failed to trigger inventory check:', error);
    }
  }
}

// --------------------------------------------------
// Exports
// --------------------------------------------------
export { salesOrderEventEmitter };

export default {
  SALES_ORDER_EVENTS,
  EventPayloadBuilder,
  SalesOrderEventEmitter,
  SalesOrderEventListeners,
  salesOrderEventEmitter,
};