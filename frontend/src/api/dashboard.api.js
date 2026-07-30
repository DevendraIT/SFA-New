import api from "./axios";

export const getSuperAdminDashboard = () =>
  api.get("/dashboard/superadmin");

export const getHeadOfSalesDashboard = () =>
  api.get("/dashboard/head-of-sales");

export const getSalesManagerCount = () =>
  api.get("/dashboard/sales-managers-count");

export const getPresentSalesManagerCount = () =>
  api.get("/dashboard/present-sales-managers-count");

export const getExecutiveDashboard = () =>

  api.get("/dashboard/executive");

export const getTeamDashboard = () =>
  api.get("/dashboard/team");

export const getManagerDashboard = () =>
  api.get("/dashboard/manager");

export const getUserDashboard = () =>
  api.get("/dashboard/me");
