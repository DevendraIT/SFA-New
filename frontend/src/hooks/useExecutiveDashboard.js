import { useQuery } from "@tanstack/react-query";
import dashboardService from "../services/dashboard.service";

export default function useExecutiveDashboard() {
  const {
    data: dashboard = null,
    isLoading: loading,
    error,
    refetch: refresh,
  } = useQuery({
    queryKey: ["superAdminDashboard"],
    queryFn: async () => {
      try {
        const response = await dashboardService.getSuperAdminDashboard();
        return response?.data?.data || response?.data || response;
      } catch (err) {
        console.error("Super Admin Dashboard fetch error:", err);
        const fallback = await dashboardService.getExecutiveDashboard();
        return fallback?.data?.data || fallback?.data || fallback;
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    dashboard,
    loading,
    error,
    refresh,
  };
}