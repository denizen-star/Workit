import { useCallback, useEffect, useState } from 'react';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { fetchMe } from '@/lib/meClient';
import { normalizeNoiseLevel, normalizeShowPrs, type NoiseLevel } from '@/lib/noisePref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { clampScheduleDays } from '@/lib/scheduleDays';
import { normalizeSoundOn } from '@/lib/soundPref';

/** The signed-in athlete's profile, normalized once from `GET /api/me`'s `user`. */
export type Profile = {
  id: number | null;
  /** Full name as stored. */
  name: string;
  /** Alias, else first name (what the menu and Home greet with). */
  callName: string;
  email: string;
  coachTone: CoachTone;
  soundOn: boolean;
  coachVoiceOn: boolean;
  restExtraMinutes: number;
  scheduleDaysPerWeek: number;
  noiseTakeover: NoiseLevel;
  noiseEffort: NoiseLevel;
  showPrs: boolean;
  bodyWeightLb: number | null;
  gender: string;
  isAdmin: boolean;
};

// `/api/me` is untyped JSON; this is the one place that reads it field by field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileFromMe(user: any): Profile {
  return {
    id: user?.id != null ? Number(user.id) : null,
    name: user?.name || '',
    callName: user?.callName || user?.name || '',
    email: user?.email || '',
    coachTone: normalizeCoachTone(user?.coachTone),
    soundOn: normalizeSoundOn(user?.soundOn),
    coachVoiceOn: normalizeSoundOn(user?.coachVoiceOn),
    restExtraMinutes: normalizeRestExtraMinutes(user?.restExtraMinutes),
    scheduleDaysPerWeek: clampScheduleDays(user?.scheduleDaysPerWeek),
    noiseTakeover: normalizeNoiseLevel(user?.noiseTakeover),
    noiseEffort: normalizeNoiseLevel(user?.noiseEffort),
    showPrs: normalizeShowPrs(user?.showPrs),
    bodyWeightLb: user?.bodyWeightLb == null ? null : Number(user.bodyWeightLb),
    gender: user?.gender || 'male',
    isAdmin: Boolean(user?.isAdmin),
  };
}

/** What Edit profile hands back on Save (`EditProfileModal` / `AppMenu` `onSaved`). */
export type SavedProfile = {
  name: string;
  email: string | null;
  coachTone: CoachTone;
  soundOn: boolean;
  coachVoiceOn: boolean;
  restExtraMinutes: number;
  scheduleDaysPerWeek: number;
  noiseTakeover: NoiseLevel;
  noiseEffort: NoiseLevel;
  showPrs: boolean;
  gender: string;
  bodyWeightLb?: number | null;
};

/** A profile after an Edit profile save. */
export function applySavedProfile(current: Profile, saved: SavedProfile): Profile {
  return {
    ...current,
    name: saved.name,
    callName: saved.name,
    email: saved.email || '',
    coachTone: saved.coachTone,
    soundOn: saved.soundOn,
    coachVoiceOn: saved.coachVoiceOn,
    restExtraMinutes: saved.restExtraMinutes,
    scheduleDaysPerWeek: saved.scheduleDaysPerWeek,
    noiseTakeover: saved.noiseTakeover,
    noiseEffort: saved.noiseEffort,
    showPrs: saved.showPrs,
    gender: saved.gender,
    bodyWeightLb: saved.bodyWeightLb !== undefined ? saved.bodyWeightLb : current.bodyWeightLb,
  };
}

/**
 * The profile for a page shell. `status` is `failed` only when `/api/me` couldn't be
 * reached at all; a signed-out or blocked answer is `ready` with a null profile.
 */
export function useMe() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((res) => {
      if (cancelled) return;
      setProfile(res.ok && res.data?.user ? profileFromMe(res.data.user) : null);
      setStatus(res.status === 0 ? 'failed' : 'ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applySaved = useCallback(
    (saved: SavedProfile) => setProfile((current) => (current ? applySavedProfile(current, saved) : current)),
    []
  );

  return { profile, status, applySaved };
}
