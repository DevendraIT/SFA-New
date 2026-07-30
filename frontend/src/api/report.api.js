import api from "./axios";

export const getReportsAnalytics = () =>
  api.get("/reports/analytics");

export const getForecast = (params = {}) =>
  api.get("/reports/forecast", { params });

export const downloadReport = (params = {}) =>
  api.get("/reports/export", { params });

export default {
  getReportsAnalytics,
  getForecast,
  downloadReport,
};
