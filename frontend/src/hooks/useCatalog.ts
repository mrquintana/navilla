import { useQuery } from '@tanstack/react-query';
import { api, type CatalogResponse } from '../lib/api';
import type { ConditionCatalogItem, NetworkStage } from '../types/catalog';

export type { CatalogResponse, ConditionCatalogItem, NetworkStage };

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.catalog.get(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useConditionCatalog() {
  return useQuery({
    queryKey: ['catalog', 'conditions'],
    queryFn: () => api.catalog.conditions(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useNetworkStages() {
  return useQuery({
    queryKey: ['catalog', 'stages'],
    queryFn: () => api.catalog.stages(),
    staleTime: 60 * 60 * 1000,
  });
}
