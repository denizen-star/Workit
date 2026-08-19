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
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Achievements</h2>
        <span className="ml-auto text-sm text-gray-600">
          {earnedBadges.length} / {allBadges.length}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {allBadges.map(badge => {
          const isEarned = earnedIds.has(badge.id);
          const earnedBadge = earnedBadges.find(b => b.id === badge.id);

          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isEarned
                  ? 'border-yellow-400 bg-yellow-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                <p className="text-xs text-gray-600">{badge.description}</p>
                
                {isEarned && earnedBadge?.earned_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Earned {new Date(earnedBadge.earned_at).toLocaleDateString()}
                  </p>
                )}

                {!isEarned && (
                  <p className="text-xs text-gray-500 mt-2">
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
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1">
                  <Award className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
