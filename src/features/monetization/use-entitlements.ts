import { useEffect, useState } from 'react';

import { activeProvider } from './active-provider';
import type { Entitlements } from './provider';

const empty: Entitlements = new Set();

/** Entitlements courants, mis à jour à chaud (achat, restore). */
export function useEntitlements(): Entitlements {
  const [entitlements, setEntitlements] = useState<Entitlements>(empty);

  useEffect(() => {
    let mounted = true;
    // Un échec de lecture (hors-ligne, boutique injoignable) ne doit pas faire
    // remonter une promesse non gérée : on garde le Set courant et le listener
    // corrigera dès que l'info revient.
    activeProvider
      .getEntitlements()
      .then((value) => {
        if (mounted) setEntitlements(value);
      })
      .catch(() => {});
    const unsubscribe = activeProvider.onChange(setEntitlements);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return entitlements;
}
