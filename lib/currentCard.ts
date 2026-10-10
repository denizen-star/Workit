/**
 * Which live exercise card the athlete is on (docs/plans/PLAN_CIRCUITS.md, Step 1).
 * Pure helpers so the card highlight and the circuit round label share one rule.
 */

/** The slice of a live card these helpers read: a key and its set rows. */
export interface CardSets {
  key: string;
  /** Planned sets only (extras beyond the plan never make a card "current"). */
  planned: { is_completed: boolean }[];
}

/** A card is done once every planned set is completed. */
export function cardDone(card: CardSets): boolean {
  return card.planned.length > 0 && card.planned.every((set) => set.is_completed);
}

/** The first card, in program order, that still has a planned set to do. */
export function currentCardKey(cards: CardSets[]): string | null {
  return cards.find((card) => card.planned.length > 0 && !cardDone(card))?.key ?? null;
}

/**
 * Round the athlete is on for a circuit whose cards share a set count: one more than the
 * fewest planned sets any member has finished, capped at the total rounds.
 */
export function circuitRound(members: CardSets[], rounds: number): number {
  if (members.length === 0 || rounds <= 0) return 1;
  const fewestDone = Math.min(...members.map((card) => card.planned.filter((set) => set.is_completed).length));
  return Math.min(fewestDone + 1, rounds);
}
