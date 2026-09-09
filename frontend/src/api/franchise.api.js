import api from "./axios";

const BASE_URL = "/franchise";

const franchiseApi = {
  login(credentials) {
    return api.post(`${BASE_URL}/login`, credentials);
  },

  getOrganizations() {
    return api.get(`${BASE_URL}/organizations`);
  },

  getMetrics() {
    return api.get(`${BASE_URL}/metrics`);
  },

  provisionOrganization(data) {
    return api.post(`${BASE_URL}/organizations`, data);
  },

  updateOrganization(orgId, data) {
    return api.put(`${BASE_URL}/organizations/${orgId}`, data);
  },

  deleteOrganization(orgId) {
    return api.delete(`${BASE_URL}/organizations/${orgId}`);
  },

  generateToken(orgId) {
    return api.post(`${BASE_URL}/organizations/${orgId}/generate-token`);
  },

  getProfile() {
    return api.get(`${BASE_URL}/profile`);
  },

  updateProfile(data) {
    return api.put(`${BASE_URL}/profile`, data);
  },

  changePassword(data) {
    return api.post(`${BASE_URL}/change-password`, data);
  },
};

export default franchiseApi;
