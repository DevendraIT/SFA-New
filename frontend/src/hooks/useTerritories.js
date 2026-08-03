import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import territoryService from "../services/territory.service";

export default function useTerritories(options = {}) {
  const debounceEnabled = options.debounce ?? false;

  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const loadTerritories = async () => {
    try {
      setLoading(true);

      const params = { search: debouncedSearch };

      const response = await territoryService.getTerritories(params);

      let data = response?.data?.territories || [];
      if (departmentId) {
        data = data.filter(t => t.departmentId === departmentId);
      }
      setTerritories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerritories();
  }, [debouncedSearch, departmentId]);

  return {
    territories,
    loading,
    search,
    setSearch,
    departmentId,
    setDepartmentId,
    reload: loadTerritories,
  };
}
