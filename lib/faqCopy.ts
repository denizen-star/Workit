export type FaqEntry = {
  question: string;
  answer: string;
};

export const FAQ_TITLE = 'Why Work-It';

export const FAQ_LEAD =
  "Straight answers to what makes Work-It different — no sales pitch, just what's actually built in.";

/** Shared between the public /faq page and anywhere else that wants the same Q&A list. */
export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'Do I have to type in my weight and reps every single set?',
    answer:
      "No. Your last set's weight and reps are already filled in before you touch anything, and every set after that copies forward the moment you complete the one before it. Most sets are a single tap: Complete Set.",
  },
  {
    question: 'Will my workout bounce me around the gym, chasing equipment?',
    answer:
      "No supersets, no jumping between machines on opposite ends of the floor. Every workout is one exercise at a time, straight sets, in order — so you're never fighting for two pieces of equipment at once.",
  },
  {
    question: "What if I don't have my usual equipment?",
    answer:
      "Every lift has a Gym and Travel version built in. Tap the pill on the card and it swaps to the travel-friendly version without losing your place in the workout.",
  },
  {
    question: 'Is this another app trying to track my calories and guilt me into a diet?',
    answer:
      "No calorie counting, no weight-loss messaging, no social feed. Work-It tracks one thing: the weight you lifted and how hard it felt. That's it.",
  },
  {
    question: "What's the catch — is this going to hit me with a paywall later?",
    answer: "There isn't one. Logging your sets, your history, your stats — none of it sits behind a subscription.",
  },
  {
    question: 'Are the time estimates realistic, or do they assume everything happens instantly?',
    answer:
      'The Est. time on each day is built from your actual sets and the rest between them — not a flat guess — so it tracks what a real session takes.',
  },
  {
    question: 'Does it tell me which plates to load on the bar?',
    answer:
      "Work-It keeps logging simple: you enter the number you're lifting and move on — no separate math screen standing between you and your next set.",
  },
  {
    question: 'Does it build me a warm-up automatically?',
    answer:
      'Every session has an optional warm-up and cooldown built in — a quick run, bike, stretch, core, yoga, or abs circuit before or after your lifts. Skip it or use it; either way it never holds up your workout.',
  },
  {
    question: 'How do I know if I should be lifting more?',
    answer:
      "Every set shows exactly what you did last time next to what you're doing now — weight, reps, and how it felt — plus your all-time best for that lift, so the call to push is always right in front of you.",
  },
];
