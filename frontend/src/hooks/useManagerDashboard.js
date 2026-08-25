import { useQuery } from "@tanstack/react-query";
import dashboardService from "../services/dashboard.service";

export default function useManagerDashboard() {
  const {
    data: dashboard = null,
    isLoading: loading,
    error,
    refetch: refresh,
  } = useQuery({
    queryKey: ["managerDashboard"],
    queryFn: async () => {
      let response;
      try {
        response = await dashboardService.getManagerDashboard();
      } catch (e) {
        response = await dashboardService.getTeamDashboard();
      }
      return response?.data?.data || response?.data || response;
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
