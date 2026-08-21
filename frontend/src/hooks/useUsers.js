import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import userService from "../services/user.service";

export default function useUsers(options = {}) {
  const debounceEnabled = options.debounce ?? false;
  const [search, setSearch] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const limitParam = options.limit || 100;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users", debouncedSearch, limitParam],
    queryFn: async () => {
      const params = { limit: limitParam };
      if (debouncedSearch && debouncedSearch.trim().length >= 2) {
        params.search = debouncedSearch;
      }
      const response = await userService.getUsers(params);
      const userList = response?.data?.users || response?.users || response?.data || [];
      return Array.isArray(userList) ? userList : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    users: data || [],
    loading: isLoading,
    search,
    setSearch,
    reload: refetch,
  };
}
