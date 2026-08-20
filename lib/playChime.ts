let sharedContext: AudioContext | null = null;
let hornBuffer: AudioBuffer | null = null;
let hornLoad: Promise<AudioBuffer | null> | null = null;
let completeBuffer: AudioBuffer | null = null;
let completeLoad: Promise<AudioBuffer | null> | null = null;
let setBuffer: AudioBuffer | null = null;
let setLoad: Promise<AudioBuffer | null> | null = null;
let activeHorn: AudioBufferSourceNode | null = null;
let activeComplete: AudioBufferSourceNode | null = null;
let activeSet: AudioBufferSourceNode | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext) sharedContext = new AudioCtx();
  return sharedContext;
}

function loadWav(
  url: string,
  getBuffer: () => AudioBuffer | null,
  setBuffer: (buffer: AudioBuffer) => void,
  getLoad: () => Promise<AudioBuffer | null> | null,
  setLoad: (load: Promise<AudioBuffer | null> | null) => void
) {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);
  const existing = getBuffer();
  if (existing) return Promise.resolve(existing);
  if (!getLoad()) {
    setLoad(
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data.slice(0)))
        .then((buffer) => {
          setBuffer(buffer);
          return buffer;
        })
        .catch(() => {
          setLoad(null);
          return null;
        })
    );
  }
  return getLoad() as Promise<AudioBuffer | null>;
}

function loadHornBuffer() {
  return loadWav(
    "/sounds/drill-horn.wav",
    () => hornBuffer,
    (buffer) => {
      hornBuffer = buffer;
    },
    () => hornLoad,
    (load) => {
      hornLoad = load;
    }
  );
}

function loadCompleteBuffer() {
  return loadWav(
    "/sounds/complete-chime.wav",
    () => completeBuffer,
    (buffer) => {
      completeBuffer = buffer;
    },
    () => completeLoad,
    (load) => {
      completeLoad = load;
    }
  );
}

function loadSetBuffer() {
  return loadWav(
    "/sounds/set-chime.wav",
    () => setBuffer,
    (buffer) => {
      setBuffer = buffer;
    },
    () => setLoad,
    (load) => {
      setLoad = load;
    }
  );
}
function playBuffer(
  load: () => Promise<AudioBuffer | null>,
  getActive: () => AudioBufferSourceNode | null,
  setActive: (node: AudioBufferSourceNode | null) => void,
  volume: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  void load().then((buffer) => {
    if (!buffer) return;
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const current = getActive();
    if (current) {
      try {
        current.stop();
      } catch {
        // Already stopped.
      }
      setActive(null);
    }
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(audioCtx.destination);
    setActive(source);
    source.onended = () => {
      if (getActive() === source) setActive(null);
    };
    source.start();
  });
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
  void loadHornBuffer();
  void loadCompleteBuffer();
  void loadSetBuffer();
}

export function playHorn() {
  playBuffer(loadHornBuffer, () => activeHorn, (node) => {
    activeHorn = node;
  }, 0.95);
}

export function playCompleteChime() {
  playBuffer(loadCompleteBuffer, () => activeComplete, (node) => {
    activeComplete = node;
  }, 0.7);
}

export function playSetChime() {
  playBuffer(loadSetBuffer, () => activeSet, (node) => {
    activeSet = node;
  }, 0.62);
}

export function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const start = now + index * 0.12;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}
