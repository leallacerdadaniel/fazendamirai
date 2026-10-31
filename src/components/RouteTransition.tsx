import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { Home, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { moduleForPath } from '@/lib/modules';
import { hasPageLoadingIndicator, hasPendingPageData } from '@/lib/page-readiness';
import { Logo } from './Logo';

const MIN_MS = 700;
const MAX_MS = 9000;
const EXIT_MS = 240;

export function RouteTransition() {
  const location = useLocation();
  const client = useQueryClient();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'exit' | null>(null);

  useLayoutEffect(() => {
    if (!user || loading || location.pathname === '/login') {
      setPhase(null);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let quietSince: number | null = null;
    let exitTimer: number | undefined;
    setPhase('loading');

    const interval = window.setInterval(() => {
      const now = performance.now();
      const pending = hasPendingPageData(client) || hasPageLoadingIndicator(document.querySelector('main'));
      if (pending) quietSince = null;
      else if (quietSince === null) quietSince = now;

      const ready = quietSince !== null && now - quietSince >= 160 && now - startedAt >= (reducedMotion ? 0 : MIN_MS);
      if (!ready && now - startedAt < MAX_MS) return;

      window.clearInterval(interval);
      setPhase('exit');
      exitTimer = window.setTimeout(() => setPhase(null), reducedMotion ? 0 : EXIT_MS);
    }, 80);

    return () => {
      window.clearInterval(interval);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
    };
  }, [location.key, location.pathname, client, user?.id, loading]);

  if (!phase || !user || location.pathname === '/login') return null;

  const module = moduleForPath(location.pathname);
  const item = module?.items.find(item => location.pathname === item.url || location.pathname.startsWith(`${item.url}/`));
  const title = item?.title || module?.title || (location.pathname === '/dashboard' ? 'Início' : 'Módulos');
  const Icon = item?.icon || module?.icon || (location.pathname === '/dashboard' ? Home : LayoutGrid);

  return createPortal(
    <div key={location.key} data-route-transition data-phase={phase} className="route-transition fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background" role="status" aria-live="polite" aria-label={`Carregando ${title}`}>
      <div className="route-transition-brand absolute left-6 top-6 flex items-center gap-3 md:left-10 md:top-8"><Logo size="md" /><span className="text-sm font-semibold text-foreground">Fazenda Miraí</span></div>
      <div className="route-transition-scene flex w-full max-w-sm flex-col items-center px-6">
        <div className="route-transition-icon flex h-24 w-24 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Icon className="h-10 w-10" strokeWidth={1.5} /></div>
        <p className="mt-7 text-xs font-semibold uppercase text-muted-foreground">{module?.title || 'Fazenda Miraí'}</p>
        <h2 className="mt-2 text-center text-2xl font-bold text-foreground">{title}</h2>
        <div className="route-transition-track mt-7 h-0.5 w-32 overflow-hidden rounded-full bg-border"><div className="route-transition-progress h-full w-1/2 bg-secondary" /></div>
        <span className="sr-only">Aguarde enquanto a tela é carregada.</span>
      </div>
    </div>,
    document.body
  );
}