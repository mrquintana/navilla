import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react';
import { useReciprocityStatus } from '../hooks/useReciprocity';
import { useNetworkVisualization } from '../hooks/useNetworkVisualization';
import { NetworkVisualizationHost } from '../components/network/NetworkVisualizationHost';
import { ShareConstellationModal } from '../components/network/ShareConstellationModal';
import { ReciprocityOptInCard } from '../components/reciprocity/ReciprocityOptInCard';
import { ActiveEngine } from '../lib/visualization';

export function NetworkPage() {
  const { t } = useTranslation();
  const { data: reciprocityStatus, isLoading: reciprocityLoading } = useReciprocityStatus();
  const { data: networkData, isLoading: dataLoading } = useNetworkVisualization();
  const [shareOpen, setShareOpen] = useState(false);
  const engine = useMemo(() => new ActiveEngine(), []);

  const isLoading = reciprocityLoading || dataLoading;
  const isOptedIn = reciprocityStatus?.optedIn === true;

  // Not opted in — show reciprocity card on dark background
  if (!isLoading && !isOptedIn) {
    return (
      <div className="network-locked">
        <ReciprocityOptInCard />
      </div>
    );
  }

  // Loading
  if (isLoading || !networkData) {
    return (
      <div className="network-locked">
        <span className="spinner" style={{ borderTopColor: '#a5b4fc' }} aria-label={t('common.loading')} />
      </div>
    );
  }

  const isColdStart = networkData.totalNodes === 0;
  const statsText = t('network.stats', {
    direct: networkData.directCount,
    extended: networkData.degree2Count + networkData.degree3Count,
    total: networkData.totalNodes,
  });

  return (
    <>
      <div className="network-page">
        <div className="network-page-canvas">
          <NetworkVisualizationHost
            engine={engine}
            data={networkData}
            className="w-full h-full"
          />
          <div className="network-page-overlay">
            <div>
              <span className="network-stage-badge">{networkData.stageDisplayName}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="network-stats">{statsText}</p>
                {isColdStart && (
                  <div className="network-cold-start">
                    <p>{t('network.coldStartMessage')}</p>
                    <Link to="/connections">{t('network.coldStartLink')}</Link>
                  </div>
                )}
              </div>
              {!isColdStart && (
                <button
                  type="button"
                  className="network-share-btn"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  {t('network.share')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareConstellationModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        engine={engine}
        data={networkData}
      />
    </>
  );
}
