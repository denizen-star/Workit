'use client';

import {
  Home as HomeIcon,
  TrendingUp,
  Trophy,
  ClipboardList,
  GraduationCap,
  Award,
  UserRound,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import YouPageShell from '@/components/YouPageShell';
import { COACH_TONE_OPTIONS } from '@/lib/coachTone';
import { coachPersonaSrc } from '@/lib/coachPersonas';

type GuideStep = {
  title: string;
  description: string;
  /** Screenshot for this step, served from public/help/. Missing file hides itself (see ImageSlot). */
  image: string;
};

const GETTING_STARTED: GuideStep[] = [
  {
    title: 'Add it to your home screen',
    description:
      'Open Work-It in Safari, tap Share, then Add to Home Screen. It opens full-screen from then on, no browser bar.',
    image: '/help/start-home-screen.png',
  },
  {
    title: 'Log in with email + PIN',
    description:
      'No name picker — enter your email and 4-digit PIN at the login screen. Forgot it? Reset by email from the same page.',
    image: '/help/start-login.png',
  },
  {
    title: 'Start your first workout',
    description:
      "Home shows today's focus. Tap the gold Start WO button — that's the one action that matters right now.",
    image: '/help/start-first-workout.png',
  },
];

const RUNNING_A_WORKOUT: GuideStep[] = [
  {
    title: 'Start your session',
    description:
      "Tap Start WO on Home. Left one open yesterday? It says Resume WO instead, and picks up right where you stopped. Choose Gym or Travel if you're away from your equipment.",
    image: '/help/workout-start.png',
  },
  {
    title: 'Log each set',
    description:
      "Your weight and reps are already filled in from last time — change them if you need to, then tap Complete Set. Timed moves use Stop to record and finish in one tap.",
    image: '/help/workout-log-set.png',
  },
  {
    title: 'Rest, then say how it felt',
    description:
      "A rest timer counts down on its own between sets — skip it early if you're ready. Once you've finished all the sets for a move, give it a quick 1–5 rating, or just move on and it's scored as Fair.",
    image: '/help/workout-rest-rate.png',
  },
  {
    title: 'Add a warmup or cooldown (optional)',
    description:
      'Pick from a run, bike, stretch, core, yoga, or abs circuit before or after your lifts. Entirely optional — it adds credit to your total, but skipping it never holds up your workout.',
    image: '/help/workout-optional.png',
  },
  {
    title: 'Finish it',
    description:
      'Once your last exercise is done, tap Finish it. Rate the whole session 1–5 stars, then see your recap — what you lifted compared to last time, any new records, and any badge or belt you just earned.',
    image: '/help/workout-finish.png',
  },
];

type AppPageGuide = {
  title: string;
  tag: string;
  description: string;
  bullets: string[];
  image: string;
  Icon: LucideIcon;
};

const APP_PAGES: AppPageGuide[] = [
  {
    title: 'Home',
    tag: 'Where you land',
    description:
      "The first thing you see when you open the app. It tells you today's workout and reminds you what you lifted last time you did it — then one big gold button to start.",
    bullets: [
      'A row of dots for the week: green means done, gold means today, gray means not yet',
      "A chart of how much weight you've lifted each day, next to the house average",
      'Tap to open more: your progress, past workouts, badges, and how you stack up',
    ],
    image: '/help/page-home.png',
    Icon: HomeIcon,
  },
  {
    title: 'Your performance',
    tag: 'Am I improving?',
    description:
      'Are you getting stronger? This page answers that in one sentence up top, then breaks it down lift by lift — up, down, holding steady, or your first time logging it.',
    bullets: [
      'Pick a time range: today, yesterday, the last week, two weeks, month, or all time',
      'See how much your weight, reps, and total went up or down per lift',
      'See where you rank against everyone else in your house for that stretch',
    ],
    image: '/help/page-performance.png',
    Icon: TrendingUp,
  },
  {
    title: 'The house',
    tag: 'Where you rank',
    description:
      "See how your whole house is doing — who's lifting the most, where you land next to everyone else, and who's put in extra work like bonus days or cardio.",
    bullets: [
      'Switch between last 7 days, last 30 days, or all time',
      'A table of everyone in your house, with their current belt',
      "A running list of who's earned gold, silver, or bronze each week",
    ],
    image: '/help/page-house.png',
    Icon: Trophy,
  },
  {
    title: 'Completed log',
    tag: 'Your history',
    description:
      "Every workout you've ever finished, organized by week. See the weight, reps, and time for each one — and a checkmark for every week you completed all 4 days.",
    bullets: [
      'Tap a week to see its individual workouts',
      'A quick way to look back at what you did on any past day',
    ],
    image: '/help/page-history.png',
    Icon: ClipboardList,
  },
  {
    title: 'Belts',
    tag: 'Diplomas',
    description:
      "Your diplomas for sticking with it. See which belts you've earned, which one you're working toward, and exactly what it takes to get there.",
    bullets: [
      'Completing weeks is what moves you up a belt',
      'A full list of every belt in the program, in order',
    ],
    image: '/help/page-belts.png',
    Icon: GraduationCap,
  },
  {
    title: 'Medals',
    tag: 'Weekly wins',
    description:
      "Every badge you've earned along the way, plus a record of the weeks you placed gold, silver, or bronze.",
    bullets: [
      'Badges are grouped by what earned them',
      'A history of your weekly placings, most recent first',
    ],
    image: '/help/page-medals.png',
    Icon: Award,
  },
  {
    title: 'Edit profile',
    tag: 'Menu footer',
    description:
      'Make Work-It yours. Pick which coach talks to you, choose which pop-up celebrations you want to see, turn sound on or off, and add extra rest time between sets.',
    bullets: [
      'Choose your coach: Tom, Grey, Luna, or Eli — each has their own style',
      'Turn on or off: new-record pop-ups, better/worse-than-last-time pop-ups, and how-it-felt check-ins',
      'Add extra minutes on top of the standard rest timer',
    ],
    image: '/help/page-profile.png',
    Icon: UserRound,
  },
  {
    title: 'Invite a friend',
    tag: 'Grow the house',
    description:
      "Bring someone new into your house. Enter their email, and we'll send them a link to set their own PIN and get started.",
    bullets: [
      "See who's joined and who still needs to set their PIN",
      "Didn't get the email? Resend the invite without using up a slot",
    ],
    image: '/help/page-invite.png',
    Icon: UserPlus,
  },
];

type MechanicsRow = {
  label: string;
  description: string;
  tone: 'gold' | 'good' | 'bad';
};

const TONE_DOT: Record<MechanicsRow['tone'], string> = {
  gold: 'bg-[#e8c547]',
  good: 'bg-[#6d8b6e]',
  bad: 'bg-[#a35d52]',
};

const MECHANICS: MechanicsRow[] = [
  {
    label: 'Logging a set',
    description: 'Enter weight and reps, tap Complete Set. Timed lifts use Stop to record and complete in one tap.',
    tone: 'gold',
  },
  {
    label: 'Gym vs. Travel',
    description:
      'No equipment? Flip a day — or a single exercise — to Travel mode for a bodyweight swap. Locks once you log a set.',
    tone: 'gold',
  },
  {
    label: 'Week lock',
    description: "Finish any 4 sessions in a week and it locks — green check, done. Doesn't have to be 4 in a row.",
    tone: 'good',
  },
  {
    label: 'Miss the week',
    description:
      "Finish fewer than 4 days and don't place on the board, and it counts as a missed week — you'll see it called out next time you open Home.",
    tone: 'bad',
  },
  {
    label: 'Bonus & optionals',
    description:
      "Extra workouts and warmup/cooldown add-ons are there for more credit if you want it — skipping them never stops your week from locking.",
    tone: 'gold',
  },
];

const COACH_MOMENTS: string[] = [
  'A welcome pop-up every time you start or resume a session',
  "New records, and doing better or worse than last time you ran a lift (turn these on or off in Edit profile's Noise Control)",
  'The finish screen, and any belt or badge you earn that session',
  "Emails — your welcome message, workout recaps, and a nudge if you haven't trained in a few days",
];

type GlossaryTerm = { term: string; tag: string; definition: string };

const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'History',
    tag: 'this set, before',
    definition:
      "What you usually do on this exact set — same lift, same set number — averaged across every time you've done it before.",
  },
  {
    term: 'Avg Effective',
    tag: 'weighted for effort',
    definition: 'Like History, but it also weighs in how hard those past sets actually felt — not just the weight and reps.',
  },
  {
    term: 'Best',
    tag: 'your record',
    definition:
      "The heaviest set you've ever logged for this exercise, period. Beat it today and it updates instantly with a New PR tag.",
  },
  {
    term: 'Volume',
    tag: 'today',
    definition:
      "How much work you've put into this exercise so far today — your average weight times reps across the sets you've completed.",
  },
  {
    term: 'Effort',
    tag: '1–5',
    definition:
      "Your own rating of how hard a set felt: Easy, Light, Fair, Hard, or Max. Don't rate it, and it's counted as Fair by default.",
  },
  {
    term: 'Noise Control',
    tag: 'Edit profile',
    definition:
      'Three separate on/off switches for the pop-up celebrations — new records, doing better or worse than last time, and effort check-ins. Turn on only the ones you want to see.',
  },
];

