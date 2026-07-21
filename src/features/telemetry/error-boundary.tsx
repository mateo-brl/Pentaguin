import { palette } from '@/theme/primitives';
import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Radius, Spacing } from '@/theme';

import { getStrings } from '@/i18n/strings';

import { reportError } from './report';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Filet de sécurité : capture les erreurs de rendu, les remonte à la télémétrie
 * et affiche un écran de repli plutôt qu'un écran blanc. Doit être une classe
 * (les Error Boundaries ne supportent pas les hooks) — d'où les couleurs figées.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    reportError(error, `render${info?.componentStack ? `: ${info.componentStack.slice(0, 200)}` : ''}`);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const t = getStrings();
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.crash.title}</Text>
        <Text style={styles.body}>{t.crash.body}</Text>
        <Pressable style={styles.button} onPress={() => this.setState({ hasError: false })}>
          <Text style={styles.buttonText}>{t.crash.retry}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.ink800,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    color: palette.glacier100,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: palette.glacier300,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: palette.amber500,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  buttonText: {
    color: palette.onAmber,
    fontSize: 15,
    fontWeight: '700',
  },
});
