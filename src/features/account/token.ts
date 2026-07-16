import * as SecureStore from 'expo-secure-store';

// Le token de session vit dans le trousseau iOS (SecureStore), jamais en clair.
const TOKEN_KEY = 'pentaguin_session_token';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // rien à faire : absence de token = déconnecté
  }
}
