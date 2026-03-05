import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { api } from '../lib/api';
import type { NetworkStage } from '../types/catalog';
import type { NetworkData } from '../lib/visualization/types';

function resolveStage(stages: NetworkStage[], totalNodes: number): NetworkStage | null {
  return (
    stages.find(
      (s) => totalNodes >= s.minNodes && (s.maxNodes == null || totalNodes <= s.maxNodes),
    ) ??
    stages[0] ??
    null
  );
}

export function useNetworkVisualization() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const token = session?.access_token ?? '';
  const userId = session?.user?.id ?? '';

  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const stagesQuery = useQuery({
    queryKey: ['catalog', 'stages'],
    queryFn: () => api.catalog.stages(),
    staleTime: 60 * 60 * 1000,
  });

  const networkData: NetworkData | null = useMemo(() => {
    const exposure = exposureQuery.data;
    const stages = stagesQuery.data;
    if (!exposure || !stages) return null;

    const totalNodes = exposure.totalGraphNodes ?? 0;
    const stage = resolveStage(stages, totalNodes);
    const isSpanish = i18n.language.startsWith('es');

    return {
      directCount: exposure.connectionCount ?? 0,
      degree2Count: exposure.secondDegreeCount ?? 0,
      degree3Count: exposure.thirdDegreeCount ?? 0,
      totalNodes,
      stageName: stage?.code ?? 'EMPTY_SKY',
      stageDisplayName: (isSpanish ? stage?.displayNameEs : stage?.displayName) ?? 'Empty Sky',
      userSeed: userId,
    };
  }, [exposureQuery.data, stagesQuery.data, userId, i18n.language]);

  return {
    data: networkData,
    isLoading: exposureQuery.isLoading || stagesQuery.isLoading,
    isError: exposureQuery.isError || stagesQuery.isError,
  };
}
