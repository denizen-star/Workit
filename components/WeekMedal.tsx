import { medalLabel, placeWord, type WeekPlace } from '@/lib/weekPodium';

const BORDER: Record<WeekPlace, string> = {
  1: '#e8c547',
  2: '#c5c5c5',
  3: '#c08457',
};

const GLOW: Record<WeekPlace, string> = {
  1: 'rgba(232, 197, 71, 0.15)',
  2: 'rgba(197, 197, 197, 0.15)',
  3: 'rgba(192, 132, 87, 0.15)',
};

export default function WeekMedal({
  place,
  size = 'md',
  caption,
}: {
  place: WeekPlace;
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
}) {
  const px = size === 'lg' ? 'h-28 w-28 text-3xl' : size === 'sm' ? 'h-14 w-14 text-base' : 'h-16 w-16 text-lg';

  return (
    <div className="text-center">
      <div
        className={`mx-auto grid ${px} place-items-center rounded-full font-black shadow-lg`}
        style={{ 
          background: `radial-gradient(circle at center, ${GLOW[place]} 0%, transparent 70%), linear-gradient(135deg, #242428 0%, #0a0a0c 100%)`,
          border: `2px solid ${BORDER[place]}`,
          color: BORDER[place],
          textShadow: `0 0 10px ${GLOW[place]}`
        }}
        aria-label={`${medalLabel(place)} · ${placeWord(place)}`}
      >
        {placeWord(place)}
      </div>
      {caption ? (
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">{caption}</p>
      ) : null}
    </div>
  );
}
