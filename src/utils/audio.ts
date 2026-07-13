/**
 * Web Audio API synthesizer for retro sound effects and procedural background music.
 * Avoids external audio file dependency issues.
 */

class AudioController {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTimer: number | null = null;
  private currentNotes: OscillatorNode[] = [];
  
  // Settings state
  public musicEnabled = true;
  public sfxEnabled = true;

  private init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.warn("Failed to resume audio context:", e));
      }
      return;
    }
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      // Setup gain nodes
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime); // Master level 30%
      this.masterVolume.connect(this.ctx.destination);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(0.25, this.ctx.currentTime); // Music 25%
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(0.6, this.ctx.currentTime); // SFX 60%
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public setMusicVolume(val: number) {
    this.init();
    if (this.musicVolume && this.ctx) {
      this.musicVolume.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  public setSfxVolume(val: number) {
    this.init();
    if (this.sfxVolume && this.ctx) {
      this.sfxVolume.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  // SFX: Laser Shoot
  public playShoot() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // SFX: Laser Double/Triple Shoot (slightly different pitch)
  public playPowerShoot() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.18);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxVolume);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.18);
    osc2.stop(this.ctx.currentTime + 0.18);
  }

  // SFX: Explosion (synthesized white noise or rumble)
  public playExplosion() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Use low frequency triangle + pitch drop for retro rumble
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);

    // Filter to make it sound like a low rumbling explosion
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // SFX: Player Hurt
  public playHurt() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(90, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // SFX: Coin / Scrap Collect
  public playCollect() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Arpeggio sound
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.18); // C6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(now + 0.28);
  }

  // SFX: Power up pickup
  public playPowerup() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.4); // E6

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(now + 0.4);
  }

  // SFX: Heavy Neutron Splitting Blaster (Deep, resonant plasma thump)
  public playNeutronShoot() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(280, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.26);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(140, now);
    osc2.frequency.exponentialRampToValueAtTime(25, now + 0.26);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(6.0, now);
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.26);

    gainNode.gain.setValueAtTime(0.26, now);
    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.26);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxVolume);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.26);
    osc2.stop(now + 0.26);
  }

  // SFX: Tesla Volt Discharge (Crackling, high-voltage lightning static spark)
  public playTeslaShoot() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator(); // FM Modulator for crackle
    const modGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.12);

    mod.frequency.setValueAtTime(75, now); // 75Hz crackle
    modGain.gain.setValueAtTime(400, now); // Amplitude of pitch wobble

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, now);

    gainNode.gain.setValueAtTime(0.18, now);
    // Rapid gating to make it sound sparky
    gainNode.gain.setValueAtTime(0.18, now + 0.04);
    gainNode.gain.setValueAtTime(0.04, now + 0.05);
    gainNode.gain.setValueAtTime(0.15, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    mod.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxVolume);

    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.12);
    osc.stop(now + 0.12);
  }

  // SFX: Deep Space Anomaly Siren
  public playAnomalyAlarm() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const timeOffset = i * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now + timeOffset);
      osc.frequency.linearRampToValueAtTime(640, now + timeOffset + 0.15);
      osc.frequency.linearRampToValueAtTime(320, now + timeOffset + 0.3);

      gain.gain.setValueAtTime(0.12, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.005, now + timeOffset + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxVolume);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.3);
    }
  }

  // SFX: Game Over jingle
  public playGameOver() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    
    // Low, fading minor notes
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.setValueAtTime(311.13, now + 0.2); // D#4
    osc.frequency.setValueAtTime(293.66, now + 0.4); // D4
    osc.frequency.setValueAtTime(220.00, now + 0.6); // A3

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.setValueAtTime(0.2, now + 0.2);
    gain.gain.setValueAtTime(0.15, now + 0.4);
    gain.gain.linearRampToValueAtTime(0.01, now + 1.0);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start();
    osc.stop(now + 1.0);
  }

  // Procedural background music (Synthwave Bassline loop)
  public startMusic() {
    if (!this.musicEnabled) return;
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.playMusicLoop();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentNotes.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.currentNotes = [];
  }

  private playMusicLoop() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicVolume) return;

    const tempo = 125; // BPM
    const eighthNoteTime = 60 / tempo / 2; // Time of an 8th note in seconds

    // Simple cyberpunk bassline progression (C, Eb, F, Bb)
    const baseFreqs = [
      65.41, 65.41, 77.78, 77.78, // C2, Eb2
      87.31, 87.31, 116.54, 116.54 // F2, Bb2
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicVolume) return;

      const now = this.ctx.currentTime;
      const freq = baseFreqs[step % baseFreqs.length];

      // Play bass note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + eighthNoteTime - 0.02);

      // Low pass filter to make bass warm
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicVolume);

      osc.start(now);
      osc.stop(now + eighthNoteTime);

      this.currentNotes.push(osc);
      // Keep list small
      if (this.currentNotes.length > 5) {
        this.currentNotes.shift();
      }

      // Add simple synth lead arpeggio occasionally on eighth notes
      if (step % 4 === 0 && Math.random() > 0.4) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        
        // Choose harmonic notes (C4, Eb4, G4, Bb4)
        const scale = [261.63, 311.13, 392.00, 466.16, 523.25];
        const leadFreq = scale[Math.floor(Math.random() * scale.length)];

        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(0.05, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + eighthNoteTime * 1.5);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicVolume);

        leadOsc.start(now);
        leadOsc.stop(now + eighthNoteTime * 1.5);
      }

      step++;
      
      this.musicTimer = window.setTimeout(playStep, eighthNoteTime * 1000);
    };

    playStep();
  }
}

export const SynthAudio = new AudioController();
