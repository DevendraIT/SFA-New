import { useCallback, useEffect, useState } from "react";
import dashboardService from "../services/dashboard.service";

export default function useExecutiveDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getSuperAdminDashboard();
      setDashboard(response?.data?.data || response?.data || response);
    } catch (err) {
      console.error("Super Admin Dashboard fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: loadDashboard,
  };
}