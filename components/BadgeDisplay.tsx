'use client';

import { Award } from 'lucide-react';

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
}

export default function BadgeDisplay({ allBadges, earnedBadges }: BadgeDisplayProps) {
  const earnedIds = new Set(earnedBadges.map((badge) => badge.id));

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-6 w-6 text-[#e8c547]" />
        <h2 className="text-2xl font-black text-white">Achievements</h2>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">
          {earnedBadges.length} / {allBadges.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
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
                <div className="mb-2 text-4xl">{badge.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-white">{badge.name}</h3>
                <p className="text-xs text-[#f6f1e3]/65">{badge.description}</p>

                {isEarned && earnedBadge?.earned_at && (
                  <p className="mt-2 text-xs text-[#e8c547]">
                    Earned {new Date(earnedBadge.earned_at).toLocaleDateString()}
                  </p>
                )}

                {!isEarned && (
                  <p className="mt-2 text-xs text-[#f6f1e3]/50">
                    {badge.requirement_type === 'weight_milestone' && `Lift ${badge.requirement_value} lbs`}
                    {badge.requirement_type === 'streak' && `${badge.requirement_value} week streak`}
                    {badge.requirement_type === 'total_workouts' && `${badge.requirement_value} workouts`}
                    {badge.requirement_type === 'week_complete' && 'Complete a week'}
                    {badge.requirement_type === 'first_workout' && 'Complete first workout'}
                    {badge.requirement_type === 'program_complete' && 'Finish 6 weeks'}
                    {badge.requirement_type === 'perfect_week' && 'Perfect week'}
                  </p>
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
    </div>
  );
}
