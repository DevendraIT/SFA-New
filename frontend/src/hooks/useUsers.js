import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import userService from "../services/user.service";

export default function useUsers(options = {}) {
  const debounceEnabled = options.debounce ?? false;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [debouncedSearch] = useDebounce(
    search,
    debounceEnabled ? 500 : 0
  );

  const loadUsers = async () => {
    try {
      setLoading(true);

      const params = { limit: options.limit || 100 };
      if (debouncedSearch && debouncedSearch.trim().length >= 2) {
        params.search = debouncedSearch;
      }

      const response = await userService.getUsers(params);
      const userList = response?.data?.users || response?.users || response?.data || [];
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch]);

  return {
    users,
    loading,
    search,
    setSearch,
    reload: loadUsers,
  };
}

