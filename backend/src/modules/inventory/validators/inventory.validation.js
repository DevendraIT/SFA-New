import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  productCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
  costPrice: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(2).optional(),
  productCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateBasicProductSchema = z.object({
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  // Sales manager cannot update price, costPrice, sku, name, etc.
});

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name is required'),
  code: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const addStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const reduceStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  fromWarehouseId: z.string().uuid('Invalid Source Warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid Destination Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});
