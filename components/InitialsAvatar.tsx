interface InitialsAvatarProps {
  /** The name to take the initial from — pass an alias-aware call name, not always the raw account name. */
  name: string;
  className?: string;
}

/** Avatar fallback for a user with no uploaded photo: a circle with their initial. */
export default function InitialsAvatar({ name, className = 'h-10 w-10 text-sm' }: InitialsAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 font-black text-[#e8c547] ${className}`}
    >
      {initial}
    </div>
  );
}
