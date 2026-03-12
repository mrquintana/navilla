import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Share2, Sparkles } from 'lucide-react';
import { useReciprocityStatus } from '../hooks/useReciprocity';
import { useNetworkVisualization } from '../hooks/useNetworkVisualization';
import { useNetworkHealth } from '../hooks/useNetworkHealth';
import { NetworkVisualizationHost } from '../components/network/NetworkVisualizationHost';
import { NetworkHealthSection } from '../components/network/NetworkHealthSection';
import { ShareConstellationModal } from '../components/network/ShareConstellationModal';
import { ReciprocityOptInCard } from '../components/reciprocity/ReciprocityOptInCard';
import { PageSkeleton, SkeletonBlock } from '../components/ui/LoadingShell';
import { ActiveEngine } from '../lib/visualization';

export function NetworkPage() {
  const { t } = useTranslation();
  const { data: reciprocityStatus, isLoading: reciprocityLoading } = useReciprocityStatus();
  const { data: networkData, isLoading: dataLoading } = useNetworkVisualization();
  const { data: networkHealthData } = useNetworkHealth();
  const [shareOpen, setShareOpen] = useState(false);
  const [showConstellationHelp, setShowConstellationHelp] = useState(false);
  const engine = useMemo(() => new ActiveEngine(), []);

  const isLoading = reciprocityLoading || dataLoading;
  const isOptedIn = reciprocityStatus?.optedIn === true;

  if (!isLoading && !isOptedIn) {
    return (
      <div className="container py-8">
        <ReciprocityOptInCard />
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-8 w-48 rounded-lg" />
        <SkeletonBlock className="h-64 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
      </PageSkeleton>
    );
  }

  const isColdStart = !networkData || networkData.totalNodes === 0;

  return (
    <div className="container py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h1 className="text-2xl font-bold">{t('nav.network')}</h1>
        </div>
        {networkData && (
          <span className="badge badge-primary text-sm">{networkData.stageDisplayName}</span>
        )}
      </div>

      {/* Network Health Stats — first thing visible */}
      {networkHealthData && (
        <NetworkHealthSection data={networkHealthData} />
      )}

      {/* Cold start — no data yet */}
      {isColdStart && (
        <div className="card card-elevated text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'var(--color-muted)' }} />
          <p className="text-muted mb-2">{t('network.coldStartMessage')}</p>
          <Link to="/connections" className="text-primary font-medium">{t('network.coldStartLink')}</Link>
        </div>
      )}

      {/* Constellation — compact card */}
      {networkData && !isColdStart && (
        <div className="card card-elevated">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                {t('network.constellation')}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm p-1"
                onClick={() => setShowConstellationHelp((prev) => !prev)}
                aria-label={t('network.constellationHelpTitle')}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {t('network.share')}
            </button>
          </div>

          {showConstellationHelp && (
            <div className="mb-3 rounded-md border border-border-light p-3 text-xs text-muted" style={{ background: 'var(--color-background-secondary)' }}>
              <p className="font-semibold text-foreground mb-1">{t('network.constellationHelpTitle')}</p>
              <p>{t('network.constellationHelpBody')}</p>
            </div>
          )}

          <div className="rounded-lg overflow-hidden" style={{ height: 250, background: 'linear-gradient(180deg, #1e1b4b 0%, #0a0a0f 100%)' }}>
            <NetworkVisualizationHost engine={engine} data={networkData} className="w-full h-full" />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-muted">
              {t('network.stats', {
                direct: networkData.directCount,
                extended: networkData.degree2Count + networkData.degree3Count,
                total: networkData.totalNodes,
              })}
            </p>
          </div>
        </div>
      )}

      <ShareConstellationModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        engine={engine}
        data={networkData!}
      />
    </div>
  );
}
