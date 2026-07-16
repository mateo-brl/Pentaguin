// TODO(M8) : remplacer les emojis par la mascotte dessinée (humeurs illustrées).
export function mascotEmoji(currentStreak: number, activeToday: boolean): string {
  if (currentStreak >= 7) return '🐧🔥';
  if (currentStreak >= 3) return '🐧😎';
  if (currentStreak >= 1) return activeToday ? '🐧🙂' : '🐧👀';
  return '🐧💤';
}
