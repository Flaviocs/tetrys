// Web Audio API Sound Effects and Music Generator
class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.musicPlaying = false;
    this.musicTimeout = null;
    this.musicNoteIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a synthesized tone
  playTone(freq, type, duration, gainVal = 0.15, pitchEnd = null) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (pitchEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, pitchEnd), this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  playMove() {
    this.playTone(220, 'triangle', 0.05, 0.08);
  }

  playRotate() {
    this.playTone(440, 'sine', 0.08, 0.1, 660);
  }

  playDrop() {
    this.playTone(160, 'triangle', 0.06, 0.09, 90);
  }

  playHardDrop() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  playHold() {
    this.playTone(330, 'sine', 0.1, 0.12, 550);
  }

  playLineClear(lines) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const baseFrequencies = [
      [523.25, 659.25], // 1 line: C5, E5
      [523.25, 659.25, 783.99], // 2 lines: C5, E5, G5
      [523.25, 659.25, 783.99, 1046.50], // 3 lines: C5, E5, G5, C6
      [523.25, 659.25, 783.99, 1046.50, 1318.51] // 4 lines (Tetris!): C5, E5, G5, C6, E6
    ];

    const notes = baseFrequencies[Math.min(lines - 1, 3)];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, lines === 4 ? 'square' : 'triangle', 0.18, lines === 4 ? 0.12 : 0.15);
      }, i * 70);
    });
  }

  playLevelUp() {
    if (!this.sfxEnabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15, 0.15);
      }, i * 90);
    });
  }

  playGameOver() {
    if (!this.sfxEnabled) return;
    const notes = [392, 369.99, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.12, freq * 0.85);
      }, i * 140);
    });
  }

  // Korobeiniki Theme (Tetris 8-bit classic theme)
  toggleMusic() {
    this.init();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  startMusic() {
    if (!this.musicEnabled) return;
    this.musicPlaying = true;
    this.playNextMusicNote();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  playNextMusicNote() {
    if (!this.musicPlaying || !this.musicEnabled || !this.ctx) return;

    // Frequencies
    const E5 = 659.25, B4 = 493.88, C5 = 523.25, D5 = 587.33;
    const A4 = 440.00, G4 = 392.00, F4 = 349.23, GS4 = 415.30;
    const E4 = 329.63, C4 = 261.63, D4 = 293.66;

    // [frequency, durationInBeats]
    const melody = [
      [E5, 1], [B4, 0.5], [C5, 0.5], [D5, 1], [C5, 0.5], [B4, 0.5],
      [A4, 1], [A4, 0.5], [C5, 0.5], [E5, 1], [D5, 0.5], [C5, 0.5],
      [B4, 1.5], [C5, 0.5], [D5, 1], [E5, 1],
      [C5, 1], [A4, 1], [A4, 1.5], [0, 0.5],

      [D5, 1.5], [F4 * 2, 0.5], [A4 * 2, 1], [G4 * 2, 0.5], [F4 * 2, 0.5],
      [E5, 1.5], [C5, 0.5], [E5, 1], [D5, 0.5], [C5, 0.5],
      [B4, 1], [B4, 0.5], [C5, 0.5], [D5, 1], [E5, 1],
      [C5, 1], [A4, 1], [A4, 2]
    ];

    const tempo = 140; // BPM
    const beatTimeMs = (60 / tempo) * 1000;

    const [noteFreq, beats] = melody[this.musicNoteIndex];
    const durationMs = beats * beatTimeMs;

    if (noteFreq > 0) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);

        const volume = 0.04; // subtle background volume
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + (durationMs / 1000) * 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + (durationMs / 1000) * 0.9);
      } catch (e) {}
    }

    this.musicNoteIndex = (this.musicNoteIndex + 1) % melody.length;
    this.musicTimeout = setTimeout(() => {
      this.playNextMusicNote();
    }, durationMs);
  }
}

window.soundManager = new SoundManager();
