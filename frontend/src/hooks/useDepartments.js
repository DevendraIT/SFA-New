import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import departmentService from "../services/department.service";

export default function useDepartments(options = {}) {
  const debounceEnabled = options.debounce ?? false;
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["departments", debouncedSearch, branchId],
    queryFn: async () => {
      const params = { search: debouncedSearch };
      const response = await departmentService.getDepartments(params);
      let list = response?.data?.departments || response?.data || [];
      if (branchId) {
        list = list.filter(d => d.branchId === branchId || !d.branchId);
      }
      return list;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    departments: data || [],
    loading: isLoading,
    search,
    setSearch,
    branchId,
    setBranchId,
    reload: refetch,
  };
}
