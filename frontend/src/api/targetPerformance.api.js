import api from "./axios";

export const getTargets = (params = {}) =>
  api.get("/target-performance/targets", { params });

export const getLeaderboard = (params = {}) =>
  api.get("/target-performance/leaderboard", { params });

export const getCompanyOverview = () =>
  api.get("/target-performance/company-overview");
