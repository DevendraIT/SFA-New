import api from "./axios";

export const getBusinessAnalytics = () => api.get("/reports/analytics");
export const getForecast = (timeframe) => api.get("/reports/forecast", { params: { timeframe } });
export const exportReport = (params) => api.get("/reports/export", { params });

export default {
  getBusinessAnalytics,
  getForecast,
  exportReport,
};
