import Ionicons from '@expo/vector-icons/Ionicons';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };

type ToastValue = { show: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return value;
}

const VISIBLE_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, type });
      opacity.setValue(0);
      translateY.setValue(-12);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(hide, VISIBLE_MS);
    },
    [opacity, translateY, hide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && <ToastView toast={toast} opacity={opacity} translateY={translateY} onPress={hide} />}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  opacity,
  translateY,
  onPress,
}: {
  toast: Toast;
  opacity: Animated.Value;
  translateY: Animated.Value;
  onPress: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const accent =
    toast.type === 'success' ? theme.success : toast.type === 'error' ? theme.danger : theme.accent;
  const icon =
    toast.type === 'success'
      ? 'checkmark-circle'
      : toast.type === 'error'
        ? 'alert-circle'
        : 'information-circle';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8, opacity, transform: [{ translateY }] }]}>
      <Pressable
        onPress={onPress}
        style={[styles.toast, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name={icon} size={20} color={accent} />
        <ThemedText type="smallBold" style={styles.text}>
          {toast.message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    flexShrink: 1,
  },
});