const SUMMARY: { id: string; title: string; description: string }[] = [
  { id: 'start', title: 'Getting Started', description: 'Add the app to your phone, log in, and fire off your first workout.' },
  { id: 'workout', title: 'Running a Workout', description: 'What actually happens during a session, from Start WO to Finish it.' },
  {
    id: 'coach',
    title: 'Your Coach',
    description: 'Who talks to you during a workout, what they celebrate, and how to pick your voice.',
  },
  {
    id: 'pages',
    title: 'App Pages',
    description:
      'A quick tour of every screen — Home, Your performance, The house, Completed log, Belts, Medals, Edit profile, Invite a friend.',
  },
  {
    id: 'mechanics',
    title: 'Training Mechanics',
    description: 'The rules of the program: logging sets, Gym vs Travel, week lock, bonus & optionals.',
  },
  { id: 'program', title: 'Program & Belts', description: 'The shape of the 48-week program, and what each belt means.' },
  { id: 'glossary', title: 'Glossary', description: 'Plain-English definitions for the stats and labels you’ll see while training.' },
];

/** Screenshot with the same hide-on-404 fallback /how already uses — page reads fine before images are captured. */
function ImageSlot({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mt-4 w-3/4 mx-auto rounded-xl border border-white/10 object-cover"
      onError={(event) => {
        (event.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Numbered step list, shared by Getting Started and Running a Workout. */
function StepList({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">
              {index + 1}
            </span>
            <div>
              <h4 className="text-lg font-black text-white">{step.title}</h4>
              <p className="mt-1 text-sm text-[#f6f1e3]/80">{step.description}</p>
            </div>
          </div>
          <ImageSlot src={step.image} alt={step.title} />
        </li>
      ))}
    </ol>
  );
}

export default function HelpPage() {
  return (
    <YouPageShell title="Help">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
        Everything you need to run the program.
      </h2>
      <p className="mt-3 max-w-prose text-[#f6f1e3]/80">
        How to get started, what each screen shows you, how the training rules work, and what those numbers on your
        stats mean.
      </p>
      <a href="/faq" className="mt-3 inline-block text-sm font-bold text-[#e8c547]">
        Why Work-It &rarr;
      </a>

      {/* Summary: an index of every section below, so you can jump straight to what you need. */}
      <section className="mt-8">
        <h3 className="text-lg font-black text-white">Summary</h3>
        <div className="mt-3 glass-card divide-y divide-white/10">
          {SUMMARY.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/5"
            >
              <div>
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 text-sm text-[#f6f1e3]/60">{item.description}</p>
              </div>
              <span className="shrink-0 text-lg text-[#e8c547]">&rarr;</span>
            </a>
          ))}
        </div>
      </section>

      <section id="start" className="mt-12">
        <h3 className="text-lg font-black text-white">Getting Started</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">First 5 minutes</p>
        <div className="mt-4">
          <StepList steps={GETTING_STARTED} />
        </div>
      </section>

      <section id="workout" className="mt-12">
        <h3 className="text-lg font-black text-white">Running a Workout</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">Start to finish</p>
        <div className="mt-4">
          <StepList steps={RUNNING_A_WORKOUT} />
        </div>
      </section>

      <section id="coach" className="mt-12">
        <h3 className="text-lg font-black text-white">Your Coach</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">Motivation, in a voice you pick</p>
        <p className="mt-3 text-sm leading-relaxed text-[#f6f1e3]/80">
          Every workout has someone in your corner. Your coach isn&apos;t another stat on the screen — they talk to
          you: welcoming you back, calling out a new record, and marking the day you earn a belt. Pick the voice
          that gets you moving in Edit profile, any time.
        </p>
        <div className="glass-card mt-4 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">Where you&apos;ll hear from them</p>
          <ul className="mt-3 space-y-2">
            {COACH_MOMENTS.map((moment) => (
              <li key={moment} className="flex gap-2 text-sm text-[#f6f1e3]/70">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#e8c547]" />
                {moment}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {COACH_TONE_OPTIONS.map((coach) => (
            <div key={coach.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              {/* Same portrait set the in-app coach bubble and emails use (public/personas/). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coachPersonaSrc(coach.id, 'welcome')}
                alt={coach.label}
                className="h-14 w-14 shrink-0 rounded-full border-2 border-[#e8c547]/35 object-cover"
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#e8c547]">Coach</p>
                <p className="mt-1 font-black text-white">{coach.label}</p>
                <p className="mt-1.5 text-sm text-[#f6f1e3]/60">{coach.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pages" className="mt-12">
        <h3 className="text-lg font-black text-white">App Pages</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">Menu, top to bottom</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {APP_PAGES.map(({ title, tag, description, bullets, image, Icon }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8c547]/15">
                  <Icon className="h-[18px] w-[18px] text-[#e8c547]" />
                </div>
                <div>
                  <h4 className="font-black text-white">{title}</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#c08457]">{tag}</p>
                </div>
              </div>
              <p className="text-sm text-[#f6f1e3]/80">{description}</p>
              <ul className="space-y-1.5">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm text-[#f6f1e3]/60">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#e8c547]" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <ImageSlot src={image} alt={title} />
            </div>
          ))}
        </div>
      </section>

      <section id="mechanics" className="mt-12">
        <h3 className="text-lg font-black text-white">Training Mechanics</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">How the week works</p>
        <div className="mt-4 space-y-2.5">
          {MECHANICS.map(({ label, description, tone }) => (
            <div key={label} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
              <div>
                <p className="font-black text-white">{label}</p>
                <p className="mt-0.5 text-sm text-[#f6f1e3]/60">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="program" className="mt-12">
        <h3 className="text-lg font-black text-white">Program &amp; Belts</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">48 weeks</p>
        <div className="glass-card mt-4 p-5">
          <p className="text-sm leading-relaxed text-[#f6f1e3]/80">
            Weeks 1–6 run a 4-day upper/lower saddle. Week 7 on, it&apos;s one lower day, Extra Upper, and a bonus
            core or class. Belts mark the miles — earn one, aim at the next. See the full list on the{' '}
            <span className="font-black text-[#e8c547]">Belts</span> page.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#f6f1e3]/80">
            Training fewer or more days a week? Set your own pace (1 to 5 days) in{' '}
            <span className="font-black text-[#e8c547]">Edit profile</span> — 2 and 3 day plans swap the split for
            full-body days so nothing gets skipped. A week you&apos;ve already locked stays locked even if you
            change your pace later.
          </p>
        </div>
      </section>

      <section id="glossary" className="mt-12 pb-4">
        <h3 className="text-lg font-black text-white">Glossary</h3>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">Reading your stats</p>
        <p className="mt-3 text-sm text-[#f6f1e3]/70">
          You&apos;ll see these words on your set cards and stat pages while you train. Here&apos;s what each one
          actually means.
        </p>
        <div className="glass-card mt-4 divide-y divide-white/10">
          {GLOSSARY.map(({ term, tag, definition }) => (
            <div key={term} className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
              <div>
                <p className="font-black text-white">{term}</p>
                <p className="text-[11px] font-black text-[#e8c547]">{tag}</p>
              </div>
              <p className="text-sm text-[#f6f1e3]/70">{definition}</p>
            </div>
          ))}
        </div>
      </section>
    </YouPageShell>
  );
}
