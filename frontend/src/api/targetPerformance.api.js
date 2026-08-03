import api from "./axios";

export const getTargets = (params = {}) =>
  api.get("/target-performance/targets", { params });

export const getLeaderboard = (params = {}) =>
  api.get("/target-performance/leaderboard", { params });

export const getOrganizationOverview = () =>
  api.get("/target-performance/organization-overview");
