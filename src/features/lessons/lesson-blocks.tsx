import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MarkdownText } from '@/components/markdown-text';
import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/theme';
import type { ContentPack, LessonBlock } from '@/content';
import { errorFeedback, successFeedback, tapFeedback } from '@/features/haptics/haptics';
import { QuestionCard, type QuestionCardResult } from '@/features/quiz/question-card';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

type Props = {
  block: LessonBlock;
  pack: ContentPack;
  onQuickcheckAnswered?: (questionId: string, result: QuestionCardResult) => void;
  /** Appelé quand un bloc interactif (predict, truefalse, quickcheck) est résolu. */
  onInteracted?: () => void;
};

export function LessonBlockView({ block, pack, onQuickcheckAnswered, onInteracted }: Props) {
  const theme = useTheme();
  const t = useStrings();

  switch (block.type) {
    case 'text':
      return <MarkdownText md={block.md} />;

    case 'hook':
      return <HookBlock md={block.md} />;

    case 'predict':
      return <PredictBlock block={block} onInteracted={onInteracted} />;

    case 'truefalse':
      return <TrueFalseBlock block={block} onInteracted={onInteracted} />;

    case 'flipcards':
      return <FlipcardsBlock cards={block.cards} />;

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
            onAnswered={(result) => {
              onQuickcheckAnswered?.(question.id, result);
              onInteracted?.();
            }}
          />
        </View>
      );
    }
  }
}

// — Accroche : le manchot pose l'enjeu ---------------------------------------------
function HookBlock({ md }: { md: string }) {
  const theme = useTheme();
  return (
    <View style={styles.hookRow}>
      <Penguin state="focus" accessory="terminal" size={52} />
      <View
        style={[
          styles.hookBubble,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <MarkdownText md={md} />
      </View>
    </View>
  );
}

// — Pari d'intuition : on répond AVANT l'explication, se tromper est safe ----------
type PredictBlockData = Extract<LessonBlock, { type: 'predict' }>;

function PredictBlock({
  block,
  onInteracted,
}: {
  block: PredictBlockData;
  onInteracted?: () => void;
}) {
  const theme = useTheme();
  const t = useStrings();
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked != null;
  const gotIt = picked === block.correctId;

  const pick = (id: string) => {
    if (answered) return;
    setPicked(id);
    if (id === block.correctId) successFeedback();
    else errorFeedback();
    onInteracted?.();
  };

  return (
    <View style={[styles.interactive, { borderColor: theme.accent }]}>
      <ThemedText type="label" themeColor="accent">
        {t.lesson.predictTitle}
      </ThemedText>
      <ThemedText type="smallBold">{block.question}</ThemedText>
      <View style={styles.choiceList}>
        {block.choices.map((choice) => {
          const isPicked = picked === choice.id;
          const isAnswer = answered && choice.id === block.correctId;
          const isWrongPick = answered && isPicked && !isAnswer;
          return (
            <Pressable
              key={choice.id}
              disabled={answered}
              onPress={() => pick(choice.id)}
              style={[
                styles.choice,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                isAnswer && { backgroundColor: theme.successSoft, borderColor: theme.success },
                isWrongPick && { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
              ]}>
              <ThemedText type="small" style={styles.flex}>
                {choice.text}
              </ThemedText>
              {isAnswer && <Ionicons name="checkmark-circle" size={18} color={theme.success} />}
              {isWrongPick && <Ionicons name="close-circle" size={18} color={theme.danger} />}
            </Pressable>
          );
        })}
      </View>
      {answered && (
        <View style={[styles.reveal, { backgroundColor: gotIt ? theme.successSoft : theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={{ color: gotIt ? theme.success : theme.text }}>
            {gotIt ? t.lesson.predictRight : t.lesson.predictWrong}
          </ThemedText>
          <ThemedText type="small">{block.reveal}</ThemedText>
        </View>
      )}
    </View>
  );
}

// — Vrai/faux ----------------------------------------------------------------------
type TrueFalseBlockData = Extract<LessonBlock, { type: 'truefalse' }>;

function TrueFalseBlock({
  block,
  onInteracted,
}: {
  block: TrueFalseBlockData;
  onInteracted?: () => void;
}) {
  const theme = useTheme();
  const t = useStrings();
  const [picked, setPicked] = useState<boolean | null>(null);
  const answered = picked != null;
  const gotIt = picked === block.answer;

  const pick = (value: boolean) => {
    if (answered) return;
    setPicked(value);
    if (value === block.answer) successFeedback();
    else errorFeedback();
    onInteracted?.();
  };

  return (
    <View style={[styles.interactive, { borderColor: theme.border }]}>
      <ThemedText type="smallBold">{block.statement}</ThemedText>
      <View style={styles.tfRow}>
        {([true, false] as const).map((value) => {
          const label = value ? t.lesson.trueLabel : t.lesson.falseLabel;
          const isPicked = picked === value;
          const isAnswer = answered && value === block.answer;
          const isWrongPick = answered && isPicked && !isAnswer;
          return (
            <Pressable
              key={label}
              disabled={answered}
              onPress={() => pick(value)}
              style={[
                styles.tfButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                isAnswer && { backgroundColor: theme.successSoft, borderColor: theme.success },
                isWrongPick && { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
              ]}>
              <ThemedText
                type="smallBold"
                style={isAnswer ? { color: theme.success } : isWrongPick ? { color: theme.danger } : undefined}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {answered && (
        <View style={[styles.reveal, { backgroundColor: gotIt ? theme.successSoft : theme.backgroundSelected }]}>
          <ThemedText type="small">{block.explanation}</ThemedText>
        </View>
      )}
    </View>
  );
}

// — Cartes à retourner -------------------------------------------------------------
function FlipcardsBlock({ cards }: { cards: { front: string; back: string }[] }) {
  const theme = useTheme();
  const t = useStrings();
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set());

  const toggle = (index: number) => {
    tapFeedback();
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View style={styles.flipWrap}>
      <ThemedText type="small" themeColor="textSecondary">
        {t.lesson.flipHint}
      </ThemedText>
      <View style={styles.flipGrid}>
        {cards.map((card, index) => {
          const isBack = flipped.has(index);
          return (
            <Pressable
              key={card.front}
              onPress={() => toggle(index)}
              style={[
                styles.flipCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                isBack && { backgroundColor: theme.backgroundSelected, borderColor: theme.accent },
              ]}>
              {isBack ? (
                <ThemedText type="small">{card.back}</ThemedText>
              ) : (
                <ThemedText type="mono" themeColor="accent" style={styles.term}>
                  {card.front}
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Le bloc bloque-t-il l'avancée tant qu'il n'a pas été résolu ? */
export function isInteractiveBlock(block: LessonBlock): boolean {
  return block.type === 'predict' || block.type === 'truefalse' || block.type === 'quickcheck';
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  callout: {
    borderLeftWidth: 3,
    borderRadius: Radius.sm,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  keyterms: {
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  keytermRow: {
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  term: {
    fontSize: 14,
  },
  quickcheck: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  hookRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  hookBubble: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderBottomLeftRadius: Radius.sm / 2,
    padding: Spacing.base,
  },
  interactive: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  choiceList: {
    gap: Spacing.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  reveal: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  tfRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tfButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
  },
  flipWrap: {
    gap: Spacing.sm,
  },
  flipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  flipCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 92,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
});
