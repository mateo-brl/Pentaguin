import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { XP } from '@/config/gamification';
import { FontFamily, Radius, Spacing } from '@/theme';
import type {
  AnalysisExercise,
  OrderExercise,
  PracticeExercise,
  ScenarioExercise,
  TerminalExercise,
} from '@/content/practice';
import { addDailyXp, getKv, setKv } from '@/db/repositories';
import { errorFeedback, successFeedback, tapFeedback } from '@/features/haptics/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

import { isCorrectOrder, matchTerminalStep } from './logic';

/** Récompense (une seule fois par exercice) à la réussite. */
function rewardOnce(id: string) {
  const key = `practice_done:${id}`;
  if (getKv(key)) return;
  setKv(key, '1');
  addDailyXp(XP.lessonCompleted);
}

type PlayerProps = {
  exercise: PracticeExercise;
  /** En mission : appelé à la sortie de l'exercice au lieu de router.back(). */
  onComplete?: () => void;
};

export function ExercisePlayer({ exercise, onComplete }: PlayerProps) {
  const leave = onComplete ?? (() => router.back());
  switch (exercise.kind) {
    case 'terminal':
      return <TerminalPlayer ex={exercise} onLeave={leave} />;
    case 'analysis':
      return <AnalysisPlayer ex={exercise} onLeave={leave} />;
    case 'order':
      return <OrderPlayer ex={exercise} onLeave={leave} />;
    case 'scenario':
      return <ScenarioPlayer ex={exercise} onLeave={leave} />;
  }
}

function Brief({ text }: { text: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.brief}>
      {text}
    </ThemedText>
  );
}

