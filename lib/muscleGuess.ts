/** Coarse muscle bucket for Hard sets / muscle. Names only — no new tables. */
export function muscleGuess(name: string) {
  const n = name.toLowerCase();
  if (/bench|press|fly|pec|push.?up|dip/.test(n) && !/shoulder|ohp|military|leg/.test(n)) return 'Chest';
  if (/row|pulldown|pull.?up|lat|face pull/.test(n)) return 'Back';
  if (/shoulder|ohp|military|lateral|rear delt/.test(n)) return 'Shoulders';
  if (/curl|tricep|pushdown|skull|bicep/.test(n)) return 'Arms';
  if (/squat|leg press|lunge|quad|hack|step.?up|leg extension/.test(n)) return 'Quads';
  if (/rdl|deadlift|hamstring|good morning|glide|slide/.test(n)) return 'Hamstrings';
  if (/hip thrust|glute|bridge|kickback/.test(n)) return 'Glutes';
  if (/calf/.test(n)) return 'Calves';
  if (/crunch|core|ab|hanging|knee/.test(n)) return 'Core';
  return 'Other';
}
