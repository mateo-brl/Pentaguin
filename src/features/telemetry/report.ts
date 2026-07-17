import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { backendConfig } from '@/config/backend';

/**
 * Suivi léger des erreurs, OTA-friendly (aucune dépendance native) : on capture
 * les erreurs JS et on les envoie à notre propre backend (POST /v1/telemetry).
 * Ne lève JAMAIS : un échec de report ne doit pas aggraver la situation.
 */
function report(message: string, stack?: string, context?: string): void {
  try {
    void fetch(`${backendConfig.baseUrl}/v1/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.slice(0, 500),
        stack: stack?.slice(0, 4000),
        appVersion: Constants.expoConfig?.version ?? '0.0.0',
        platform: Platform.OS,
        context,
      }),
    }).catch(() => {});
  } catch {
    // jamais throw
  }
}

export function reportError(error: unknown, context?: string): void {
  if (error instanceof Error) report(error.message, error.stack, context);
  else report(String(error), undefined, context);
}

type GlobalErrorUtils = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

let installed = false;

/** Installe le capteur global d'erreurs JS non catchées (une seule fois). */
export function installErrorReporter(): void {
  if (installed) return;
  installed = true;
  const errorUtils = (globalThis as { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler) return;
  const previous = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, isFatal ? 'fatal' : 'non-fatal');
    previous?.(error, isFatal);
  });
}
