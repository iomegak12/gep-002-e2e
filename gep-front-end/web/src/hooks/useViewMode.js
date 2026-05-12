import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useViewPrefsStore } from '@/stores/viewPrefsStore';
import { VIEW_MODES } from '@/components/views/ViewSwitcher';

/**
 * Per-screen view mode hook.
 * Source of truth precedence: URL `?view=` (sharable) → localStorage pref → default.
 * Returns [mode, setMode] — setMode writes both to the URL and to the pref store.
 */
export function useViewMode(screenKey, fallback = 'grid') {
  const [params, setParams] = useSearchParams();
  const stored = useViewPrefsStore((s) => s.prefs[screenKey]);
  const setStored = useViewPrefsStore((s) => s.set);

  const urlValue = params.get('view');
  const effective = VIEW_MODES.includes(urlValue)
    ? urlValue
    : VIEW_MODES.includes(stored)
      ? stored
      : fallback;

  // Keep URL and store in sync when only the store has a value.
  useEffect(() => {
    if (!urlValue && VIEW_MODES.includes(stored) && stored !== fallback) {
      const next = new URLSearchParams(params);
      next.set('view', stored);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback(
    (next) => {
      if (!VIEW_MODES.includes(next)) return;
      setStored(screenKey, next);
      const sp = new URLSearchParams(params);
      sp.set('view', next);
      setParams(sp, { replace: true });
    },
    [screenKey, params, setParams, setStored]
  );

  return [effective, setMode];
}
