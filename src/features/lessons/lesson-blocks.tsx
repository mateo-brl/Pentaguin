import { StyleSheet, View } from 'react-native';

import { MarkdownText } from '@/components/markdown-text';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ContentPack, LessonBlock } from '@/content';
import { QuestionCard, type QuestionCardResult } from '@/features/quiz/question-card';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

type Props = {
  block: LessonBlock;
  pack: ContentPack;
  onQuickcheckAnswered?: (questionId: string, result: QuestionCardResult) => void;
};

export function LessonBlockView({ block, pack, onQuickcheckAnswered }: Props) {
  const theme = useTheme();
  const t = useStrings();

  switch (block.type) {
    case 'text':
      return <MarkdownText md={block.md} />;

    case 'callout': {
      const variantStyle = {
        tip: { background: theme.accentSoft, border: theme.accent, label: t.lesson.calloutTip },
        warning: {
          background: theme.dangerSoft,
          border: theme.danger,
          label: t.lesson.calloutWarning,
        },
        exam: { background: theme.streakSoft, border: theme.streak, label: t.lesson.calloutExam },
      }[block.variant];
      return (
        <View
          style={[
            styles.callout,
            { backgroundColor: variantStyle.background, borderLeftColor: variantStyle.border },
          ]}>
          <ThemedText type="smallBold" style={{ color: variantStyle.border }}>
            {variantStyle.label}
          </ThemedText>
          <MarkdownText md={block.md} />
        </View>
      );
    }

    case 'keyterms':
      return (
        <View style={styles.keyterms}>
          {block.terms.map((item) => (
            <View key={item.term} style={styles.keytermRow}>
              <ThemedText type="smallBold" themeColor="accent">
                {item.term}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.def}
              </ThemedText>
            </View>
          ))}
        </View>
      );

    case 'quickcheck': {
      const question = pack.questions.find((q) => q.id === block.questionId);
      if (!question) return null;
      return (
        <View style={styles.quickcheck}>
          <ThemedText type="smallBold">{t.lesson.quickcheck}</ThemedText>
          <QuestionCard
            key={question.id}
            question={question}
            onAnswered={(result) => onQuickcheckAnswered?.(question.id, result)}
          />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  callout: {
    borderLeftWidth: 3,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  keyterms: {
    gap: Spacing.two,
  },
  keytermRow: {
    gap: Spacing.half,
  },
  quickcheck: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
