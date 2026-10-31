import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { hasPendingPageData } from './page-readiness';

describe('page readiness', () => {
  it('waits for an active first load, then releases when data arrives', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let resolve: ((value: string) => void) | undefined;
    const observer = new QueryObserver(client, { queryKey: ['cold'], queryFn: () => new Promise<string>(done => { resolve = done; }) });
    const unsubscribe = observer.subscribe(() => {});
    expect(hasPendingPageData(client)).toBe(true);
    resolve?.('loaded');
    await observer.refetch();
    expect(hasPendingPageData(client)).toBe(false);
    unsubscribe();
    client.clear();
  });

  it('does not block on a cached background refresh', () => {
    const client = new QueryClient();
    client.setQueryData(['cached'], 'ready');
    const observer = new QueryObserver(client, { queryKey: ['cached'], queryFn: () => new Promise<string>(() => {}) });
    const unsubscribe = observer.subscribe(() => {});
    expect(hasPendingPageData(client)).toBe(false);
    unsubscribe();
    client.clear();
  });

  it('ignores inactive requests from previous routes', () => {
    const client = new QueryClient();
    const observer = new QueryObserver(client, { queryKey: ['previous'], queryFn: () => new Promise<string>(() => {}) });
    const unsubscribe = observer.subscribe(() => {});
    unsubscribe();
    expect(hasPendingPageData(client)).toBe(false);
    client.clear();
  });

  it('releases failed requests so the page can show its error state', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const observer = new QueryObserver(client, { queryKey: ['error'], queryFn: async () => { throw new Error('Unavailable'); } });
    const unsubscribe = observer.subscribe(() => {});
    await observer.refetch();
    expect(hasPendingPageData(client)).toBe(false);
    unsubscribe();
    client.clear();
  });
});