import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import departmentService from "../services/department.service";

export default function useDepartments(options = {}) {
  const debounceEnabled = options.debounce ?? false;

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const loadDepartments = async () => {
    try {
      setLoading(true);

      const params = { search: debouncedSearch };

      const response = await departmentService.getDepartments(params);

      let data = response?.data?.departments || [];
      if (branchId) {
        data = data.filter(d => d.branchId === branchId || !d.branchId);
      }
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [debouncedSearch, branchId]);

  return {
    departments,
    loading,
    search,
    setSearch,
    branchId,
    setBranchId,
    reload: loadDepartments,
  };
}

