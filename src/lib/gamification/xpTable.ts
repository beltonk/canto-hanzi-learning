export type XpAction =
  | 'trace_1star' | 'trace_2star' | 'trace_3star'
  | 'flashcard_card' | 'dictation_correct' | 'decompose_correct'
  | 'game_1star' | 'game_2star' | 'game_3star'
  | 'explore_char' | 'quest_complete';

export const XP_TABLE: Record<XpAction, number> = {
  trace_1star:      5,
  trace_2star:      10,
  trace_3star:      20,
  flashcard_card:   3,
  dictation_correct:8,
  decompose_correct:8,
  game_1star:       5,
  game_2star:       10,
  game_3star:       20,
  explore_char:     2,
  quest_complete:   25,
};

export function xpForAction(action: XpAction): number {
  return XP_TABLE[action] ?? 0;
}
