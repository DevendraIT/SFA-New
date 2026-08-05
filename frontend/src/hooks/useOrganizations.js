import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import organizationService from "../services/organization.service";

export default function useOrganizations() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getCurrentOrganization();
      setOrganization(response?.data?.organization || null);
    } catch (err) {
      console.error(err);
      if (err?.response?.status !== 404) {
        toast.error("Failed to load organization");
      }
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  return {
    organization,
    loading,
    reload: loadOrganization,
  };
}
