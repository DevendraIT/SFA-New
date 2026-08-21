import { useQuery } from "@tanstack/react-query";
import dashboardService from "../services/dashboard.service";

export default function useHeadOfSalesDashboard(options = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "head-of-sales"],
    queryFn: async () => {
      const response = await dashboardService.getHeadOfSalesDashboard();
      return response?.data?.data || response?.data || response;
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    dashboard: data || null,
    loading: isLoading,
    error,
    refresh: refetch,
  };
}
