import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import territoryService from "../services/territory.service";

export default function useTerritories(options = {}) {
  const debounceEnabled = options.debounce ?? false;
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["territories", debouncedSearch, departmentId],
    queryFn: async () => {
      const params = { search: debouncedSearch };
      const response = await territoryService.getTerritories(params);
      let list = response?.data?.territories || response?.data || [];
      if (departmentId) {
        list = list.filter(t => t.departmentId === departmentId);
      }
      return list;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    territories: data || [],
    loading: isLoading,
    search,
    setSearch,
    departmentId,
    setDepartmentId,
    reload: refetch,
  };
}
