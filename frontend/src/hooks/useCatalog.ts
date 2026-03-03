import { useQuery } from '@tanstack/react-query';
import { api, type CatalogResponse } from '../lib/api';

export type { CatalogResponse };

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.catalog.get(),
    staleTime: 30 * 60 * 1000,
  });
}
