import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import branchService from "../services/branch.service";

export default function useBranches(options = {}) {
  const debounceEnabled = options.debounce ?? false;
  const [search, setSearch] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["branches", debouncedSearch],
    queryFn: async () => {
      const response = await branchService.getBranches({
        search: debouncedSearch,
      });
      return response?.data?.branches || response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    branches: data || [],
    loading: isLoading,
    search,
    setSearch,
    reload: refetch,
  };
}
