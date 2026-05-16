// Sound + haptics services (graceful fallback if not available)
import * as Haptics from "expo-haptics";
import { AudioPlayer, createAudioPlayer } from "expo-audio";

let sfxEnabled = true;
let musicEnabled = true;
let hapticsEnabled = true;

export function setSfxEnabled(v: boolean) {
  sfxEnabled = v;
}
export function setMusicEnabled(v: boolean) {
  musicEnabled = v;
  if (!v && bgMusic) {
    try {
      bgMusic.pause();
    } catch {}
  } else if (v && bgMusic) {
    try {
      bgMusic.play();
    } catch {}
  }
}
export function setHapticsEnabled(v: boolean) {
  hapticsEnabled = v;
}

export const haptic = {
  light: () => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: () => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success: () => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
  selection: () => {
    if (!hapticsEnabled) return;
    Haptics.selectionAsync().catch(() => {});
  },
};

// Web-Audio-style synth sounds: we use a tiny inline WAV generator wrapped in expo-audio.
// To keep bundle tiny we synthesise short tones on demand and cache them.

let bgMusic: AudioPlayer | null = null;

// Generates a base64 WAV string for a short tone.
function makeWavBase64(
  freq: number,
  durationMs: number,
  type: "sine" | "square" | "triangle" = "sine",
  decay = 0.6
): string {
  const sampleRate = 22050;
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  // WAV header
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let v: number;
    const phase = 2 * Math.PI * freq * t;
    if (type === "sine") v = Math.sin(phase);
    else if (type === "square") v = Math.sign(Math.sin(phase));
    else v = (2 / Math.PI) * Math.asin(Math.sin(phase));
    const env = Math.exp(-t * (1 / (durationMs / 1000)) * (1 / decay));
    v *= env * 0.35;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true);
  }
  // Convert ArrayBuffer to base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as number[]
    );
  }
  // global btoa is available in RN via Hermes; fallback otherwise
  // eslint-disable-next-line no-undef
  const b64 =
    typeof btoa !== "undefined"
      ? // eslint-disable-next-line no-undef
        btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return `data:audio/wav;base64,${b64}`;
}

type SoundKey = "tap" | "drop" | "invalid" | "clear" | "combo" | "bonus" | "coin";

const soundCache: Partial<Record<SoundKey, AudioPlayer>> = {};

function getSound(key: SoundKey): AudioPlayer | null {
  if (soundCache[key]) return soundCache[key]!;
  try {
    let uri = "";
    switch (key) {
      case "tap":
        uri = makeWavBase64(880, 60, "sine", 0.3);
        break;
      case "drop":
        uri = makeWavBase64(220, 130, "triangle", 0.4);
        break;
      case "invalid":
        uri = makeWavBase64(140, 180, "square", 0.5);
        break;
      case "clear":
        uri = makeWavBase64(1320, 250, "sine", 0.6);
        break;
      case "combo":
        uri = makeWavBase64(1760, 300, "sine", 0.7);
        break;
      case "bonus":
        uri = makeWavBase64(2200, 400, "sine", 0.8);
        break;
      case "coin":
        uri = makeWavBase64(1500, 90, "sine", 0.3);
        break;
    }
    const player = createAudioPlayer({ uri });
    soundCache[key] = player;
    return player;
  } catch (e) {
    return null;
  }
}

export function playSfx(key: SoundKey) {
  if (!sfxEnabled) return;
  try {
    const p = getSound(key);
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch {}
}

// Atmospheric pad: layered sine drone (very quiet)
export function startMusic() {
  if (!musicEnabled || bgMusic) return;
  try {
    // ~6s droning pad, looped
    const uri = makeLoopPad();
    bgMusic = createAudioPlayer({ uri });
    bgMusic.loop = true;
    bgMusic.volume = 0.22;
    bgMusic.play();
  } catch {}
}

export function stopMusic() {
  try {
    bgMusic?.pause();
  } catch {}
}

function makeLoopPad(): string {
  const sampleRate = 22050;
  const durationMs = 8000; // 8 second loop for melodic phrasing
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples * 2, true);

  // Upbeat arcade-style loop: synth bass + sparkly arpeggio + soft 4/4 kick.
  // Key: A minor. BPM: 110 → beat = 0.545s, 16th = 0.136s
  const bassPattern = [220, 220, 220, 330, 261.63, 261.63, 261.63, 392, 196, 196, 196, 293.66, 220, 220, 330, 392];
  const arpPattern = [880, 1108.73, 1318.51, 1108.73, 783.99, 987.77, 1174.66, 987.77, 698.46, 880, 1046.5, 880, 880, 1046.5, 1174.66, 1318.51];
  const beatLen = 8 / 32; // 32 16th notes in 8s = 0.25s per 16th
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t / beatLen) % 16;
    const stepT = (t % beatLen) / beatLen; // 0..1 within step
    // Bass
    const bassEnv = Math.exp(-stepT * 3) * 0.55;
    const bass = Math.sin(2 * Math.PI * bassPattern[step] * t) * bassEnv;
    // Arpeggio (sparkly)
    const arpEnv = Math.exp(-stepT * 6) * 0.32;
    const arp = (Math.sin(2 * Math.PI * arpPattern[step] * t) +
                 Math.sin(2 * Math.PI * arpPattern[step] * 2 * t) * 0.3) * arpEnv;
    // Kick (every 8th)
    const kickStep = Math.floor(t / (beatLen * 2)) % 8;
    const kickT = (t % (beatLen * 2)) / (beatLen * 2);
    const isKick = kickStep === 0 || kickStep === 4;
    const kick = isKick ? Math.sin(2 * Math.PI * (60 + 40 * Math.exp(-kickT * 30)) * t) * Math.exp(-kickT * 8) * 0.5 : 0;
    // Hi-hat-ish (white noise burst on offbeats)
    const hatStep = Math.floor(t / beatLen) % 4;
    const hatT = (t % beatLen) / beatLen;
    const isHat = hatStep === 2;
    const hat = isHat ? (Math.random() - 0.5) * Math.exp(-hatT * 18) * 0.18 : 0;
    let v = bass + arp + kick + hat;
    v = Math.max(-1, Math.min(1, v));
    view.setInt16(44 + i * 2, v * 11000, true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as number[]
    );
  }
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return `data:audio/wav;base64,${b64}`;
}
