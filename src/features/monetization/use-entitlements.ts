import { useEffect, useState } from 'react';

import { activeProvider } from './active-provider';
import type { Entitlements } from './provider';

const empty: Entitlements = new Set();

/** Entitlements courants, mis à jour à chaud (achat, restore). */
export function useEntitlements(): Entitlements {
  const [entitlements, setEntitlements] = useState<Entitlements>(empty);

  useEffect(() => {
    let mounted = true;
    activeProvider.getEntitlements().then((value) => {
      if (mounted) setEntitlements(value);
    });
    const unsubscribe = activeProvider.onChange(setEntitlements);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return entitlements;
}
