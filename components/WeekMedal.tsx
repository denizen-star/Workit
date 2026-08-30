import { medalLabel, placeWord, type WeekPlace } from '@/lib/weekPodium';

const FILL: Record<WeekPlace, string> = {
  1: 'radial-gradient(circle at 30% 25%, #f6e27a, #e8c547 62%, #b8942a)',
  2: 'radial-gradient(circle at 30% 25%, #f2f2f2, #c5c5c5 62%, #8d8d8d)',
  3: 'radial-gradient(circle at 30% 25%, #e2b48a, #c08457 62%, #8a5a38)',
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
        className={`mx-auto grid ${px} place-items-center rounded-full font-black text-[#1a1404] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]`}
        style={{ background: FILL[place] }}
        aria-label={`${medalLabel(place)} · ${placeWord(place)}`}
      >
        {placeWord(place)}
      </div>
      {caption ? (
        <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">{caption}</p>
      ) : null}
    </div>
  );
}
