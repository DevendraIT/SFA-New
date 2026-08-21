import { useQuery } from "@tanstack/react-query";
import dashboardService from "../services/dashboard.service";

export default function useDashboard(options = {}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: async () => {
      try {
        const response = await dashboardService.getExecutiveDashboard();
        return response?.data?.data || response?.data || response || {};
      } catch (err) {
        console.error("Executive Dashboard API Error:", err);
        const fallback = await dashboardService.getUserDashboard();
        return fallback?.data?.data || fallback?.data || fallback || {};
      }
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    dashboard: data || { myLeads: {}, myVisits: {}, myTargets: [] },
    loading: isLoading,
    reload: refetch,
  };
}