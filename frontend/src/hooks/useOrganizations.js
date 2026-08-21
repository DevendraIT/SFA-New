import { useQuery } from "@tanstack/react-query";
import organizationService from "../services/organization.service";

export default function useOrganizations(options = {}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["organization", "current"],
    queryFn: async () => {
      const response = await organizationService.getCurrentOrganization();
      return response?.data?.organization || (response?.data && typeof response.data === 'object' && response.data.id ? response.data : null);
    },
    enabled: options.enabled ?? true,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    organization: data || null,
    loading: isLoading,
    reload: refetch,
  };
}
