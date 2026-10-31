import type { QueryClient } from '@tanstack/react-query';

// Only first-load queries observed by the current screen block its reveal.
// Cached background refreshes, inactive requests and failed queries do not.
export function hasPendingPageData(client: QueryClient) {
  return client.getQueryCache().getAll().some(query =>
    query.getObserversCount() > 0 &&
    query.state.data === undefined &&
    query.state.status === 'pending' &&
    query.state.fetchStatus === 'fetching'
  );
}

export function hasPageLoadingIndicator(root: Element | null) {
  if (!root) return false;
  return Array.from(root.querySelectorAll<HTMLElement>('[data-page-loading="true"], [data-loading="true"], [aria-busy="true"], .animate-pulse'))
    .some(element => element.getClientRects().length > 0 && !element.closest('[data-route-transition]'));
}