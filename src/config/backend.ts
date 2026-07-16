/**
 * Backend classement/stats (v1.1). IP directe assumée (choix produit) :
 * HTTP sans donnée sensible — seuls transitent un UUID anonyme, un pseudo
 * choisi et des points. L'URL est du JS pur : une bascule vers un domaine
 * + HTTPS se pousse en OTA sans rebuild.
 */
export const backendConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://82.66.208.23:8081',
};
