import territoryApi from "../api/territory.api";

const territoryService = {
  async getTerritories(params = {}) {
    const res = await territoryApi.getTerritories(params);
    return res.data;
  },

  async getTerritory(id) {
    const res = await territoryApi.getTerritory(id);
    return res.data;
  },

  async createTerritory(data) {
    const res = await territoryApi.createTerritory(data);
    return res.data;
  },

  async updateTerritory(id, data) {
    const res = await territoryApi.updateTerritory(id, data);
    return res.data;
  },

  async deleteTerritory(id) {
    const res = await territoryApi.deleteTerritory(id);
    return res.data;
  },
};

export default territoryService;
