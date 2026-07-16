/**
 * Backend classement/stats. HTTPS via pentaguin.mateobrl.fr (certificat
 * Let's Encrypt, WAF SafeLine en frontal). L'URL est du JS pur : tout
 * changement se pousse en OTA sans rebuild.
 */
export const backendConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://pentaguin.mateobrl.fr',
};
