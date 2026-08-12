import api from "./axios";

const BASE_URL = "/crm-integration";

const crmApi = {
  uploadCRMFile(formData) {
    return api.post(`${BASE_URL}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  convertImportToOrders(importId) {
    return api.post(`${BASE_URL}/imports/${importId}/convert-to-orders`);
  },

  getCRMImports(params = {}) {
    return api.get(`${BASE_URL}/imports`, { params });
  },

  getCRMImportById(importId) {
    return api.get(`${BASE_URL}/imports/${importId}`);
  },

  mapCRMProduct(rowId, productId) {
    return api.patch(`${BASE_URL}/import-rows/${rowId}/product`, { productId });
  },

  mapCRMBranch(rowId, branchId) {
    return api.patch(`${BASE_URL}/import-rows/${rowId}/branch`, { branchId });
  },

  getCRMTemplate() {
    return api.get(`${BASE_URL}/template`, {
      responseType: "blob",
    });
  },

  exportCRMData(importId) {
    return api.get(`${BASE_URL}/export`, {
      params: { importId },
      responseType: "blob",
    });
  },
};

export default crmApi;
