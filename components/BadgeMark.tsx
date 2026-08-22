import { badgeArtSrc } from '@/lib/badgeArt';

interface BadgeMarkProps {
  name: string;
  className?: string;
}

export default function BadgeMark({ name, className = 'h-16 w-16' }: BadgeMarkProps) {
  return (
    <img
      src={badgeArtSrc(name)}
      alt=""
      className={`mx-auto ${className}`}
    />
  );
}
