import { useEffect, useRef } from 'react';
import type { NetworkData, VisualizationEngine } from '../../lib/visualization/types';

interface Props {
  engine: VisualizationEngine;
  data: NetworkData;
  className?: string;
}

export function NetworkVisualizationHost({ engine, data, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    engine.mount(container, data);
    mountedRef.current = true;

    return () => {
      engine.destroy();
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    if (mountedRef.current) {
      engine.update(data);
    }
  }, [engine, data]);

  return <div ref={containerRef} className={className} />;
}
