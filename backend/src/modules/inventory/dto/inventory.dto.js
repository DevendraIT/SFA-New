export class ProductListDto {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.sku = product.sku;
    this.productCode = product.productCode;
    this.category = product.category;
    this.brand = product.brand;
    this.price = product.price;
    this.isActive = product.isActive;
  }
}

export class ProductDetailsDto {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.sku = product.sku;
    this.productCode = product.productCode;
    this.description = product.description;
    this.category = product.category;
    this.brand = product.brand;
    this.unit = product.unit;
    this.price = product.price;
    this.costPrice = product.costPrice;
    this.tax = product.tax;
    this.minimumStock = product.minimumStock;
    this.barcode = product.barcode;
    this.isActive = product.isActive;
    
    // Aggregated stock
    if (product.stocks) {
      this.totalStock = product.stocks.reduce((acc, stock) => acc + stock.quantity, 0);
      this.totalReserved = product.stocks.reduce((acc, stock) => acc + stock.reservedQuantity, 0);
      this.availableStock = this.totalStock - this.totalReserved;
      this.warehouses = product.stocks.map(stock => ({
        warehouseId: stock.warehouse.id,
        warehouseName: stock.warehouse.name,
        quantity: stock.quantity,
        reservedQuantity: stock.reservedQuantity,
        available: stock.quantity - stock.reservedQuantity
      }));
    }
  }
}

export class WarehouseDto {
  constructor(warehouse) {
    this.id = warehouse.id;
    this.name = warehouse.name;
    this.code = warehouse.code;
    this.location = warehouse.location;
    this.isActive = warehouse.isActive;
  }
}

export class StockMovementDto {
  constructor(movement) {
    this.id = movement.id;
    this.type = movement.type;
    this.quantity = movement.quantity;
    this.referenceId = movement.referenceId;
    this.notes = movement.notes;
    this.createdAt = movement.createdAt;
    
    if (movement.user) {
      this.performedBy = {
        id: movement.user.id,
        name: `${movement.user.firstName} ${movement.user.lastName}`,
      };
    }
  }
}
