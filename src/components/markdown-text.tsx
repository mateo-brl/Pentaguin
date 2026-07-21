import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/theme';

/**
 * Rendu du sous-ensemble markdown autorisé dans le contenu (docs/AUTHORING.md) :
 * paragraphes, listes -/1., **gras**, *italique*, `code`. Volontairement
 * minimal pour éviter une dépendance markdown lourde.
 */
export function MarkdownText({ md }: { md: string }) {
  const blocks = md.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <MarkdownBlock key={index} block={block} />
      ))}
    </View>
  );
}

function MarkdownBlock({ block }: { block: string }) {
  const lines = block.split('\n');
  const isBullet = lines.every((line) => /^[-*] /.test(line));
  const isNumbered = lines.every((line) => /^\d+\. /.test(line));

  if (isBullet || isNumbered) {
    return (
      <View style={styles.list}>
        {lines.map((line, index) => {
          const marker = isBullet ? '•' : `${line.match(/^(\d+)\./)?.[1]}.`;
          const content = line.replace(/^([-*]|\d+\.) /, '');
          return (
            <View key={index} style={styles.listItem}>
              <ThemedText themeColor="textSecondary" style={styles.marker}>
                {marker}
              </ThemedText>
              <ThemedText style={styles.listText}>{renderInline(content)}</ThemedText>
            </View>
          );
        })}
      </View>
    );
  }

  return <ThemedText>{renderInline(lines.join(' '))}</ThemedText>;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <ThemedText key={index} style={styles.bold}>
          {part.slice(2, -2)}
        </ThemedText>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <ThemedText key={index} type="code">
          {part.slice(1, -1)}
        </ThemedText>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <ThemedText key={index} style={styles.italic}>
          {part.slice(1, -1)}
        </ThemedText>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  list: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  marker: {
    minWidth: Spacing.base,
    textAlign: 'right',
  },
  listText: {
    flex: 1,
  },
  bold: {
    fontFamily: FontFamily.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
});
