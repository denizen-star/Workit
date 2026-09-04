export interface ExerciseVideo {
  id: string;
  label: string;
}

export interface ExerciseMedia {
  images: string[];
  videoId: string;
  videos?: ExerciseVideo[];
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
  "romanian deadlifts (rdls)": { images: gym.deadlift, videoId: "5rIqP63yWFg" },
  "db romanian deadlifts": { images: gym.hotel, videoId: "5rIqP63yWFg" },
  "walking lunges": { images: gym.squat, videoId: "HIM0GrawvAU" },
  "db reverse lunges": { images: gym.hotel, videoId: "9gvn_yYqKHs" },
  "leg curl machine or swiss ball hamstring curls": { images: gym.deadlift, videoId: "1Tq3QdYUuHs" },
  "standing calf raises": { images: gym.squat, videoId: "gwLzF8HAguU" },
  "bodyweight calf raises": { images: gym.hotel, videoId: "wdOkFomQNp8" },
  "pallof press": { images: gym.core, videoId: "CEvBwkCxP1o" },
  "incline dumbbell bench press": { images: gym.bench, videoId: "8iPEnn-ltC8" },
  "db incline press": { images: gym.hotel, videoId: "8iPEnn-ltC8" },
  "barbell or chest-supported rows": { images: gym.pull, videoId: "kBWAon7ItDw" },
  "db chest-supported or bent-over rows": { images: gym.hotel, videoId: "kBWAon7ItDw" },
  "dumbbell lateral raises": { images: gym.dumbbell, videoId: "3VcKaXpzqRo" },
  "db lateral raises": { images: gym.hotel, videoId: "3VcKaXpzqRo" },
  "face pulls": { images: gym.pull, videoId: "IeOqdw9WI90" },
  "dumbbell biceps curls": { images: gym.dumbbell, videoId: "ykJmrZ5v0Oo" },
  "db biceps curls": { images: gym.hotel, videoId: "ykJmrZ5v0Oo" },
  "hanging knee raises or ab wheel rollouts": {
    images: gym.core,
    videoId: "HDKs1UodzWM",
    videos: [
      { id: "HDKs1UodzWM", label: "Hanging Knee Raises" },
      { id: "kISuoI7QCYk", label: "Ab Wheel Rollouts" },
    ],
  },
  "trap bar deadlifts or barbell conventional deadlifts": { images: gym.deadlift, videoId: "2WEFvycsKiI" },
  "bulgarian split squats": { images: gym.squat, videoId: "2C-uNgKwPLE" },
  "db bulgarian split squats": { images: gym.hotel, videoId: "2C-uNgKwPLE" },
  "barbell hip thrusts or glute bridges": {
    images: gym.squat,
    videoId: "W86oVlnLqY4",
    videos: [
      { id: "W86oVlnLqY4", label: "Barbell Hip Thrusts" },
      { id: "X_IGw8U_e38", label: "Glute Bridges" },
    ],
  },
  "glute bridges with db on hips": { images: gym.hotel, videoId: "X_IGw8U_e38" },
  "leg extension machine or goblet step-ups": { images: gym.squat, videoId: "YyvSfViT6H0" },
  "farmer's carries": { images: gym.deadlift, videoId: "NH7Xv-7NQNQ" },
  "db farmer's carry": { images: gym.hotel, videoId: "NH7Xv-7NQNQ" },
  "push-ups": { images: gym.hotel, videoId: "VXo1UwiAInM" },
  "push-ups / incline push-ups": { images: gym.hotel, videoId: "VXo1UwiAInM" },
  "towel door rows or table inverted rows": { images: gym.hotel, videoId: "k4F3ze51pt8" },
  "pike push-ups": { images: gym.hotel, videoId: "0cT6ug3WVn4" },
  "doorframe towel rows or sliding floor lat pulls": { images: gym.hotel, videoId: "tnlKzMc1CRU" },
  "bench dips or bodyweight triceps extensions": { images: gym.hotel, videoId: "iH16WFso6fo" },
  "bodyweight squats or tempo squats": { images: gym.hotel, videoId: "RClKKQqsvXA" },
  "bodyweight single-leg rdls": { images: gym.deadlift, videoId: "qVhui08Jcy4" },
  "bodyweight walking or reverse lunges": { images: gym.hotel, videoId: "HIM0GrawvAU" },
  "lying hamstring floor slides": { images: gym.deadlift, videoId: "AlTI3igOaLw" },
  "hamstring walkouts": { images: gym.hotel, videoId: "NaisR71dDxI" },
  "single-leg bodyweight calf raises": { images: gym.hotel, videoId: "wdOkFomQNp8" },
  "side plank or towel iso press": { images: gym.core, videoId: "rCxF2nG9vQ0" },
  "wall lateral iso raises or backpack raises": { images: gym.hotel, videoId: "3VcKaXpzqRo" },
  "doorframe rear delt flyes / prone y-t-w raises": { images: gym.hotel, videoId: "5TBjG5xuPa4" },
  "doorframe iso curls or loaded backpack curls": { images: gym.hotel, videoId: "ykJmrZ5v0Oo" },
  "floor leg raises or bodyweight wall rollouts": {
    images: gym.core,
    videoId: "JB2oyawG9KI",
    videos: [
      { id: "JB2oyawG9KI", label: "Floor Leg Raises" },
      { id: "kISuoI7QCYk", label: "Wall Rollouts" },
    ],
  },
  "single-leg good mornings or heavy object deadlifts": { images: gym.hotel, videoId: "5rIqP63yWFg" },
  "bodyweight bulgarian split squats": { images: gym.hotel, videoId: "2C-uNgKwPLE" },
  "single-leg glute bridges": { images: gym.hotel, videoId: "X_IGw8U_e38" },
  "bodyweight step-ups or sissy squats": { images: gym.hotel, videoId: "YyvSfViT6H0" },
  "loaded water jug / backpack carries": { images: gym.hotel, videoId: "NH7Xv-7NQNQ" },
  "dumbbell or barbell shrugs": { images: gym.pull, videoId: "cJRV_wPVyNM" },
  "straight-arm pulldowns or dumbbell pullovers": { images: gym.pull, videoId: "ajdFwa-lRJc" },
  "lying triceps extensions (skull crushers)": { images: gym.dumbbell, videoId: "K3WOYRakP2Q" },
  "hammer curls": { images: gym.dumbbell, videoId: "zC3nLlEvin4" },
  "reverse wrist curls": { images: gym.dumbbell, videoId: "sPTb3aF7p6U" },
  "dead bugs": { images: gym.core, videoId: "4XLEnwUr1d8" },
  "side plank": { images: gym.core, videoId: "rCxF2nG9vQ0" },
  "backpack shrugs": { images: gym.hotel, videoId: "cJRV_wPVyNM" },
  "floor pullovers or towel straight-arm pulls": { images: gym.hotel, videoId: "FK4rHfWKObA" },
  "close-grip push-ups or backpack skull crushers": { images: gym.hotel, videoId: "K3WOYRakP2Q" },
  "backpack hammer curls": { images: gym.hotel, videoId: "zC3nLlEvin4" },
  "backpack reverse wrist curls": { images: gym.hotel, videoId: "sPTb3aF7p6U" },
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

export function exerciseVideos(media: ExerciseMedia): ExerciseVideo[] {
  if (media.videos?.length) return media.videos;
  return [{ id: media.videoId, label: "Form video" }];
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
