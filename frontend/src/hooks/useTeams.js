import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import teamService from "../services/team.service";

export default function useTeams(options = {}) {
  const debounceEnabled = options.debounce ?? false;
  const [search, setSearch] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teams", debouncedSearch],
    queryFn: async () => {
      const response = await teamService.getTeams({
        search: debouncedSearch,
      });
      return response?.data?.teams || response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    teams: data || [],
    loading: isLoading,
    search,
    setSearch,
    reload: refetch,
  };
}
