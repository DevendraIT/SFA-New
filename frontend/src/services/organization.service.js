import * as api from "../api/organization.api";

const organizationService = {
  getCurrentOrganization: api.getCurrentOrganization,
  createOrganization: api.createOrganization,
  updateCurrentOrganization: api.updateCurrentOrganization,
  deleteOrganization: api.deleteOrganization,
};

export default organizationService;