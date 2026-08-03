import api from "./axios";

const BASE_URL = "/organization/territories";

const territoryApi = {
  getTerritories(params = {}) {
    return api.get(BASE_URL, { params });
  },

  getTerritory(id) {
    return api.get(`${BASE_URL}/${id}`);
  },

  createTerritory(data) {
    return api.post(BASE_URL, data);
  },

  updateTerritory(id, data) {
    return api.put(`${BASE_URL}/${id}`, data);
  },

  deleteTerritory(id) {
    return api.delete(`${BASE_URL}/${id}`);
  },
};

export default territoryApi;
