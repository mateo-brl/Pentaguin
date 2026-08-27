import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getKv, resetLocalProgress, setKv } from '@/db/repositories';
import {
  resetLeaderboardIdentity,
  setPseudo as setLocalPseudo,
} from '@/features/leaderboard/identity';
import { getRank, setRank } from '@/features/rank/ranks';

import {
  ApiError,
  fetchMe,
  setAvatar as apiSetAvatar,
  setPseudo as apiSetPseudo,
  type Me,
  type Session,
} from './api';
import { reloadDailyGoal } from '@/features/settings/daily-goal';
import { pushNow } from '@/features/sync/cloud-save';

import { clearToken, getToken, setToken } from './token';

// Drapeau local « compte prêt » (connecté + pseudo choisi). Permet, hors-ligne,
// de rouvrir l'app sans re-contacter le serveur : offline-first préservé une fois
// le tout premier login effectué.
const READY_KEY = 'account_ready';
/** Compte auquel la progression locale appartient. */
const BOUND_ACCOUNT_KEY = 'bound_account';

/**
 * État d'entrée de l'app :
 * - loading    : on lit le trousseau / on interroge /me (splash affiché)
 * - signedOut  : aucun compte → écran de connexion (mur obligatoire)
 * - needsPseudo: connecté mais pseudo pas encore choisi → écran de choix
 * - ready      : connecté + pseudo → app déverrouillée
 */
export type SessionStatus = 'loading' | 'signedOut' | 'needsPseudo' | 'ready';

type SessionValue = {
  status: SessionStatus;
  me: Me | null;
  token: string | null;
  signIn: (session: Session) => Promise<void>;
  submitPseudo: (pseudo: string) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  /** `wipeLocal` : efface la progression locale (défaut). `push` : sauvegarde avant. */
  signOut: (wipeLocal?: boolean, push?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession doit être utilisé dans <SessionProvider>');
  return value;
}

// Garde le splash natif tant que l'état de session n'est pas résolu.
void SplashScreen.preventAutoHideAsync();

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  // Applique un /me : miroir du pseudo en local (pour le sync classement) et
  // bascule vers ready / needsPseudo selon qu'un pseudo est déjà défini.
  const applyMe = useCallback((data: Me) => {
    // Filet de sécurité : si un compte DIFFÉRENT se connecte sur cet appareil,
    // la progression restée en base appartient au précédent. Sans cet effacement,
    // la sauvegarde cloud la fusionnerait dans le compte neuf — ce qui est
    // arrivé après une suppression de compte, le nouveau compte héritant du rang
    // et de l'XP de l'ancien. Cette garde ne dépend d'aucun chemin de sortie :
    // elle rattrape aussi une déconnexion incomplète ou un binaire plus ancien.
    const bound = getKv(BOUND_ACCOUNT_KEY);
    if (bound && bound !== data.id) {
      resetLocalProgress();
      reloadDailyGoal();
      resetLeaderboardIdentity();
    }
    setKv(BOUND_ACCOUNT_KEY, data.id);

    setMe(data);
    // Restaure le rang du compte sur un appareil qui n'en a pas encore (le local
    // reste prioritaire s'il existe déjà).
    if (data.rankId != null && getRank() == null) setRank(data.rankId);
    if (data.pseudo && data.pseudo.trim()) {
      setLocalPseudo(data.pseudo);
      setKv(READY_KEY, '1');
      setStatus('ready');
    } else {
      setKv(READY_KEY, '');
      setStatus('needsPseudo');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getToken();
        if (cancelled) return;
        if (!stored) {
          setStatus('signedOut');
          return;
        }
        setTokenState(stored);
        try {
          const data = await fetchMe(stored);
          if (!cancelled) applyMe(data);
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 401) {
            // Token révoqué / invalide : on repart proprement à la connexion.
            await clearToken();
            setTokenState(null);
            setStatus('signedOut');
          } else if (getKv(READY_KEY) === '1') {
            // Hors-ligne mais déjà prêt auparavant : on entre sans réseau.
            setStatus('ready');
          } else {
            // Token présent mais pseudo jamais confirmé (et /me injoignable).
            setStatus('needsPseudo');
          }
        }
      } finally {
        if (!cancelled) void SplashScreen.hideAsync();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  const signIn = useCallback(
    async (session: Session) => {
      await setToken(session.token);
      setTokenState(session.token);
      try {
        applyMe(await fetchMe(session.token));
      } catch {
        // Connexion tout juste réussie mais /me a échoué : on demande le pseudo
        // (l'écran de choix retentera l'appel serveur).
        setStatus('needsPseudo');
      }
    },
    [applyMe],
  );

  const submitPseudo = useCallback(
    async (pseudo: string) => {
      if (!token) throw new Error('non connecté');
      const result = await apiSetPseudo(token, pseudo);
      setLocalPseudo(result.pseudo);
      setKv(READY_KEY, '1');
      setMe((prev) => (prev ? { ...prev, pseudo: result.pseudo } : prev));
      setStatus('ready');
    },
    [token],
  );

  const updateAvatar = useCallback(
    async (avatar: string) => {
      if (!token) throw new Error('non connecté');
      const result = await apiSetAvatar(token, avatar);
      setMe((prev) => (prev ? { ...prev, avatar: result.avatar } : prev));
    },
    [token],
  );

  /**
   * `wipeLocal` efface la progression restée sur l'appareil. Indispensable : la
   * sauvegarde cloud pousse le local vers le compte connecté, donc sans ça le
   * compte suivant hérite de la progression du précédent (rang, XP, onboarding
   * déjà vu). On pousse d'abord, au cas où du travail n'aurait pas encore été
   * synchronisé — inutile après une suppression, le compte n'existe plus.
   */
  const signOut = useCallback(async (wipeLocal = true, push = true) => {
    if (push) await pushNow();
    await clearToken();
    if (wipeLocal) {
      resetLocalProgress();
      reloadDailyGoal();
    }
    setKv(READY_KEY, '');
    resetLeaderboardIdentity();
    setTokenState(null);
    setMe(null);
    setStatus('signedOut');
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      applyMe(await fetchMe(token));
    } catch {
      // silencieux : le prochain lancement ré-essaiera.
    }
  }, [token, applyMe]);

  const value = useMemo<SessionValue>(
    () => ({ status, me, token, signIn, submitPseudo, updateAvatar, signOut, refresh }),
    [status, me, token, signIn, submitPseudo, updateAvatar, signOut, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
