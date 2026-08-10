import EventEmitter from 'events';

class InventoryEvents extends EventEmitter {}

export const inventoryEventEmitter = new InventoryEvents();

export const INVENTORY_EVENT_TYPES = {
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  STOCK_ADDED: 'STOCK_ADDED',
  STOCK_RESERVED: 'STOCK_RESERVED',
  STOCK_TRANSFERRED: 'STOCK_TRANSFERRED',
  STOCK_LOW: 'STOCK_LOW',
  STOCK_OUT: 'STOCK_OUT',
};

// Ready for future background jobs or workflows
export class InventoryEventPublisher {
  static emitProductCreated(product, userId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.PRODUCT_CREATED, { product, userId, organizationId, timestamp: new Date() });
  }

  static emitProductUpdated(product, changes, userId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.PRODUCT_UPDATED, { product, changes, userId, organizationId, timestamp: new Date() });
  }

  static emitStockAdded(productId, warehouseId, quantity, userId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.STOCK_ADDED, { productId, warehouseId, quantity, userId, organizationId, timestamp: new Date() });
  }

  static emitStockReserved(productId, warehouseId, quantity, referenceId, userId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.STOCK_RESERVED, { productId, warehouseId, quantity, referenceId, userId, organizationId, timestamp: new Date() });
  }

  static emitStockTransferred(productId, fromWarehouseId, toWarehouseId, quantity, userId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.STOCK_TRANSFERRED, { productId, fromWarehouseId, toWarehouseId, quantity, userId, organizationId, timestamp: new Date() });
  }

  static emitStockLow(productId, warehouseId, currentQuantity, minimumStock, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.STOCK_LOW, { productId, warehouseId, currentQuantity, minimumStock, organizationId, timestamp: new Date() });
  }

  static emitStockOut(productId, warehouseId, organizationId) {
    inventoryEventEmitter.emit(INVENTORY_EVENT_TYPES.STOCK_OUT, { productId, warehouseId, organizationId, timestamp: new Date() });
  }
}
