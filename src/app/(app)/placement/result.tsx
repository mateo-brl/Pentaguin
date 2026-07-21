import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { RankCrest, rankLabel } from '@/components/ui/rank-badge';
import { Duration, Motion } from '@/constants/motion';
import { Radius, Spacing } from '@/theme';
import { successFeedback } from '@/features/haptics/haptics';
import { usePlacementSession } from '@/features/placement/session';
import { rankById } from '@/features/rank/ranks';
import { useStrings } from '@/i18n/strings';

export default function PlacementResultScreen() {
  const t = useStrings();
  const resultRank = usePlacementSession((s) => s.resultRank);
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (resultRank == null) return;
    successFeedback();
    // Moment « célébration » de la direction de motion : 480 ms, léger dépassement.
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: Duration.celebration,
        easing: Motion.reward,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: Duration.ui,
        easing: Motion.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultRank, scale, opacity]);

  if (resultRank == null) return <Redirect href="/placement" />;

  const rank = rankById(resultRank);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <ThemedText type="label" themeColor="textSecondary">
            {t.placement.resultTitle}
          </ThemedText>

          {/* Le manchot célèbre la montée de rang : c'est LE moment généreux. */}
          <Penguin state="rankup" size={132} animation="pop" />

          <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center', gap: Spacing.sm }}>
            <RankCrest rankId={resultRank} size={104} />
            <ThemedText type="title" style={{ color: rank.color }}>
              {rankLabel(resultRank, t)}
            </ThemedText>
          </Animated.View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            {t.placement.resultBody}
          </ThemedText>
        </View>

        <View style={styles.ctas}>
          <Button label={t.placement.resultCta} onPress={() => router.replace('/learn')} />
          <Button
            label={t.ranksScreen.seeAll}
            variant="ghost"
            onPress={() => router.push('/ranks')}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  ctas: {
    gap: Spacing.sm,
  },
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  medal: {
    width: 128,
    height: 128,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
