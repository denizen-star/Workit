'use client';

import { useState } from 'react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import BadgeMark from '@/components/BadgeMark';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  earned_at?: string;
}

interface BadgeDisplayProps {
  allBadges: Badge[];
  earnedBadges: Badge[];
  bonusCount?: number;
  optionalWeekCount?: number;
  optionalCount?: number;
}

function requirementLabel(badge: Badge) {
  switch (badge.requirement_type) {
    case 'weight_milestone':
      return `Lift ${badge.requirement_value.toLocaleString()} lbs`;
    case 'streak':
      return `${badge.requirement_value} week streak`;
    case 'total_workouts':
      return `${badge.requirement_value} workouts`;
    case 'week_complete':
      return 'Complete a week';
    case 'first_workout':
      return 'Complete first workout';
    case 'program_complete':
      return 'Finish 6 weeks';
    case 'perfect_week':
      return 'Perfect week';
    case 'travel_week':
      return 'Finish 4 travel sessions';
    case 'upper_sessions':
      return `${badge.requirement_value} Upper sessions`;
    case 'lower_sessions':
      return `${badge.requirement_value} Lower sessions`;
    case 'session_volume':
      return `${badge.requirement_value.toLocaleString()} lb session`;
    case 'fast_session':
      return `Finish under ${badge.requirement_value} min`;
    case 'long_session':
      return `Train over ${badge.requirement_value} min`;
    case 'early_bird':
      return 'Start before 8am';
    case 'night_owl':
      return 'Start at or after 8pm';
    case 'bonus_sessions':
      return 'Finish a bonus day';
    case 'optional_weeks':
      return 'Finish 4 warmups and 4 cooldowns in a week';
    case 'optionals':
      return 'Finish an optional warmup or cooldown';
    default:
      return '';
  }
}

export default function BadgeDisplay({
  allBadges,
  earnedBadges,
  bonusCount = 0,
  optionalWeekCount = 0,
  optionalCount = 0,
  standalone = false,
}: BadgeDisplayProps & { standalone?: boolean }) {
  const [open, setOpen] = useState(standalone);
  const earnedIds = new Set(earnedBadges.map((badge) => badge.id));

  return (
    <div className="glass-card p-6">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Award className="h-6 w-6 text-[#e8c547]" />
        <h2 className="text-2xl font-black text-white">Achievements</h2>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">
          {earnedBadges.length} / {allBadges.length}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
        )}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {allBadges.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            const earnedBadge = earnedBadges.find((item) => item.id === badge.id);

            return (
              <div
                key={badge.id}
                className={`relative rounded-2xl border p-4 transition-all ${
                  isEarned
                    ? 'border-[#e8c547]/60 bg-[#e8c547]/10'
                    : 'border-white/10 bg-black/20 opacity-55'
                }`}
              >
                <div className="text-center">
                  <div className="mb-2">
                    <BadgeMark name={badge.name} className="h-16 w-16" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-white">{badge.name}</h3>
                  <p className="text-xs text-[#f6f1e3]/65">{badge.description}</p>

                  {isEarned && badge.requirement_type === 'bonus_sessions' ? (
                    <p className="mt-2 text-xs text-[#e8c547]">
                      {bonusCount} bonus {bonusCount === 1 ? 'day' : 'days'}
                    </p>
                  ) : isEarned && badge.requirement_type === 'optional_weeks' ? (
                    <p className="mt-2 text-xs text-[#e8c547]">
                      {optionalWeekCount} optional {optionalWeekCount === 1 ? 'week' : 'weeks'}
                    </p>
                  ) : isEarned && badge.requirement_type === 'optionals' ? (
                    <p className="mt-2 text-xs text-[#e8c547]">
                      {optionalCount} optional {optionalCount === 1 ? 'slot' : 'slots'}
                    </p>
                  ) : isEarned && earnedBadge?.earned_at ? (
                    <p className="mt-2 text-xs text-[#e8c547]">
                      Earned {new Date(earnedBadge.earned_at).toLocaleDateString()}
                    </p>
                  ) : null}

                  {!isEarned && (
                    <p className="mt-2 text-xs text-[#f6f1e3]/50">{requirementLabel(badge)}</p>
                  )}
                </div>

                {isEarned && (
                  <div className="absolute -right-2 -top-2 rounded-full bg-[#e8c547] p-1 text-[#1a1404]">
                    <Award className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
