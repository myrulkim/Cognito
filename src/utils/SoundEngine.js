/**
 * SoundEngine.js — Web Audio API Sound Synthesizer
 * Works on all browsers & Vercel PWA. Zero external files.
 * Boss request: correct sound, wrong sound, timer warning sound.
 */

let audioContext = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

/**
 * Play a synthesized tone
 * @param {number} frequency - Hz
 * @param {string} type - oscillator type: 'sine'|'square'|'sawtooth'|'triangle'
 * @param {number} duration - seconds
 * @param {number} volume - 0 to 1
 * @param {number} freqEnd - optional pitch slide end Hz
 */
const playTone = (frequency, type = 'sine', duration = 0.15, volume = 0.3, freqEnd = null) => {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (freqEnd) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

// ✅ CORRECT — Ascending double ding (pleasant, rewarding)
export const playCorrect = () => {
  playTone(523, 'sine', 0.1, 0.25);           // C5
  setTimeout(() => playTone(659, 'sine', 0.15, 0.3), 80);  // E5
  setTimeout(() => playTone(784, 'sine', 0.2, 0.25), 160); // G5
};

// ❌ WRONG — Descending buzz (short, not annoying)
export const playWrong = () => {
  playTone(300, 'sawtooth', 0.08, 0.2, 180);
  setTimeout(() => playTone(180, 'sawtooth', 0.12, 0.15, 120), 80);
};

// ⏱️ TIMER WARNING — Urgent single beep (bila timer < 5 saat)
export const playTimerTick = () => {
  playTone(1100, 'square', 0.05, 0.15);
};

// 🔔 TIMER CRITICAL — Double urgent beep (bila timer = 3, 2, 1)
export const playTimerCritical = () => {
  playTone(1200, 'square', 0.05, 0.25);
  setTimeout(() => playTone(1200, 'square', 0.05, 0.25), 100);
};

// 🏆 GAME OVER WIN — Victory fanfare (bila habis game dengan baik)
export const playVictory = () => {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note, 'sine', 0.2, 0.3), i * 100);
  });
};

// 💀 GAME OVER LOSE — Sad trombone (bila timer habis / game over)
export const playGameOver = () => {
  playTone(400, 'sawtooth', 0.15, 0.3, 300);
  setTimeout(() => playTone(300, 'sawtooth', 0.2, 0.25, 200), 150);
};

// 🃏 CARD FLIP — Soft click (untuk Flash Match)
export const playFlip = () => {
  playTone(800, 'triangle', 0.06, 0.1, 600);
};

// 🎯 MATCH — Pair found sound
export const playMatch = () => {
  playTone(880, 'sine', 0.1, 0.2);
  setTimeout(() => playTone(1100, 'sine', 0.15, 0.2), 80);
};
