export type QuickstartStep = {
  title: string;
  body: string;
};

export const QUICKSTART_TITLE = "Three things. That's it.";

export const QUICKSTART_LEAD = 'No manual required. Start it, move through it, finish it.';

/** Shared between the standalone /quickstart page and the first-login QuickstartTakeover. */
export const QUICKSTART_STEPS: QuickstartStep[] = [
  {
    title: 'Start it',
    body: "Open Home. Tap the gold Start WO button. That's the workout the plan already picked for today — no deciding, just go.",
  },
  {
    title: 'Move through it',
    body: 'Log the weight and reps for each set, then tap Complete Set. Rest when the timer says rest. Repeat until every exercise is done.',
  },
  {
    title: "You're done",
    body: "Tap Finish it and rate the session. Hit your weekly number of finishes (4 by default, any mix — plan days, swaps, Your picks) and the week locks. That's the whole game.",
  },
];
