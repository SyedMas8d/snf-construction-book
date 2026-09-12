import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Site } from '../api/types';

type SitesContextValue = {
  sites: Site[];
  loading: boolean;
  error: string | null;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  refreshSites: () => Promise<void>;
};

const SitesContext = createContext<SitesContextValue | undefined>(undefined);

export function SitesProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const refreshSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.sites.list();
      setSites(result);
      setSelectedSiteId((current) => current ?? result[0]?._id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSites();
  }, [refreshSites]);

  return (
    <SitesContext.Provider value={{ sites, loading, error, selectedSiteId, setSelectedSiteId, refreshSites }}>
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  const ctx = useContext(SitesContext);
  if (!ctx) {
    throw new Error('useSites must be used within a SitesProvider');
  }
  return ctx;
}
