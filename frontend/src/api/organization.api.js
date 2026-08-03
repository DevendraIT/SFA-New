import api from "./axios";

export const getCurrentOrganization = async () => {
  const { data } = await api.get("/organization/current");
  return data;
};

export const createOrganization = async (payload) => {
  const { data } = await api.post("/organization", payload);
  return data;
};

export const updateCurrentOrganization = async (payload) => {
  const { data } = await api.put("/organization/current", payload);
  return data;
};

export const deleteOrganization = async (id) => {
  const { data } = await api.delete(`/organization/${id}`);
  return data;
};