import { useEffect, useState } from "react";
import dashboardService from "../services/dashboard.service";

export default function useDashboard() {
  const [dashboard, setDashboard] = useState({
    myLeads: {},
    myVisits: {},
    myTargets: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await dashboardService.getExecutiveDashboard();

      setDashboard(response?.data?.data || response?.data || response || {});
    } catch (err) {
      console.error("Executive Dashboard API Error:", err);
      try {
        const fallback = await dashboardService.getUserDashboard();
        setDashboard(fallback?.data?.data || fallback?.data || fallback || {});
      } catch {
        setDashboard({});
      }
    } finally {
      setLoading(false);
    }
  };


  return {
    dashboard,
    loading,
    refresh: loadDashboard,
  };
}