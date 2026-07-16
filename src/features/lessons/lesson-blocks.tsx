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
          <ThemedText type="label" style={{ color: variantStyle.border }}>
            {variantStyle.label}
          </ThemedText>
          <MarkdownText md={block.md} />
        </View>
      );
    }

    case 'keyterms':
      return (
        <View style={[styles.keyterms, { borderColor: theme.border }]}>
          {block.terms.map((item, index) => (
            <View
              key={item.term}
              style={[
                styles.keytermRow,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
              ]}>
              <ThemedText type="mono" themeColor="accent" style={styles.term}>
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
          <ThemedText type="label">{t.lesson.quickcheck}</ThemedText>
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
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  keyterms: {
    borderWidth: 1,
    borderRadius: 12,
  },
  keytermRow: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  term: {
    fontSize: 14,
  },
  quickcheck: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
