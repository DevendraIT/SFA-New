import api from "./axios";

const BASE_URL = "/inventory";

const inventoryApi = {
  // ===== PRODUCTS =====
  getProducts(params = {}) {
    return api.get(`${BASE_URL}/products`, { params });
  },

  getProduct(id) {
    return api.get(`${BASE_URL}/products/${id}`);
  },

  createProduct(data) {
    return api.post(`${BASE_URL}/products`, data);
  },

  updateProduct(id, data) {
    return api.put(`${BASE_URL}/products/${id}`, data);
  },

  deleteProduct(id) {
    return api.delete(`${BASE_URL}/products/${id}`);
  },

  // ===== WAREHOUSES =====
  getWarehouses(params = {}) {
    return api.get(`${BASE_URL}/warehouses`, { params });
  },

  createWarehouse(data) {
    return api.post(`${BASE_URL}/warehouses`, data);
  },

  updateWarehouse(id, data) {
    return api.put(`${BASE_URL}/warehouses/${id}`, data);
  },

  // ===== WAREHOUSE MANAGERS =====
  getWarehouseManagers(params = {}) {
    return api.get(`${BASE_URL}/warehouse-managers`, { params });
  },

  createWarehouseManager(data) {
    return api.post(`${BASE_URL}/warehouse-managers`, data);
  },

  assignWarehouseManager(warehouseId, data) {
    return api.post(`${BASE_URL}/warehouses/${warehouseId}/manager`, data);
  },

  getMyWarehouse() {
    return api.get(`${BASE_URL}/warehouse-managers/me/warehouse`);
  },

  // ===== STOCK =====
  addStock(data) {
    return api.post(`${BASE_URL}/stock/add`, data);
  },

  reduceStock(data) {
    return api.post(`${BASE_URL}/stock/reduce`, data);
  },

  // ===== PRODUCT ISSUES =====
  getProductIssues(params = {}) {
    return api.get(`${BASE_URL}/product-issues`, { params });
  },

  getProductIssue(id) {
    return api.get(`${BASE_URL}/product-issues/${id}`);
  },

  createProductIssue(data) {
    return api.post(`${BASE_URL}/product-issues`, data);
  },

  updateProductIssueStatus(id, data) {
    return api.patch(`${BASE_URL}/product-issues/${id}/status`, data);
  },

  // ===== STOCK MOVEMENTS =====
  getStockMovements(params = {}) {
    return api.get(`${BASE_URL}/stock-movements`, { params });
  },
};

export default inventoryApi;