/** Mélange stable d'un pool de jetons (index → texte). */
function shuffled(tokens: string[]): string[] {
  const arr = [...tokens];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// — 1) Terminal ------------------------------------------------------------------
function TerminalPlayer({ ex, onLeave }: { ex: TerminalExercise; onLeave: () => void }) {
  const t = useStrings();
  const theme = useTheme();
  const [lines, setLines] = useState<{ text: string; kind: 'cmd' | 'out' | 'err' }[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState('');
  // Mode composer : la commande se construit en tapotant des jetons (indexes du pool).
  const [composed, setComposed] = useState<number[]>([]);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const done = stepIndex >= ex.steps.length;
  const step = ex.steps[stepIndex];

  const pool = useMemo(
    () => (step?.tokens ? shuffled([...step.tokens, ...(step.distractors ?? [])]) : []),
    [step],
  );
  const tokenMode = !keyboardMode && pool.length > 0;
  const command = tokenMode ? composed.map((i) => pool[i]).join(' ') : input;

  const submit = () => {
    if (!command.trim() || done) return;
    const cmd = { text: `${ex.shell} ${command}`, kind: 'cmd' as const };
    if (matchTerminalStep(command, step)) {
      successFeedback();
      setLines((l) => [...l, cmd, { text: step.output, kind: 'out' }]);
      const next = stepIndex + 1;
      setStepIndex(next);
      setShowHint(false);
      setComposed([]);
      if (next >= ex.steps.length) rewardOnce(ex.id);
    } else {
      errorFeedback();
      setLines((l) => [...l, cmd, { text: t.practice.unknownCommand, kind: 'err' }]);
    }
    setInput('');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Brief text={ex.brief} />
      {!done && <ThemedText type="smallBold" style={styles.instruction}>{step.instruction}</ThemedText>}

      <View style={[styles.terminal, { backgroundColor: theme.backgroundTerminal }]}>
        {lines.map((l, i) => (
          <ThemedText
            key={i}
            style={[
              styles.termText,
              { color: l.kind === 'err' ? theme.danger : l.kind === 'out' ? theme.success : theme.text },
            ]}>
            {l.text}
          </ThemedText>
        ))}
        {!done && tokenMode && (
          <View style={styles.termComposeRow}>
            <ThemedText style={[styles.termText, { color: theme.accent }]}>{ex.shell} </ThemedText>
            {composed.length === 0 ? (
              <ThemedText style={[styles.termText, { color: theme.textDisabled }]}>
                {t.practice.composeHint}
              </ThemedText>
            ) : (
              composed.map((poolIndex) => (
                <Pressable
                  key={poolIndex}
                  onPress={() => {
                    tapFeedback();
                    setComposed((c) => c.filter((i) => i !== poolIndex));
                  }}
                  style={[styles.composedToken, { borderColor: theme.border }]}>
                  <ThemedText style={[styles.termText, { color: theme.text }]}>
                    {pool[poolIndex]}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </View>
        )}
        {!done && !tokenMode && (
          <View style={styles.termInputRow}>
            <ThemedText style={[styles.termText, { color: theme.accent }]}>{ex.shell} </ThemedText>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submit}
              placeholder={t.practice.typeCommand}
              placeholderTextColor={theme.textDisabled}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.termText, styles.termInput, { color: theme.text }]}
              returnKeyType="send"
            />
          </View>
        )}
      </View>

      {/* Pool de jetons à tapoter */}
      {!done && tokenMode && (
        <View style={styles.tokenPool}>
          {pool.map((token, poolIndex) =>
            composed.includes(poolIndex) ? null : (
              <Pressable
                key={poolIndex}
                onPress={() => {
                  tapFeedback();
                  setComposed((c) => [...c, poolIndex]);
                }}
                style={[
                  styles.poolToken,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText style={[styles.termText, { color: theme.text }]}>{token}</ThemedText>
              </Pressable>
            ),
          )}
        </View>
      )}

      {done ? (
        <>
          <View style={[styles.successBox, { backgroundColor: theme.successSoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            <ThemedText type="small" style={styles.successText}>{ex.success}</ThemedText>
          </View>
          <Button label={t.practice.finish} onPress={onLeave} />
        </>
      ) : (
        <>
          <Button label={t.practice.validate} onPress={submit} disabled={!command.trim()} />
          {step.hint && (
            <Button
              label={showHint ? `${t.practice.hint} : ${step.hint}` : t.practice.hint}
              variant="ghost"
              onPress={() => setShowHint(true)}
            />
          )}
          {pool.length > 0 && (
            <Button
              label={keyboardMode ? t.practice.switchTokens : t.practice.switchKeyboard}
              variant="ghost"
              onPress={() => {
                setKeyboardMode((mode) => !mode);
                setComposed([]);
                setInput('');
              }}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

// — 2) Analyse -------------------------------------------------------------------
function AnalysisPlayer({ ex, onLeave }: { ex: AnalysisExercise; onLeave: () => void }) {
  const t = useStrings();
  const theme = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const correct = validated && selected === ex.correctLine;

  const validate = () => {
    if (selected == null) return;
    setValidated(true);
    if (selected === ex.correctLine) {
      successFeedback();
      rewardOnce(ex.id);
    } else errorFeedback();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Brief text={ex.brief} />
      <ThemedText type="smallBold">{ex.question}</ThemedText>
      <View style={styles.artifact}>
        {ex.lines.map((line, i) => {
          const isSel = selected === i;
          const isAnswer = validated && i === ex.correctLine;
          const isWrong = validated && isSel && i !== ex.correctLine;
          return (
            <Pressable
              key={i}
              disabled={validated}
              onPress={() => {
                tapFeedback();
                setSelected(i);
              }}
              style={[
                styles.artifactLine,
                isSel && { backgroundColor: theme.backgroundSelected },
                isAnswer && { backgroundColor: theme.successSoft },
                isWrong && { backgroundColor: theme.dangerSoft },
              ]}>
              <ThemedText style={[styles.termText, { color: theme.text }]}>{line}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {validated ? (
        <>
          <View
            style={[
              styles.feedback,
              { backgroundColor: correct ? theme.successSoft : theme.dangerSoft },
            ]}>
            <ThemedText type="label" style={{ color: correct ? theme.success : theme.danger }}>
              {correct ? t.practice.correct : t.practice.incorrect}
            </ThemedText>
            <ThemedText type="small">{ex.explanation}</ThemedText>
          </View>
          <Button label={t.practice.finish} onPress={onLeave} />
        </>
      ) : (
        <Button label={t.practice.validate} onPress={validate} disabled={selected == null} />
      )}
    </ScrollView>
  );
}

// — 3) Ordonner ------------------------------------------------------------------
function OrderPlayer({ ex, onLeave }: { ex: OrderExercise; onLeave: () => void }) {
  const t = useStrings();
  const theme = useTheme();
  const [seq, setSeq] = useState<string[]>([]);
  const [validated, setValidated] = useState(false);
  const complete = seq.length === ex.items.length;
  const correct = validated && isCorrectOrder(seq, ex.correctOrder);
  const byId = (id: string) => ex.items.find((i) => i.id === id);

  const validate = () => {
    setValidated(true);
    if (isCorrectOrder(seq, ex.correctOrder)) {
      successFeedback();
      rewardOnce(ex.id);
    } else errorFeedback();
  };
  const reset = () => {
    setSeq([]);
    setValidated(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Brief text={ex.brief} />
      <ThemedText type="smallBold">{ex.prompt}</ThemedText>

      {/* Séquence en construction */}
      {seq.length > 0 && (
        <View style={styles.seq}>
          {seq.map((id, i) => (
            <View key={id} style={[styles.seqItem, { borderColor: theme.accent }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>{i + 1}</ThemedText>
              <ThemedText type="small" style={styles.flex}>{byId(id)?.text}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Pool d'items restants */}
      <View style={styles.pool}>
        {ex.items
          .filter((it) => !seq.includes(it.id))
          .map((it) => (
            <Pressable
              key={it.id}
              disabled={validated}
              onPress={() => {
                tapFeedback();
                setSeq((s) => [...s, it.id]);
              }}
              style={[styles.poolItem, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.flex}>{it.text}</ThemedText>
              <Ionicons name="add-circle-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
      </View>

      {validated ? (
        <>
          <View
            style={[
              styles.feedback,
              { backgroundColor: correct ? theme.successSoft : theme.dangerSoft },
            ]}>
            <ThemedText type="label" style={{ color: correct ? theme.success : theme.danger }}>
              {correct ? t.practice.correct : t.practice.incorrect}
            </ThemedText>
            <ThemedText type="small">{ex.explanation}</ThemedText>
          </View>
          {correct ? (
            <Button label={t.practice.finish} onPress={onLeave} />
          ) : (
            <Button label={t.practice.retry} onPress={reset} />
          )}
        </>
      ) : (
        <>
          <Button label={t.practice.validate} onPress={validate} disabled={!complete} />
          {seq.length > 0 && <Button label={t.practice.reset} variant="ghost" onPress={reset} />}
        </>
      )}
    </ScrollView>
  );
}

// — 4) Scénario ------------------------------------------------------------------
function ScenarioPlayer({ ex, onLeave }: { ex: ScenarioExercise; onLeave: () => void }) {
  const t = useStrings();
  const theme = useTheme();
  const [nodeId, setNodeId] = useState(ex.start);
  // Repli si le nœud est introuvable (contenu poussé en contournant la
  // validation) : on retombe sur le départ plutôt que de crasher au rendu.
  const node = ex.nodes[nodeId] ?? ex.nodes[ex.start];
  const terminal = !node || !node.choices || node.choices.length === 0;

  const outcomeColor =
    node.outcome === 'good' ? theme.success : node.outcome === 'bad' ? theme.danger : theme.accent;
  const outcomeLabel =
    node.outcome === 'good'
      ? t.practice.outcomeGood
      : node.outcome === 'bad'
        ? t.practice.outcomeBad
        : t.practice.outcomeNeutral;

  const go = (to: string) => {
    const next = ex.nodes[to];
    if (!next) return; // choix vers un nœud inconnu → on ignore (pas de crash)
    tapFeedback();
    if (!next.choices || next.choices.length === 0) {
      if (next.outcome === 'good') {
        successFeedback();
        rewardOnce(ex.id);
      } else if (next.outcome === 'bad') errorFeedback();
    }
    setNodeId(to);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Brief text={ex.brief} />

      {terminal && node.outcome && (
        <View style={[styles.outcomePill, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons
            name={node.outcome === 'good' ? 'trophy' : node.outcome === 'bad' ? 'close-circle' : 'bulb'}
            size={18}
            color={outcomeColor}
          />
          <ThemedText type="smallBold" style={{ color: outcomeColor }}>{outcomeLabel}</ThemedText>
        </View>
      )}

      <ThemedText style={styles.nodeText}>{node.text}</ThemedText>

      {terminal ? (
        <>
          <Button label={t.practice.restart} variant="secondary" onPress={() => setNodeId(ex.start)} />
          <Button label={t.practice.finish} onPress={onLeave} />
        </>
      ) : (
        node.choices!.map((c, i) => (
          <Button key={i} label={c.text} variant="secondary" onPress={() => go(c.to)} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.base },
  brief: {},
  instruction: { fontSize: 15 },
  flex: { flex: 1 },
  terminal: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.xs,
    minHeight: 160,
  },
  termText: { fontFamily: FontFamily.mono, fontSize: 12.5, lineHeight: 18 },
  termInputRow: { flexDirection: 'row', alignItems: 'center' },
  termInput: { flex: 1, padding: 0 },
  termComposeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  composedToken: {
    borderWidth: 1,
    borderRadius: Radius.sm / 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  tokenPool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  poolToken: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  successBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  successText: { flex: 1 },
  artifact: { borderRadius: Radius.sm, overflow: 'hidden' },
  artifactLine: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  feedback: { borderRadius: Radius.sm, padding: Spacing.base, gap: Spacing.xs },
  seq: { gap: Spacing.sm },
  seqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  pool: { gap: Spacing.sm },
  poolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  nodeText: { fontFamily: FontFamily.medium, lineHeight: 24 },
});
