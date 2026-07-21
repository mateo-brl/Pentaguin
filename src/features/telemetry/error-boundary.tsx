import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#0A0F1C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    color: '#EAF0FB',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: '#8695AE',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2DE0A6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    color: '#05231A',
    fontSize: 15,
    fontWeight: '700',
  },
});
