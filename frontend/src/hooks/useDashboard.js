import { useCallback, useEffect, useState } from "react";
import dashboardService from "../services/dashboard.service";

export default function useDashboard() {
  const [dashboard, setDashboard] = useState({
    myLeads: {},
    myVisits: {},
    myTargets: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const response = await dashboardService.getUserDashboard();

      setDashboard(response?.data?.data || response?.data || response || {});
    } catch (err) {
      console.error("Sales Dashboard API Error:", err);
      try {
        const fallback = await dashboardService.getExecutiveDashboard();
        setDashboard(fallback?.data?.data || fallback?.data || fallback || {});
      } catch {
        setDashboard({});
      }
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
    refresh: loadDashboard,
  };
}