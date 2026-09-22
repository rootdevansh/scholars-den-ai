import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({ baseURL: BASE_URL });

// Generic fetch hook
function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetch(); }, [fetch, ...deps]);

  return { data, loading, error, refetch: fetch };
}

export function usePlan(planId) {
  return useFetch(planId ? `/plans/${planId}` : null, [planId]);
}

export function useToday(planId) {
  return useFetch(planId ? `/plans/${planId}/today` : null, [planId]);
}

export function useInsights(planId) {
  return useFetch(planId ? `/insights/${planId}` : null, [planId]);
}

export function useTopics(planId) {
  return useFetch(planId ? `/topics/${planId}` : null, [planId]);
}

export function useReminders(planId) {
  return useFetch(planId ? `/plans/${planId}/reminders` : null, [planId]);
}

export function usePlans() {
  return useFetch('/plans');
}
