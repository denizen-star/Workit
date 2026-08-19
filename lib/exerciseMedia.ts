export interface ExerciseMedia {
  images: string[];
  videoId: string;
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const gym = {
  bench: [
    unsplash("photo-1549060279-7e168fcee0c2"),
    unsplash("photo-1571019614242-c5c5dee9f50b"),
    unsplash("photo-1517838277536-f5f99be501cd"),
  ],
  dumbbell: [
    unsplash("photo-1583454110551-21f2fa2afe61"),
    unsplash("photo-1581009146145-b5ef050c2e1e"),
    unsplash("photo-1576678927484-cc907957088c"),
  ],
  squat: [
    unsplash("photo-1434682881343-57358bfd7d92"),
    unsplash("photo-1534438327276-14e5300c3a48"),
    unsplash("photo-1517960413843-0aee8e2b3285"),
  ],
  deadlift: [
    unsplash("photo-1517836357463-d25dfeac3438"),
    unsplash("photo-1517963879433-6ad2b056d712"),
    unsplash("photo-1605296867304-46d5465a13f1"),
  ],
  pull: [
    unsplash("photo-1599058917765-a78070457def"),
    unsplash("photo-1534438327276-14e5300c3a48"),
    unsplash("photo-1571019613454-1cb2f99b2d8b"),
  ],
  core: [
    unsplash("photo-1571019613454-1cb2f99b2d8b"),
    unsplash("photo-1518310383802-640c2de311b2"),
    unsplash("photo-1518611012118-696072aa579a"),
  ],
  hotel: [
    unsplash("photo-1576678927484-cc907957088c"),
    unsplash("photo-1599058945522-28d584b6d14e"),
    unsplash("photo-1571019614242-c5c5dee9f50b"),
  ],
};

const MEDIA: Record<string, ExerciseMedia> = {
  "barbell or dumbbell bench press": { images: gym.bench, videoId: "rT7DgCr-3pg" },
  "dumbbell bench press": { images: gym.bench, videoId: "VmB1G1K7v94" },
  "single-arm dumbbell rows": { images: gym.pull, videoId: "pYcpY20QaE8" },
  "standing single-arm db rows": { images: gym.hotel, videoId: "pYcpY20QaE8" },
  "overhead dumbbell shoulder press": { images: gym.dumbbell, videoId: "qEwKCR5JCog" },
  "standing db shoulder press": { images: gym.hotel, videoId: "qEwKCR5JCog" },
  "lat pulldowns or cable rows": { images: gym.pull, videoId: "CAwf7n6Luuc" },
  "triceps cable pushdowns or overhead extensions": { images: gym.dumbbell, videoId: "2-LAMcpzODU" },
  "plank hold": { images: gym.core, videoId: "ASdvN_XEl_c" },
  plank: { images: gym.core, videoId: "ASdvN_XEl_c" },
  "barbell back squats or goblet squats": { images: gym.squat, videoId: "ultWZbUMPL8" },
  "db goblet squats": { images: gym.hotel, videoId: "MeiiS8eQc7o" },
  "romanian deadlifts (rdls)": { images: gym.deadlift, videoId: "hTgJ2xteG5I" },
  "db romanian deadlifts": { images: gym.hotel, videoId: "hTgJ2xteG5I" },
  "walking lunges": { images: gym.squat, videoId: "L8fvypGrW7g" },
  "db reverse lunges": { images: gym.hotel, videoId: "9gvn_yYqKHs" },
  "leg curl machine or swiss ball hamstring curls": { images: gym.deadlift, videoId: "1Tq3QdYUuHs" },
  "standing calf raises": { images: gym.squat, videoId: "gwLzF8HAguU" },
  "bodyweight calf raises": { images: gym.hotel, videoId: "gwLzF8HAguU" },
  "pallof press": { images: gym.core, videoId: "Ah_uSj34cjs" },
  "incline dumbbell bench press": { images: gym.bench, videoId: "8iPEnn-ltC8" },
  "db incline press": { images: gym.hotel, videoId: "8iPEnn-ltC8" },
  "barbell or chest-supported rows": { images: gym.pull, videoId: "kBWAon7ItDw" },
  "db chest-supported or bent-over rows": { images: gym.hotel, videoId: "kBWAon7ItDw" },
  "dumbbell lateral raises": { images: gym.dumbbell, videoId: "3VcKaXpzqRo" },
  "db lateral raises": { images: gym.hotel, videoId: "3VcKaXpzqRo" },
  "face pulls": { images: gym.pull, videoId: "0Po47sVQ6QM" },
  "dumbbell biceps curls": { images: gym.dumbbell, videoId: "ykJmrZ5v0Oo" },
  "db biceps curls": { images: gym.hotel, videoId: "ykJmrZ5v0Oo" },
  "hanging knee raises or ab wheel rollouts": { images: gym.core, videoId: "DweF92d5QHc" },
  "trap bar deadlifts or barbell conventional deadlifts": { images: gym.deadlift, videoId: "vl5-f0N5R3o" },
  "bulgarian split squats": { images: gym.squat, videoId: "2C-uNgKwPLE" },
  "db bulgarian split squats": { images: gym.hotel, videoId: "2C-uNgKwPLE" },
  "barbell hip thrusts or glute bridges": { images: gym.squat, videoId: "xP1e1xNz-8s" },
  "glute bridges with db on hips": { images: gym.hotel, videoId: "wPM8icPu6H8" },
  "leg extension machine or goblet step-ups": { images: gym.squat, videoId: "YyvSfViT6H0" },
  "farmer's carries": { images: gym.deadlift, videoId: "fkA-eYYvU5E" },
  "db farmer's carry": { images: gym.hotel, videoId: "fkA-eYYvU5E" },
  "push-ups": { images: gym.hotel, videoId: "IODxDxX7oi4" },
  "db triceps extensions": { images: gym.hotel, videoId: "ir5PsbniVSc" },
  "db single-leg rdls": { images: gym.hotel, videoId: "2iP-TfS1tXo" },
};

const DEFAULT_MEDIA: ExerciseMedia = {
  images: gym.dumbbell,
  videoId: "IODxDxX7oi4",
};

export function getExerciseMedia(name: string): ExerciseMedia {
  const key = name.toLowerCase().trim();
  if (MEDIA[key]) return MEDIA[key];

  const match = Object.keys(MEDIA).find((entry) => key.includes(entry) || entry.includes(key));
  return match ? MEDIA[match] : DEFAULT_MEDIA;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeThumbUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
