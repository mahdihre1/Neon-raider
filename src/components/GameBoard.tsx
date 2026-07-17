import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Upgrades, SHIP_SKINS } from '../types';
import { SynthAudio } from '../utils/audio';
import { Shield, Sparkles, Zap, Award, Target, Coins, Volume2, VolumeX, Hourglass, AlertTriangle, RefreshCw, Heart, Battery, Tv, ShieldAlert } from 'lucide-react';
import { AdPlayerOverlay } from './AdPlayerOverlay';

interface GameBoardProps {
  upgrades: Upgrades;
  onGameOver: (score: number, scrapCollected: number, enemiesKilled: number, deathCause?: string, suggestedUpgrade?: string) => void;
  onPause: () => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  isTutorial?: boolean;
  onTutorialComplete?: () => void;
  gameMode?: 'normal' | 'story';
  starterLoadout?: 'balanced' | 'glass' | 'tank';
  onSelectStarterLoadout?: (loadout: 'balanced' | 'glass' | 'tank') => void;
  musicOn: boolean;
  setMusicOn: (musicOn: boolean) => void;
  sfxOn: boolean;
  setSfxOn: (sfxOn: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'scout' | 'speeder' | 'bomber' | 'boss';
  color: string;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  phase: number;
  phaseSpeed: number;
  bossIndex?: number;
  isHyperCharged?: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  damage: number;
  fromPlayer: boolean;
  isWave?: boolean;
  wavePhase?: number;
  waveFreq?: number;
  waveAmp?: number;
  isTesla?: boolean;
  teslaPhase?: number;
  isNeutron?: boolean;
}

interface Collectible {
  x: number;
  y: number;
  type: 'scrap' | 'heal' | 'invincibility' | 'double' | 'magnet' | 'timewarp';
  color: string;
  size: number;
  pulse: number;
}

interface DialogueLine {
  speaker: string;
  avatar: string; // 'cluck' | 'empress' | 'commander' | 'overlord' | 'omega' | 'raider' | 'ai'
  text: string;
}

const CHAPTER_DIALOGUES: Record<number, { intro: DialogueLine[]; outro: DialogueLine[] }> = {
  1: {
    intro: [
      { speaker: "COOP ENEMY TRANSMISSION", avatar: "cluck", text: "BA-GOCK! Puny human star-rider! For centuries you deep-fried our kin, scrambled our eggs, and dipped us in sweet & sour sauce!" },
      { speaker: "COOP ENEMY TRANSMISSION", avatar: "cluck", text: "Now, the Cybernetic space cluckers have risen! We will conquer your sectors, pluck your shields, and deep-fry your cities! Prepare for the Cluck-pocalypse!" },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "Wait... is that a giant chicken hologram? This deep-space patrol just got incredibly weird. Shield buffers charged, launching defense grid!" }
    ],
    outro: [
      { speaker: "PILOT RAIDER", avatar: "raider", text: "Target neutralized. It looks like that was just an advance scout coop. Scanners show heavy energy readings ahead." },
      { speaker: "SHIP COMPILER AI", avatar: "ai", text: "Affirmative, Pilot. Thermal readings indicate millions of feathered biosignatures. They are forming an interplanetary flock in the next sector." }
    ]
  },
  2: {
    intro: [
      { speaker: "HEN EMPRESS LAY-A", avatar: "empress", text: "Cluck cluck cluck... You managed to grill our advance scouts! But you have yet to face our Elite Egg-Bomb Barrage!" },
      { speaker: "HEN EMPRESS LAY-A", avatar: "empress", text: "My Interstellar Hen squadrons will rain high-yield plasma eggs upon your cockpit! Prepare to be sunny-side-down!" },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "High-yield plasma eggs? Okay, I definitely need to watch out for their falling cargo. Keep maneuvering!" }
    ],
    outro: [
      { speaker: "PILOT RAIDER", avatar: "raider", text: "The Empress has been scrambled! Collecting residual energy cells and scrap..." },
      { speaker: "SHIP COMPILER AI", avatar: "ai", text: "Superb maneuvering. Warning: A hyper-frequency rooster signal is broadcasting from the central asteroid field. Standby." }
    ]
  },
  3: {
    intro: [
      { speaker: "WING COMMANDER ROOSTER", avatar: "commander", text: "CHIRP-CLUCK! You are making a terrible mist-egg, Raider! Our rotating orbital coop spikes will shred your defenses!" },
      { speaker: "WING COMMANDER ROOSTER", avatar: "commander", text: "Feathers will fly! You will be fried, baked, and basted in the void of space!" },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "These puns are more lethal than their blasters... I will roast this squadron once and for all!" }
    ],
    outro: [
      { speaker: "PILOT RAIDER", avatar: "raider", text: "Commander down! The feathered fleet is retreating. Let's finish them off!" },
      { speaker: "SHIP COMPILER AI", avatar: "ai", text: "Warning: High-gravity gravitational anomaly ahead. They have activated an artificial Singularity Coop!" }
    ]
  },
  4: {
    intro: [
      { speaker: "DARK EGG OVERLORD", avatar: "overlord", text: "BOCK-GOCK! Welcome to the Dark Side of the Coop! None can escape our high-gravity Singularity!" },
      { speaker: "DARK EGG OVERLORD", avatar: "overlord", text: "Behold, as we trigger extreme solar flares to scorch your ship! Your ashes will feed our cybernetic chicks!" },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "This gravity pull is strong, and there are asteroids everywhere. Time to use maximum focus!" }
    ],
    outro: [
      { speaker: "SHIP COMPILER AI", avatar: "ai", text: "Singularity collapsed! Path cleared. The final hyper-frequency signature is coming from the absolute galactic core." },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "This is it. The nest of the Omega Neon Chicken God. Let's end this clucking threat once and for all!" }
    ]
  },
  5: {
    intro: [
      { speaker: "OMEGA NEON CHICKEN GOD", avatar: "omega", text: "BA-BA-GOCK-GOCK-GOCK!!!! MORTAL SOUL!" },
      { speaker: "OMEGA NEON CHICKEN GOD", avatar: "omega", text: "You have crossed the sacred galaxy boundaries, scrambled our imperial courts, and roasted our supreme council!" },
      { speaker: "OMEGA NEON CHICKEN GOD", avatar: "omega", text: "NOW FEEL THE ULTIMATE COSMIC POWER OF INFINITE CYBERNETIC FEATHERED DOOM!!!" },
      { speaker: "PILOT RAIDER", avatar: "raider", text: "That is the largest cyber-rooster I've ever seen! All weapons primed, shields at max, let's win this war!" }
    ],
    outro: [
      { speaker: "PILOT RAIDER", avatar: "raider", text: "WE DID IT! The Omega Chicken God is completely roasted!" },
      { speaker: "SHIP COMPILER AI", avatar: "ai", text: "Congratulations, Pilot Raider. The feathered threat has been permanently pacified. Space is safe for omelet lovers everywhere. Sector secured!" }
    ]
  }
};

interface RogueliteBuff {
  id: string;
  name: string;
  description: string;
  icon: 'zap' | 'shield' | 'plus' | 'magnet' | 'target' | 'heart' | 'sparkles' | 'activity';
}

const ROGUELITE_BUFF_POOL: RogueliteBuff[] = [
  {
    id: 'fireRate',
    name: 'HYPER-HEAT COILS',
    description: 'Permanent +20% Firing Speed. Calibrates ship weapon capacitors to shed heat faster.',
    icon: 'zap'
  },
  {
    id: 'pierce',
    name: 'PHASE-PIERCE CORES',
    description: 'Your laser bolts pierce through 1 extra enemy on impact, carrying tachyon charges.',
    icon: 'target'
  },
  {
    id: 'regen',
    name: 'NANITE REPAIR HULL',
    description: 'Vessel shield auto-regenerates 1 point of capacity every second continuously.',
    icon: 'heart'
  },
  {
    id: 'magnet',
    name: 'SCRAP GRAVITY WELL',
    description: 'Vacuum attraction range for space scrap and floating collectibles increased by +100px.',
    icon: 'magnet'
  },
  {
    id: 'maxShield',
    name: 'AETHER REINFORCEMENT',
    description: 'Boosts max shield hull by +25 capacity and fully repairs/charges your ship.',
    icon: 'shield'
  },
  {
    id: 'damage',
    name: 'PHOTON AMPLIFIER',
    description: 'Boosts weapon photon-density, giving all lasers +25% flat damage increase.',
    icon: 'sparkles'
  },
  {
    id: 'crit',
    name: 'PRECISION OPTICS',
    description: 'Precision targeting chips grant a flat +12% chance to land critical hits for 2x damage.',
    icon: 'target'
  },
  {
    id: 'desperation',
    name: 'DESPERATION OVERDRIVE',
    description: 'Unlocks Desperation Protocols: +50% fire-rate and 2x damage whenever shields are below 15%!',
    icon: 'activity'
  }
];

export default function GameBoard({ 
  upgrades, 
  onGameOver, 
  onPause, 
  paused, 
  setPaused, 
  isTutorial = false, 
  onTutorialComplete,
  gameMode = 'normal',
  starterLoadout = 'balanced',
  onSelectStarterLoadout,
  musicOn,
  setMusicOn,
  sfxOn,
  setSfxOn
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Starter loadout inside-the-game states
  const [localStarterLoadout, setLocalStarterLoadout] = useState<'balanced' | 'glass' | 'tank' | null>(() => {
    return isTutorial ? 'balanced' : null;
  });
  const [selectedTempLoadout, setSelectedTempLoadout] = useState<'balanced' | 'glass' | 'tank'>(starterLoadout || 'balanced');

  // Stats in UI
  const [score, setScore] = useState(0);
  const [scrap, setScrap] = useState(0);
  const [shield, setShield] = useState(100);
  const [maxShield, setMaxShield] = useState(100);
  const [bossActive, setBossActive] = useState(false);
  const [bossHealthPercent, setBossHealthPercent] = useState(0);
  const [bossName, setBossName] = useState('NEON OVERLORD');
  const [bossImmune, setBossImmune] = useState(false);

  // Story Mode states
  const [chapter, setChapter] = useState(1);
  const [wave, setWave] = useState(1);
  const [killCount, setKillCount] = useState(0);
  const [killGoal, setKillGoal] = useState(10);
  const [activeDialogueLines, setActiveDialogueLines] = useState<DialogueLine[]>([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showingDialogue, setShowingDialogue] = useState(false);
  const [dialogueType, setDialogueType] = useState<'intro' | 'outro'>('intro');
  const [chapterTransition, setChapterTransition] = useState(false);

  // Power up duration states (for simple UI display progress bars)
  const [invincibilityDuration, setInvincibilityDuration] = useState(0);
  const [doubleDuration, setDoubleDuration] = useState(0);
  const [magnetDuration, setMagnetDuration] = useState(0);
  const [timewarpDuration, setTimewarpDuration] = useState(0);

  // Cosmic Event state
  const [activeEvent, setActiveEvent] = useState<'none' | 'warp' | 'solar' | 'asteroid' | 'pulsar'>('none');
  const [eventTimeLeft, setEventTimeLeft] = useState(0);
  const [cosmicWarningBanner, setCosmicWarningBanner] = useState<string | null>(null);

  // Tutorial state
  const [tutStep, setTutStep] = useState(0);
  const [tutProgress, setTutProgress] = useState(0);
  const [tutPhaseCleared, setTutPhaseCleared] = useState(false);
  const [isTutorialCollapsed, setIsTutorialCollapsed] = useState(false);

  // Roguelite Pick-a-Buff choices overlay
  const [showingBuffChoice, setShowingBuffChoice] = useState(false);
  const [buffOptions, setBuffOptions] = useState<any[]>([]);

  // Rewarded Video Ad Revive states
  const [showingRevivePrompt, setShowingRevivePrompt] = useState(false);
  const [playingReviveAd, setPlayingReviveAd] = useState(false);
  const [hasRevived, setHasRevived] = useState(false);

  // references for mutable game loop state to avoid React re-renders breaking 60 FPS
  const stateRef = useRef({
    tutorialStep: 0,
    tutorialProgressCount: 0,
    tutorialPhaseCleared: false,
    hasRevivedThisRun: false,
    score: 0,
    scrap: 0,
    enemiesKilled: 0,
    shield: 100,
    maxShield: 100,
    player: {
      x: 180,
      y: 500,
      width: 32,
      height: 32,
      color: '#00f0ff',
      trailColor: 'rgba(0, 240, 255, 0.4)',
      powerups: {
        invincibility: 0, // seconds remaining
        doubleLaser: 0,
        magnet: 0,
        timewarp: 0
      }
    },
    upgrades: upgrades,
    droneShootTimer: 0,
    touch: {
      isDragging: false,
      lastX: 0,
      lastY: 0
    },
    stars: [] as Star[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    nextEnemyId: 1,
    spawnTimer: 0,
    bossSpawnedCount: 0,
    bossCooldownTimer: 0,
    lastTime: 0,
    multiplier: 1,
    multiplierTimer: 0,
    shootTimer: 0,
    width: 360,
    height: 640,
    keys: {} as Record<string, boolean>,
    cosmicEvent: 'none' as 'none' | 'warp' | 'solar' | 'asteroid' | 'pulsar',
    cosmicEventTimer: 0,
    cosmicEventNextScore: 350,
    solarFlares: [] as Array<{ x: number, y: number, r: number, speed: number }>,
    pulsarX: 180,
    pulsarDir: 1,
    pulsarState: 'warning' as 'warning' | 'firing',
    pulsarStateTimer: 0,
    lastHudUpdate: 0,
    shieldRegenTimer: 0,
    naniteRegenTimer: 0,
    anomalyAlarmTriggered: false,
    storyMode: 'normal' as 'normal' | 'story',
    storyChapter: 1,
    storyWave: 1,
    storyKillsThisWave: 0,
    storyKillGoal: 10,
    storyBossSpawned: false,
    storyShowingDialogue: false,
    storyChapterTransition: false,
    rogueliteBuffs: {
      fireRateMult: 1.0,
      laserPierceBonus: 0,
      shieldRegenBonus: 0,
      pullRadiusBonus: 0,
      maxShieldBonus: 0,
      damageMult: 1.0,
      critBonus: 0,
      desperationUnlocked: false
    },
    lastBuffMilestone: 0,
    desperationTriggered: false,
    starterLoadout: null as 'balanced' | 'glass' | 'tank' | null,
    showingBuffChoice: false,
  });

  // Keep upgrades sync'ed
  useEffect(() => {
    stateRef.current.upgrades = upgrades;
    stateRef.current.starterLoadout = localStarterLoadout;
    const skin = SHIP_SKINS.find(s => s.id === upgrades.selectedSkin) || SHIP_SKINS[0];
    stateRef.current.player.color = skin.color;
    stateRef.current.player.trailColor = skin.trailColor;

    // Derived max shield based on upgrade levels & starting philosophy
    let mShield = 100 + (upgrades.maxShield - 1) * 20;
    const activeLoadout = localStarterLoadout || 'balanced';
    if (activeLoadout === 'glass') {
      mShield = 40; // Glass Cannon
    } else if (activeLoadout === 'tank') {
      mShield += 80; // Heavy Tank plate
    }

    setMaxShield(mShield);
    stateRef.current.maxShield = mShield;
    stateRef.current.shield = mShield;
    setShield(mShield);
  }, [upgrades, localStarterLoadout]);

  const showDialogueScreen = (show: boolean) => {
    setShowingDialogue(show);
    stateRef.current.storyShowingDialogue = show;
  };

  const setChapterTransitionScreen = (trans: boolean) => {
    setChapterTransition(trans);
    stateRef.current.storyChapterTransition = trans;
  };

  const triggerBuffSelection = () => {
    const shuffled = [...ROGUELITE_BUFF_POOL].sort(() => 0.5 - Math.random());
    setBuffOptions(shuffled.slice(0, 3));
    setShowingBuffChoice(true);
    stateRef.current.showingBuffChoice = true;
  };

  const applySelectedBuff = (buffId: string) => {
    const state = stateRef.current;
    if (!state.rogueliteBuffs) {
      state.rogueliteBuffs = {
        fireRateMult: 1.0,
        laserPierceBonus: 0,
        shieldRegenBonus: 0,
        pullRadiusBonus: 0,
        maxShieldBonus: 0,
        damageMult: 1.0,
        critBonus: 0,
        desperationUnlocked: false
      };
    }

    if (buffId === 'fireRate') {
      state.rogueliteBuffs.fireRateMult *= 0.80; // 20% less firing delay (faster auto-fire!)
    } else if (buffId === 'pierce') {
      state.rogueliteBuffs.laserPierceBonus += 1;
    } else if (buffId === 'regen') {
      state.rogueliteBuffs.shieldRegenBonus += 1;
    } else if (buffId === 'magnet') {
      state.rogueliteBuffs.pullRadiusBonus += 100;
    } else if (buffId === 'maxShield') {
      state.maxShield += 25;
      setMaxShield(state.maxShield);
      state.shield = state.maxShield;
      setShield(state.shield);
    } else if (buffId === 'damage') {
      state.rogueliteBuffs.damageMult *= 1.25;
    } else if (buffId === 'crit') {
      state.rogueliteBuffs.critBonus += 0.12;
    } else if (buffId === 'desperation') {
      state.rogueliteBuffs.desperationUnlocked = true;
    }

    SynthAudio.playPowerup();
    setShowingBuffChoice(false);
    stateRef.current.showingBuffChoice = false;
  };

  // Sync and initialize Story Mode
  useEffect(() => {
    stateRef.current.storyMode = gameMode;
    if (gameMode === 'story') {
      stateRef.current.storyChapter = 1;
      stateRef.current.storyWave = 1;
      stateRef.current.storyKillsThisWave = 0;
      stateRef.current.storyKillGoal = 10;
      stateRef.current.storyBossSpawned = false;

      setChapter(1);
      setWave(1);
      setKillCount(0);
      setKillGoal(10);
      setDialogueType('intro');
      setActiveDialogueLines(CHAPTER_DIALOGUES[1].intro);
      setDialogueIndex(0);
      showDialogueScreen(true);
    }
  }, [gameMode]);

  // Handle music toggling
  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    SynthAudio.musicEnabled = next;
    if (next) {
      SynthAudio.startMusic();
    } else {
      SynthAudio.stopMusic();
    }
  };

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    SynthAudio.sfxEnabled = next;
  };

  const advanceTutorialStep = () => {
    const state = stateRef.current;
    if (!state.tutorialPhaseCleared) return;

    SynthAudio.playPowerup();
    state.tutorialProgressCount = 0;
    state.tutorialPhaseCleared = false;
    setTutPhaseCleared(false);

    if (state.tutorialStep === 0) {
      state.tutorialStep = 1;
      setTutStep(1);
      // Spawn 3 static Target Orbs for shooting practice
      for (let k = 0; k < 3; k++) {
        state.enemies.push({
          id: state.nextEnemyId++,
          x: 50 + k * 105,
          y: 120,
          width: 32,
          height: 32,
          speed: 0,
          type: 'scout',
          color: '#38bdf8', // Neon Sky Blue Target
          health: 15,
          maxHealth: 15,
          shootCooldown: 99999, // Static target doesn't return fire
          phase: 0,
          phaseSpeed: 0
        });
      }
    } else if (state.tutorialStep === 1) {
      state.tutorialStep = 2;
      setTutStep(2);
      // Spawn 3 floating Amethyst Scraps
      for (let k = 0; k < 3; k++) {
        state.collectibles.push({
          x: 70 + k * 100,
          y: 100,
          type: 'scrap',
          color: '#d946ef', // purple magenta
          size: 8,
          pulse: 0
        });
      }
    } else if (state.tutorialStep === 2) {
      state.tutorialStep = 3;
      setTutStep(3);
      // Spawn powerups
      state.collectibles.push(
        { x: 110, y: 130, type: 'heal', color: '#10b981', size: 9, pulse: 0 },
        { x: 230, y: 130, type: 'double', color: '#3b82f6', size: 9, pulse: 0 }
      );
    } else if (state.tutorialStep === 3) {
      state.tutorialStep = 4;
      setTutStep(4);
    } else if (state.tutorialStep === 4) {
      if (onTutorialComplete) {
        onTutorialComplete();
      }
    }
  };

  // Build/Init background stars
  useEffect(() => {
    const tempStars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      tempStars.push({
        x: Math.random() * 360,
        y: Math.random() * 640,
        speed: 0.5 + Math.random() * 2.5,
        size: 0.5 + Math.random() * 2
      });
    }
    stateRef.current.stars = tempStars;
    
    // Auto-start music
    if (musicOn) {
      SynthAudio.startMusic();
    }
    return () => {
      SynthAudio.stopMusic();
    };
  }, []);

  // Main Canvas Setup and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isMounted = true;

    const onStoryEnemyKilled = (enemyType: string) => {
      if (stateRef.current.storyMode !== 'story') return;
      
      if (enemyType === 'boss') {
        // Boss killed! Chapter completed!
        setBossActive(false);
        const currentChapter = stateRef.current.storyChapter;
        setDialogueType('outro');
        setActiveDialogueLines(CHAPTER_DIALOGUES[currentChapter].outro);
        setDialogueIndex(0);
        showDialogueScreen(true);
      } else {
        // Standard enemy killed
        if (stateRef.current.storyWave < 3) {
          stateRef.current.storyKillsThisWave++;
          setKillCount(stateRef.current.storyKillsThisWave);
          
          if (stateRef.current.storyKillsThisWave >= stateRef.current.storyKillGoal) {
            if (stateRef.current.storyWave === 1) {
              stateRef.current.storyWave = 2;
              stateRef.current.storyKillsThisWave = 0;
              stateRef.current.storyKillGoal = 15;
              setWave(2);
              setKillCount(0);
              setKillGoal(15);
              
              setCosmicWarningBanner("🔥 WAVE 2: ENEMY REINFORCEMENTS INCOMING!");
              setTimeout(() => setCosmicWarningBanner(null), 3000);
            } else if (stateRef.current.storyWave === 2) {
              stateRef.current.storyWave = 3;
              stateRef.current.storyKillsThisWave = 0;
              stateRef.current.storyKillGoal = 1;
              stateRef.current.storyBossSpawned = false;
              setWave(3);
              setKillCount(0);
              setKillGoal(1);
              
              setCosmicWarningBanner("🚨 ALERT: CYBER-COOP BOSS DETECTED!");
              setTimeout(() => setCosmicWarningBanner(null), 3000);
            }
          }
        }
      }
    };

    // Setup dimensions
    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width || 360;
      const h = rect.height || 640;
      canvas.width = w;
      canvas.height = h;
      stateRef.current.width = w;
      stateRef.current.height = h;

      // Adjust player boundaries safely
      if (stateRef.current.player.x > w - 40) stateRef.current.player.x = w / 2;
      if (stateRef.current.player.y > h - 60) stateRef.current.player.y = h - 100;
    };

    window.addEventListener('resize', resize);
    resize();

    // Keyboard handlers for keyboard movement & pause toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.showingBuffChoice) {
        if (['Escape', 'p', 'P'].includes(e.key)) {
          return;
        }
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) || ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      stateRef.current.keys[e.key] = true;
      stateRef.current.keys[e.code] = true;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        onPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Spawn initial particle cloud
    const createExplosion = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 2 + Math.random() * 4,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03
        });
      }
    };

    const spawnCollectible = (x: number, y: number) => {
      // 30% chance to drop a collectible
      if (Math.random() > 0.35) return;
      
      const rand = Math.random();
      let type: Collectible['type'] = 'scrap';
      let color = '#d946ef'; // Amethyst Purple scrap

      if (rand < 0.10) {
        type = 'invincibility';
        color = '#a855f7'; // Purple shield
      } else if (rand < 0.22) {
        type = 'double';
        color = '#f97316'; // Blazing hot orange double shot
      } else if (rand < 0.35) {
        type = 'magnet';
        color = '#10b981'; // Emerald magnet
      } else if (rand < 0.47) {
        type = 'timewarp';
        color = '#22d3ee'; // Cyan time warp
      } else if (rand < 0.62) {
        type = 'heal';
        color = '#f43f5e'; // Bright ruby red repair
      }

      stateRef.current.collectibles.push({
        x,
        y,
        type,
        color,
        size: type === 'scrap' ? 7 : 13,
        pulse: 0
      });
    };

    // Main update logic inside frame loop
    const gameLoop = (timestamp: number) => {
      if (!isMounted) return;

      if (paused || !stateRef.current.starterLoadout || stateRef.current.showingBuffChoice || showingRevivePrompt) {
        // Draw pause screen overlay slightly, keeping frame rate ticking for starry background
        stateRef.current.lastTime = timestamp;
        ctx.fillStyle = 'rgba(10, 10, 18, 0.4)';
        ctx.fillRect(0, 0, stateRef.current.width, stateRef.current.height);
        
        // Render stars scrolling slowly even while paused (visual delight!)
        stateRef.current.stars.forEach(star => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.speed / 3})`;
          ctx.fillRect(star.x, star.y, star.size, star.size);
          star.y += star.speed * 0.2;
          if (star.y > stateRef.current.height) {
            star.y = 0;
            star.x = Math.random() * stateRef.current.width;
          }
        });

        animId = requestAnimationFrame(gameLoop);
        return;
      }

      if (stateRef.current.lastTime === 0) {
        stateRef.current.lastTime = timestamp;
      }
      const delta = (timestamp - stateRef.current.lastTime) / 1000;
      stateRef.current.lastTime = timestamp;

      // Restrict max delta to prevent warping on tab switch
      const deltaVal = Math.min(delta, 0.1);
      const isPausedForStory = stateRef.current.storyShowingDialogue || stateRef.current.storyChapterTransition;
      const dt = isPausedForStory ? 0 : deltaVal;

      ctx.clearRect(0, 0, stateRef.current.width, stateRef.current.height);

      const state = stateRef.current;
      const { width, height, player, upgrades } = state;

      // Check 100k Anomaly Threshold crossing
      if (state.score >= 100000 && !state.anomalyAlarmTriggered) {
        state.anomalyAlarmTriggered = true;
        setCosmicWarningBanner("⚠️ DEEP-SPACE HYPER ANOMALY DETECTED! DIFFICULTY MULTIPLIER ENGAGED!");
        SynthAudio.playAnomalyAlarm();
        
        setTimeout(() => {
          setCosmicWarningBanner(null);
        }, 5500);
      }

      if (state.bossCooldownTimer > 0) {
        state.bossCooldownTimer -= dt;
      }

      const isTimeWarp = player.powerups.timewarp > 0;
      
      // Game pace scaling factor based on current score
      // Starts at 0.95x speed and fastens up to 1.95x speed at 12000 score for escalating adrenaline!
      const paceFactor = Math.min(1.95, 0.95 + (state.score / 12000) * 1.00);
      const enemyDt = (isTimeWarp ? dt * 0.35 : dt) * paceFactor;

      // Keyboard Position Updates (WASD & Arrow Keys)
      let speed = 480; // Base ship speed in pixels/sec (snappy movement sensitivity)
      if (upgrades.selectedSkin === 'cyan') {
        speed *= 1.15; // Agility Drive: +15% thruster speed
      }
      if (state.cosmicEvent === 'warp') {
        speed *= 1.25; // Hyperspace warp: +25% speed
      }
      if (state.starterLoadout === 'glass') {
        speed *= 1.10; // Glass Cannon: +10% speed
      } else if (state.starterLoadout === 'tank') {
        speed *= 0.80; // Heavy Tank: 20% slower movement
      }
      let dx = 0;
      let dy = 0;

      if (state.keys['ArrowLeft'] || state.keys['KeyA'] || state.keys['a'] || state.keys['A']) {
        dx -= 1;
      }
      if (state.keys['ArrowRight'] || state.keys['KeyD'] || state.keys['d'] || state.keys['D']) {
        dx += 1;
      }
      if (state.keys['ArrowUp'] || state.keys['KeyW'] || state.keys['w'] || state.keys['W']) {
        dy -= 1;
      }
      if (state.keys['ArrowDown'] || state.keys['KeyS'] || state.keys['s'] || state.keys['S']) {
        dy += 1;
      }

      if (dx !== 0 && dy !== 0) {
        // Normalize diagonals
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }

      if (dx !== 0 || dy !== 0) {
        player.x = Math.max(0, Math.min(width - player.width, player.x + dx * speed * dt));
        player.y = Math.max(40, Math.min(height - player.height - 10, player.y + dy * speed * dt));
      }

      // Cosmic Event spawning/triggering logic
      if (state.score >= state.cosmicEventNextScore && state.cosmicEvent === 'none') {
        const events: Array<'warp' | 'solar' | 'asteroid' | 'pulsar'> = ['warp', 'solar', 'asteroid', 'pulsar'];
        const chosen = events[Math.floor(Math.random() * events.length)];
        state.cosmicEvent = chosen;
        state.cosmicEventTimer = 20.0; // 20 seconds duration
        state.cosmicEventNextScore = state.score + 500 + Math.random() * 300;
        
        let warnText = "COSMIC ANOMALY DEPLOYED";
        if (chosen === 'warp') warnText = "⚠️ HYPERDRIVE WARP RIFT DETECTED! Speed is doubled!";
        if (chosen === 'solar') warnText = "⚠️ SOLAR FLARE WARNING! Dodge molten heatwaves!";
        if (chosen === 'asteroid') warnText = "⚠️ ASTEROID RAIN INCOMING! Blast rocks for bonus scrap!";
        if (chosen === 'pulsar') warnText = "⚠️ WARNING: PULSAR WAVE COLUMN SCANNING THE REGION!";
        
        setCosmicWarningBanner(warnText);
        SynthAudio.playPowerup();
        
        // Auto clear banner after 4.5 seconds
        setTimeout(() => {
          setCosmicWarningBanner(null);
        }, 4500);
      }

      // Update active cosmic event timer
      if (state.cosmicEvent !== 'none') {
        state.cosmicEventTimer = Math.max(0, state.cosmicEventTimer - enemyDt);
        if (state.cosmicEventTimer <= 0) {
          state.cosmicEvent = 'none';
          state.solarFlares = [];
        }
      }

      // 1. SCROLL STARS (warp speed check)
      const starSpeedFactor = state.cosmicEvent === 'warp' ? 5.5 : 1.5;
      state.stars.forEach(star => {
        if (state.cosmicEvent === 'warp') {
          ctx.strokeStyle = `rgba(0, 240, 255, ${star.speed / 3.5})`;
          ctx.lineWidth = star.size;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x, star.y + star.speed * 15);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.speed / 3.5})`;
          ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        star.y += star.speed * starSpeedFactor;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      // Passive Shield Regeneration: Jade Enforcer ('emerald') regenerates 1% health every 1.5 seconds when not dead
      if (upgrades.selectedSkin === 'emerald' && state.shield > 0 && state.shield < state.maxShield) {
        state.shieldRegenTimer += dt;
        if (state.shieldRegenTimer >= 1.5) {
          state.shieldRegenTimer = 0;
          state.shield = Math.min(state.maxShield, state.shield + 1);
          setShield(state.shield);
        }
      }

      // Nanite Repair Hull regeneration (stackable): auto-regenerates shieldRegenBonus capacity every 1.0 second continuously when alive
      if (state.rogueliteBuffs?.shieldRegenBonus > 0 && state.shield > 0 && state.shield < state.maxShield) {
        state.naniteRegenTimer += dt;
        if (state.naniteRegenTimer >= 1.0) {
          state.naniteRegenTimer = 0;
          state.shield = Math.min(state.maxShield, state.shield + state.rogueliteBuffs.shieldRegenBonus);
          setShield(state.shield);
        }
      }

      // Update Power-up timers
      if (player.powerups.invincibility > 0) {
        player.powerups.invincibility = Math.max(0, player.powerups.invincibility - dt);
        setInvincibilityDuration(Math.round(player.powerups.invincibility));
      }
      if (player.powerups.doubleLaser > 0) {
        player.powerups.doubleLaser = Math.max(0, player.powerups.doubleLaser - dt);
        setDoubleDuration(Math.round(player.powerups.doubleLaser));
      }
      if (player.powerups.magnet > 0) {
        player.powerups.magnet = Math.max(0, player.powerups.magnet - dt);
        setMagnetDuration(Math.round(player.powerups.magnet));
      }
      if (player.powerups.timewarp > 0) {
        player.powerups.timewarp = Math.max(0, player.powerups.timewarp - dt);
        setTimewarpDuration(Math.round(player.powerups.timewarp));
      }

      // Decrement multiplier timer
      if (state.multiplierTimer > 0) {
        state.multiplierTimer -= dt;
        if (state.multiplierTimer <= 0) {
          state.multiplier = 1;
        }
      }

      // 2. PLAYER AUTO-FIRE ENGINES
      state.shootTimer += dt;
      // Derived shoot delay from level (Level 1: 0.35s down to Level 8: ~0.084s, clamped at 0.06s minimum)
      let shootDelay = Math.max(0.06, 0.35 - (upgrades.fireRate - 1) * 0.038);
      
      // Apply Viper Strike skin passive: Hyper-Heaters (-15% firing delay, i.e. 15% faster)
      if (upgrades.selectedSkin === 'pink') {
        shootDelay *= 0.85;
      }
      
      // Apply warp rift cosmic event bonus: 35% faster firing speed!
      if (state.cosmicEvent === 'warp') {
        shootDelay *= 0.65;
      }

      // Apply Tank Loadout shooting delay penalty (+30% slower)
      if (state.starterLoadout === 'tank') {
        shootDelay *= 1.30;
      }

      // Apply Roguelite permanent Firing Speed buff (Hyper-Heat Coils)
      if (state.rogueliteBuffs?.fireRateMult) {
        shootDelay *= state.rogueliteBuffs.fireRateMult;
      }

      // Near-Death Desperation Boost (Tension Mechanic)
      const isDesperationActive = state.shield > 0 && state.shield < (state.maxShield * 0.15);
      if (isDesperationActive) {
        if (state.rogueliteBuffs?.desperationUnlocked) {
          shootDelay *= 0.50; // Desperation Overdrive: +100% faster fire rate (0.5x delay)
        } else {
          shootDelay *= 0.70; // Default close-call: +43% faster fire rate (0.7x delay)
        }
      }
      
      if (state.shootTimer >= shootDelay) {
        state.shootTimer = 0;
        const preCount = state.projectiles.length;
        
        const selectedWpn = upgrades.selectedWeapon || 'plasma';
        const wpnLevel = selectedWpn === 'plasma'
          ? (upgrades.weaponPlasmaLevel || upgrades.weaponType || 1)
          : selectedWpn === 'ion'
            ? (upgrades.weaponIonLevel || 1)
            : selectedWpn === 'wave'
              ? (upgrades.weaponWaveLevel || 1)
              : selectedWpn === 'neutron'
                ? (upgrades.weaponNeutronLevel || 1)
                : (upgrades.weaponTeslaLevel || 1);

        const hasDoublePower = player.powerups.doubleLaser > 0;
        const currentWeaponType = hasDoublePower ? Math.max(3, wpnLevel) : wpnLevel;

        // Apply Loadout, Photons, & Desperation damage multipliers
        let baseDamageMult = 1.0;
        if (state.starterLoadout === 'glass') {
          baseDamageMult *= 1.5; // Glass Cannon: +50% laser power!
        }
        if (state.rogueliteBuffs?.damageMult) {
          baseDamageMult *= state.rogueliteBuffs.damageMult; // Photon Amplifier permanent +25%
        }
        if (isDesperationActive && state.rogueliteBuffs?.desperationUnlocked) {
          baseDamageMult *= 2.0; // Desperation Overdrive: 2x weapon output!
        }

        // Critical hit check (incorporating flat crit bonuses)
        const isCrit = Math.random() < ((upgrades.criticalChance || 0) * 0.07 + (state.rogueliteBuffs?.critBonus || 0));
        const damageMult = (isCrit ? 2.0 : 1.0) * baseDamageMult;
        const colorOverride = isCrit ? '#facc15' : null;
        const sizeMultiplier = isCrit ? 1.6 : 1.0;

        if (selectedWpn === 'ion') {
          // ION PULSE SYSTEM
          if (currentWeaponType >= 4) {
            state.projectiles.push(
              { x: player.x + player.width * 0.25, y: player.y, vx: -30, vy: -450, color: colorOverride || '#10b981', size: 8 * sizeMultiplier, damage: 28 * damageMult, fromPlayer: true },
              { x: player.x + player.width * 0.75, y: player.y, vx: 30, vy: -450, color: colorOverride || '#10b981', size: 8 * sizeMultiplier, damage: 28 * damageMult, fromPlayer: true },
              { x: player.x, y: player.y + 12, vx: -110, vy: -400, color: colorOverride || '#059669', size: 6 * sizeMultiplier, damage: 22 * damageMult, fromPlayer: true },
              { x: player.x + player.width, y: player.y + 12, vx: 110, vy: -400, color: colorOverride || '#059669', size: 6 * sizeMultiplier, damage: 22 * damageMult, fromPlayer: true }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 3) {
            state.projectiles.push(
              { x: player.x + player.width / 2, y: player.y, vx: 0, vy: -450, color: colorOverride || '#10b981', size: 7.5 * sizeMultiplier, damage: 26 * damageMult, fromPlayer: true },
              { x: player.x + player.width / 4, y: player.y + 10, vx: -80, vy: -420, color: colorOverride || '#059669', size: 5.5 * sizeMultiplier, damage: 20 * damageMult, fromPlayer: true },
              { x: player.x + (player.width * 3) / 4, y: player.y + 10, vx: 80, vy: -420, color: colorOverride || '#059669', size: 5.5 * sizeMultiplier, damage: 20 * damageMult, fromPlayer: true }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 2) {
            state.projectiles.push(
              { x: player.x + player.width * 0.2, y: player.y, vx: 0, vy: -450, color: colorOverride || '#10b981', size: 7 * sizeMultiplier, damage: 25 * damageMult, fromPlayer: true },
              { x: player.x + player.width * 0.8, y: player.y, vx: 0, vy: -450, color: colorOverride || '#10b981', size: 7 * sizeMultiplier, damage: 25 * damageMult, fromPlayer: true }
            );
            SynthAudio.playPowerShoot();
          } else {
            state.projectiles.push({
              x: player.x + player.width / 2,
              y: player.y,
              vx: 0,
              vy: -450,
              color: colorOverride || '#10b981',
              size: 8.5 * sizeMultiplier,
              damage: 38 * damageMult,
              fromPlayer: true
            });
            SynthAudio.playPowerShoot();
          }
        } else if (selectedWpn === 'wave') {
          // WAVE BEAM SYSTEM
          if (currentWeaponType >= 4) {
            state.projectiles.push(
              { x: player.x + player.width * 0.25, y: player.y, vx: -20, vy: -550, color: colorOverride || '#a855f7', size: 5 * sizeMultiplier, damage: 18 * damageMult, fromPlayer: true, isWave: true, wavePhase: 0, waveAmp: 45 },
              { x: player.x + player.width * 0.75, y: player.y, vx: 20, vy: -550, color: colorOverride || '#a855f7', size: 5 * sizeMultiplier, damage: 18 * damageMult, fromPlayer: true, isWave: true, wavePhase: Math.PI, waveAmp: 45 },
              { x: player.x, y: player.y + 12, vx: -130, vy: -500, color: colorOverride || '#c084fc', size: 4 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true, isWave: true, wavePhase: Math.PI / 2, waveAmp: 30 },
              { x: player.x + player.width, y: player.y + 12, vx: 130, vy: -500, color: colorOverride || '#c084fc', size: 4 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true, isWave: true, wavePhase: (Math.PI * 3) / 2, waveAmp: 30 }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 3) {
            state.projectiles.push(
              { x: player.x + player.width / 2, y: player.y, vx: 0, vy: -550, color: colorOverride || '#a855f7', size: 4.5 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true, isWave: true, wavePhase: 0, waveAmp: 40 },
              { x: player.x + player.width / 4, y: player.y + 10, vx: -90, vy: -520, color: colorOverride || '#c084fc', size: 3.5 * sizeMultiplier, damage: 13 * damageMult, fromPlayer: true, isWave: true, wavePhase: (Math.PI * 2) / 3, waveAmp: 25 },
              { x: player.x + (player.width * 3) / 4, y: player.y + 10, vx: 90, vy: -520, color: colorOverride || '#c084fc', size: 3.5 * sizeMultiplier, damage: 13 * damageMult, fromPlayer: true, isWave: true, wavePhase: (Math.PI * 4) / 3, waveAmp: 25 }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 2) {
            state.projectiles.push(
              { x: player.x + player.width * 0.2, y: player.y, vx: 0, vy: -550, color: colorOverride || '#a855f7', size: 4.5 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true, isWave: true, wavePhase: 0, waveAmp: 35 },
              { x: player.x + player.width * 0.8, y: player.y, vx: 0, vy: -550, color: colorOverride || '#a855f7', size: 4.5 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true, isWave: true, wavePhase: Math.PI, waveAmp: 35 }
            );
            SynthAudio.playShoot();
          } else {
            state.projectiles.push({
              x: player.x + player.width / 2,
              y: player.y,
              vx: 0,
              vy: -550,
              color: colorOverride || '#a855f7',
              size: 5 * sizeMultiplier,
              damage: 22 * damageMult,
              fromPlayer: true,
              isWave: true,
              wavePhase: 0,
              waveAmp: 40
            });
            SynthAudio.playShoot();
          }
        } else if (selectedWpn === 'neutron') {
          // NEUTRON FLARE SYSTEM (Orange heavy spliter)
          if (currentWeaponType >= 4) {
            state.projectiles.push(
              { x: player.x + player.width * 0.1, y: player.y + 10, vx: -100, vy: -380, color: colorOverride || '#f59e0b', size: 4.5 * sizeMultiplier, damage: 22 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + player.width * 0.35, y: player.y, vx: -30, vy: -420, color: colorOverride || '#f97316', size: 5.5 * sizeMultiplier, damage: 28 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + player.width * 0.65, y: player.y, vx: 30, vy: -420, color: colorOverride || '#f97316', size: 5.5 * sizeMultiplier, damage: 28 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + player.width * 0.9, y: player.y + 10, vx: 100, vy: -380, color: colorOverride || '#f59e0b', size: 4.5 * sizeMultiplier, damage: 22 * damageMult, fromPlayer: true, isNeutron: true }
            );
            SynthAudio.playNeutronShoot();
          } else if (currentWeaponType === 3) {
            state.projectiles.push(
              { x: player.x + player.width / 2, y: player.y, vx: 0, vy: -420, color: colorOverride || '#f97316', size: 5.5 * sizeMultiplier, damage: 32 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + player.width / 4, y: player.y + 8, vx: -60, vy: -400, color: colorOverride || '#f59e0b', size: 4.5 * sizeMultiplier, damage: 25 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + (player.width * 3) / 4, y: player.y + 8, vx: 60, vy: -400, color: colorOverride || '#f59e0b', size: 4.5 * sizeMultiplier, damage: 25 * damageMult, fromPlayer: true, isNeutron: true }
            );
            SynthAudio.playNeutronShoot();
          } else if (currentWeaponType === 2) {
            state.projectiles.push(
              { x: player.x + player.width * 0.2, y: player.y, vx: -20, vy: -420, color: colorOverride || '#f59e0b', size: 5.5 * sizeMultiplier, damage: 35 * damageMult, fromPlayer: true, isNeutron: true },
              { x: player.x + player.width * 0.8, y: player.y, vx: 20, vy: -420, color: colorOverride || '#f59e0b', size: 5.5 * sizeMultiplier, damage: 35 * damageMult, fromPlayer: true, isNeutron: true }
            );
            SynthAudio.playNeutronShoot();
          } else {
            state.projectiles.push({
              x: player.x + player.width / 2,
              y: player.y,
              vx: 0,
              vy: -420,
              color: colorOverride || '#f59e0b',
              size: 6.5 * sizeMultiplier,
              damage: 45 * damageMult,
              fromPlayer: true,
              isNeutron: true
            });
            SynthAudio.playNeutronShoot();
          }
        } else if (selectedWpn === 'tesla') {
          // TESLA VOLT SYSTEM (Pink electrical chain lightning)
          if (currentWeaponType >= 4) {
            state.projectiles.push(
              { x: player.x + player.width * 0.15, y: player.y + 10, vx: -110, vy: -650, color: colorOverride || '#db2777', size: 2.5 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: 0 },
              { x: player.x + player.width * 0.38, y: player.y, vx: -30, vy: -720, color: colorOverride || '#f472b6', size: 3 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: Math.PI / 3 },
              { x: player.x + player.width * 0.62, y: player.y, vx: 30, vy: -720, color: colorOverride || '#f472b6', size: 3 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: (2 * Math.PI) / 3 },
              { x: player.x + player.width * 0.85, y: player.y + 10, vx: 110, vy: -650, color: colorOverride || '#db2777', size: 2.5 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: Math.PI }
            );
            SynthAudio.playTeslaShoot();
          } else if (currentWeaponType === 3) {
            state.projectiles.push(
              { x: player.x + player.width / 2, y: player.y, vx: 0, vy: -720, color: colorOverride || '#f472b6', size: 3 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: 0 },
              { x: player.x + player.width / 5, y: player.y + 8, vx: -70, vy: -680, color: colorOverride || '#db2777', size: 2.5 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: Math.PI / 2 },
              { x: player.x + (player.width * 4) / 5, y: player.y + 8, vx: 70, vy: -680, color: colorOverride || '#db2777', size: 2.5 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: -Math.PI / 2 }
            );
            SynthAudio.playTeslaShoot();
          } else if (currentWeaponType === 2) {
            state.projectiles.push(
              { x: player.x + player.width * 0.25, y: player.y, vx: -15, vy: -700, color: colorOverride || '#ec4899', size: 3 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: 0 },
              { x: player.x + player.width * 0.75, y: player.y, vx: 15, vy: -700, color: colorOverride || '#ec4899', size: 3 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true, isTesla: true, teslaPhase: Math.PI }
            );
            SynthAudio.playTeslaShoot();
          } else {
            state.projectiles.push({
              x: player.x + player.width / 2,
              y: player.y,
              vx: 0,
              vy: -700,
              color: colorOverride || '#ec4899',
              size: 3.5 * sizeMultiplier,
              damage: 22 * damageMult,
              fromPlayer: true,
              isTesla: true,
              teslaPhase: 0
            });
            SynthAudio.playTeslaShoot();
          }
        } else {
          // PLASMA LASER SYSTEM (Default)
          if (currentWeaponType >= 4) {
            state.projectiles.push(
              { x: player.x + player.width * 0.25, y: player.y, vx: -40, vy: -650, color: colorOverride || '#ec4899', size: 4.5 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true },
              { x: player.x + player.width * 0.75, y: player.y, vx: 40, vy: -650, color: colorOverride || '#ec4899', size: 4.5 * sizeMultiplier, damage: 16 * damageMult, fromPlayer: true },
              { x: player.x, y: player.y + 12, vx: -160, vy: -580, color: colorOverride || '#f43f5e', size: 3.5 * sizeMultiplier, damage: 14 * damageMult, fromPlayer: true },
              { x: player.x + player.width, y: player.y + 12, vx: 160, vy: -580, color: colorOverride || '#f43f5e', size: 3.5 * sizeMultiplier, damage: 14 * damageMult, fromPlayer: true }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 3) {
            state.projectiles.push(
              { x: player.x + player.width / 2, y: player.y, vx: 0, vy: -650, color: colorOverride || '#3b82f6', size: 4 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true },
              { x: player.x + player.width / 4, y: player.y + 10, vx: -120, vy: -600, color: colorOverride || '#60a5fa', size: 3 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true },
              { x: player.x + (player.width * 3) / 4, y: player.y + 10, vx: 120, vy: -600, color: colorOverride || '#60a5fa', size: 3 * sizeMultiplier, damage: 12 * damageMult, fromPlayer: true }
            );
            SynthAudio.playPowerShoot();
          } else if (currentWeaponType === 2) {
            state.projectiles.push(
              { x: player.x + player.width * 0.2, y: player.y, vx: 0, vy: -650, color: colorOverride || player.color, size: 3.5 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true },
              { x: player.x + player.width * 0.8, y: player.y, vx: 0, vy: -650, color: colorOverride || player.color, size: 3.5 * sizeMultiplier, damage: 15 * damageMult, fromPlayer: true }
            );
            SynthAudio.playShoot();
          } else {
            state.projectiles.push({
              x: player.x + player.width / 2,
              y: player.y,
              vx: 0,
              vy: -650,
              color: colorOverride || player.color,
              size: 4 * sizeMultiplier,
              damage: 20 * damageMult,
              fromPlayer: true
            });
            SynthAudio.playShoot();
          }
        }

        const postCount = state.projectiles.length;
        if (hasDoublePower && postCount > preCount) {
          const added = state.projectiles.slice(preCount);
          for (let i = 0; i < added.length; i++) {
            const p = added[i];
            // Offset the original projectile slightly to the left
            p.x -= 6;
            // Add a duplicated projectile slightly to the right
            state.projectiles.push({
              ...p,
              x: p.x + 12, // since p.x has been subtracted by 6, p.x + 12 is original x + 6
            });
          }
        }
      }

      // Companion Sentry Drone Auto-fire Update
      if (upgrades.companionDrone && upgrades.companionDrone > 0) {
        state.droneShootTimer += dt;
        const droneDelay = upgrades.companionDrone === 4 ? 0.22 : (upgrades.companionDrone === 3 ? 0.28 : (upgrades.companionDrone === 2 ? 0.35 : 0.45));
        if (state.droneShootTimer >= droneDelay) {
          state.droneShootTimer = 0;

          const fireDroneLaser = (droneX: number, droneY: number, clr: string, dmg: number) => {
            // Smart target: closest enemy in range
            let target: any = null;
            let minDist = 350; // max track range
            state.enemies.forEach(enemy => {
              if (enemy.y > 0 && enemy.y < height) {
                const dist = Math.hypot((enemy.x + enemy.width / 2) - droneX, (enemy.y + enemy.height / 2) - droneY);
                if (dist < minDist) {
                  minDist = dist;
                  target = enemy;
                }
              }
            });

            let vx = 0;
            let vy = -650;
            if (target) {
              const angle = Math.atan2((target.y + target.height / 2) - droneY, (target.x + target.width / 2) - droneX);
              vx = Math.cos(angle) * 650;
              vy = Math.sin(angle) * 650;
            }

            state.projectiles.push({
              x: droneX,
              y: droneY,
              vx,
              vy,
              color: clr,
              size: upgrades.companionDrone >= 4 ? 4.5 : (upgrades.companionDrone === 3 ? 4 : 2.5),
              damage: dmg,
              fromPlayer: true
            });
          };

          const droneAngle = (timestamp / 240);
          const droneRadius = 38;
          const playerCenterX = player.x + player.width / 2;
          const playerCenterY = player.y + player.height / 2;

          if (upgrades.companionDrone >= 4) {
            // Triple sentries firing simultaneously! (arranged at 120 degree angles)
            const dx1 = playerCenterX + Math.cos(droneAngle) * droneRadius;
            const dy1 = playerCenterY + Math.sin(droneAngle) * droneRadius;
            const dx2 = playerCenterX + Math.cos(droneAngle + (Math.PI * 2) / 3) * droneRadius;
            const dy2 = playerCenterY + Math.sin(droneAngle + (Math.PI * 2) / 3) * droneRadius;
            const dx3 = playerCenterX + Math.cos(droneAngle + (Math.PI * 4) / 3) * droneRadius;
            const dy3 = playerCenterY + Math.sin(droneAngle + (Math.PI * 4) / 3) * droneRadius;

            fireDroneLaser(dx1, dy1, '#a855f7', 22); // Purple fusion fire!
            fireDroneLaser(dx2, dy2, '#a855f7', 22);
            fireDroneLaser(dx3, dy3, '#a855f7', 22);
            SynthAudio.playPowerShoot();
          } else if (upgrades.companionDrone === 3) {
            // Dual sentries firing simultaneously!
            const dx1 = playerCenterX + Math.cos(droneAngle) * droneRadius;
            const dy1 = playerCenterY + Math.sin(droneAngle) * droneRadius;
            const dx2 = playerCenterX + Math.cos(droneAngle + Math.PI) * droneRadius;
            const dy2 = playerCenterY + Math.sin(droneAngle + Math.PI) * droneRadius;

            fireDroneLaser(dx1, dy1, '#ec4899', 18);
            fireDroneLaser(dx2, dy2, '#ec4899', 18);
            SynthAudio.playPowerShoot();
          } else {
            // Single sentry firing!
            const dx = playerCenterX + Math.cos(droneAngle) * droneRadius;
            const dy = playerCenterY + Math.sin(droneAngle) * droneRadius;
            const clr = upgrades.companionDrone === 2 ? '#f59e0b' : '#10b981';
            const dmg = upgrades.companionDrone === 2 ? 14 : 10;

            fireDroneLaser(dx, dy, clr, dmg);
            SynthAudio.playShoot();
          }
        }
      }

      // Draw player trail
      ctx.fillStyle = player.trailColor;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y + player.height + 15);
      ctx.lineTo(player.x + 3, player.y + player.height);
      ctx.lineTo(player.x + player.width - 3, player.y + player.height);
      ctx.closePath();
      ctx.fill();

      // Draw Player Ship
      ctx.shadowBlur = 10;
      ctx.shadowColor = player.color;
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y); // Top nose
      ctx.lineTo(player.x, player.y + player.height); // Bottom left wing
      ctx.lineTo(player.x + player.width / 2, player.y + player.height * 0.75); // Inner back indent
      ctx.lineTo(player.x + player.width, player.y + player.height); // Bottom right wing
      ctx.closePath();
      ctx.fill();

      // Draw Companion Sentry Drone(s) Visuals
      if (upgrades.companionDrone && upgrades.companionDrone > 0) {
        const droneAngle = (timestamp / 240); // rotating angle
        const droneRadius = 38;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const drawDrone = (dx: number, dy: number, clr: string) => {
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = clr;
          ctx.fillStyle = clr;
          
          // Outer diamond ring
          ctx.strokeStyle = clr;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dx, dy - 6);
          ctx.lineTo(dx + 6, dy);
          ctx.lineTo(dx, dy + 6);
          ctx.lineTo(dx - 6, dy);
          ctx.closePath();
          ctx.stroke();

          // Central core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(dx, dy, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        if (upgrades.companionDrone >= 4) {
          // Triple Sentries
          const dx1 = playerCenterX + Math.cos(droneAngle) * droneRadius;
          const dy1 = playerCenterY + Math.sin(droneAngle) * droneRadius;
          const dx2 = playerCenterX + Math.cos(droneAngle + (Math.PI * 2) / 3) * droneRadius;
          const dy2 = playerCenterY + Math.sin(droneAngle + (Math.PI * 2) / 3) * droneRadius;
          const dx3 = playerCenterX + Math.cos(droneAngle + (Math.PI * 4) / 3) * droneRadius;
          const dy3 = playerCenterY + Math.sin(droneAngle + (Math.PI * 4) / 3) * droneRadius;

          drawDrone(dx1, dy1, '#a855f7'); // Sentry 1 (Purple)
          drawDrone(dx2, dy2, '#a855f7'); // Sentry 2 (Purple)
          drawDrone(dx3, dy3, '#a855f7'); // Sentry 3 (Purple)
        } else if (upgrades.companionDrone === 3) {
          // Dual Sentries
          const dx1 = playerCenterX + Math.cos(droneAngle) * droneRadius;
          const dy1 = playerCenterY + Math.sin(droneAngle) * droneRadius;
          const dx2 = playerCenterX + Math.cos(droneAngle + Math.PI) * droneRadius;
          const dy2 = playerCenterY + Math.sin(droneAngle + Math.PI) * droneRadius;

          drawDrone(dx1, dy1, '#ec4899'); // Sentry 1 (Pink)
          drawDrone(dx2, dy2, '#ec4899'); // Sentry 2 (Pink)
        } else {
          // Single Sentry
          const dx = playerCenterX + Math.cos(droneAngle) * droneRadius;
          const dy = playerCenterY + Math.sin(droneAngle) * droneRadius;
          const clr = upgrades.companionDrone === 2 ? '#f59e0b' : '#10b981'; // Yellow vs Emerald

          drawDrone(dx, dy, clr);
        }
      }

      // Draw shield active ring if invincible
      if (player.powerups.invincibility > 0) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // reset shadow

      // 3. SPAWN ENEMIES
      if (isTutorial) {
        // Handle Tutorial step-by-step state machine with manual progression
        const player = state.player;
        if (state.tutorialStep === 0) {
          // Movement training: trigger step 1 once the player moves away from the initial location
          if (player.x !== 180 || player.y !== 500) {
            state.tutorialProgressCount += dt;
            if (state.tutorialProgressCount >= 1.2) {
              state.tutorialPhaseCleared = true;
            }
          }
        } else if (state.tutorialStep === 1) {
          // Shooting practice: Advance to salvage once all targets are cleared
          if (state.enemies.length === 0) {
            state.tutorialPhaseCleared = true;
          }
        } else if (state.tutorialStep === 2) {
          // Salvage practice: Advance to upgrades once they harvest 3 scraps
          if (state.tutorialProgressCount >= 3) {
            state.tutorialPhaseCleared = true;
          }
        } else if (state.tutorialStep === 3) {
          // Power-up training: Advance if they pick up items
          if (player.powerups.doubleLaser > 0 || state.shield > 100 || state.tutorialProgressCount >= 1) {
            state.tutorialPhaseCleared = true;
          }
        } else if (state.tutorialStep === 4) {
          // Graduation phase: wait for manual click to complete
          state.tutorialPhaseCleared = true;
        }
      } else {
        if (state.storyMode === 'story') {
          // --- STORY MODE SPAWNING ---
          if (state.storyShowingDialogue || state.storyChapterTransition) {
            state.spawnTimer = 0;
          } else {
            state.spawnTimer += enemyDt;
            
            if (state.storyWave < 3) {
              const maxOnScreen = 4;
              const currentOnScreen = state.enemies.filter(e => e.type !== 'boss').length;
              const waveSpawnInterval = state.storyChapter === 5 ? 1.0 : 1.35;
              
              if (currentOnScreen < maxOnScreen && state.spawnTimer >= waveSpawnInterval && state.storyKillsThisWave + currentOnScreen < state.storyKillGoal) {
                state.spawnTimer = 0;
                
                let type: Enemy['type'] = 'scout';
                let color = '#22c55e'; // Green
                let hp = 20;
                
                const rand = Math.random();
                if (state.storyChapter >= 3 && rand < 0.25) {
                  type = 'bomber';
                  color = '#a855f7'; // Purple
                  hp = 65;
                } else if (state.storyChapter >= 2 && rand < 0.5) {
                  type = 'speeder';
                  color = '#f472b6'; // Pink
                  hp = 12;
                }
                
                const chMult = 1 + (state.storyChapter - 1) * 0.35;
                hp = Math.round(hp * chMult);
                
                let enemySpeed = type === 'speeder' ? 240 : (type === 'bomber' ? 85 : 130);
                
                state.enemies.push({
                  id: state.nextEnemyId++,
                  x: 20 + Math.random() * (width - 60),
                  y: -50,
                  width: type === 'bomber' ? 40 : (type === 'speeder' ? 24 : 30),
                  height: type === 'bomber' ? 40 : (type === 'speeder' ? 24 : 30),
                  speed: enemySpeed,
                  type,
                  color,
                  health: hp,
                  maxHealth: hp,
                  shootCooldown: 0.5 + Math.random() * 1.5,
                  phase: Math.random() * 10,
                  phaseSpeed: type === 'speeder' ? 3.5 : 1.5,
                  isHyperCharged: state.storyChapter === 5
                });
              }
            } else {
              // Boss wave!
              if (!state.storyBossSpawned && state.enemies.length === 0) {
                state.storyBossSpawned = true;
                
                let bName = 'GIGA-CLUCK VANGUARD';
                let bColor = '#ef4444'; // Red
                let bHp = 400 + (state.storyChapter - 1) * 350;
                let bSpeed = 60 + (state.storyChapter - 1) * 10;
                let bCooldown = 1.0 - (state.storyChapter - 1) * 0.08;
                
                if (state.storyChapter === 2) {
                  bName = 'CYBER-HEN EMPRESS';
                  bColor = '#fbbf24'; // Amber Gold
                } else if (state.storyChapter === 3) {
                  bName = 'THE ROOSTER DECIMATOR';
                  bColor = '#ec4899'; // Fuchsia
                } else if (state.storyChapter === 4) {
                  bName = 'CYAN CLUCK SINGULARITY';
                  bColor = '#06b6d4'; // Cyan
                } else if (state.storyChapter === 5) {
                  bName = 'OMEGA NEON CHICKEN GOD';
                  bColor = '#10b981'; // Emerald Green
                }
                
                state.enemies.push({
                  id: state.nextEnemyId++,
                  x: width / 2 - 45,
                  y: -100,
                  width: 90,
                  height: 70,
                  speed: bSpeed,
                  type: 'boss',
                  color: bColor,
                  health: bHp,
                  maxHealth: bHp,
                  shootCooldown: bCooldown,
                  phase: 0,
                  phaseSpeed: 1.0,
                  bossIndex: state.storyChapter,
                  isHyperCharged: state.storyChapter === 5
                });
                
                setBossName(bName);
                setBossActive(true);
                setBossHealthPercent(100);
              }
            }
          }
        } else {
          // --- NORMAL ARCADE MODE SPAWNING ---
          state.spawnTimer += enemyDt;
          // Tempered spawn interval starts at 1.85s, and fastens down to 0.95s (instead of 0.65s) to reduce overwhelming chaos
          const baseSpawnInterval = Math.max(0.95, 1.85 - (state.score / 12000) * 0.9);

          // Dynamic difficulty multiplier starts scaling after score 3,000 onwards for smooth health progression
          const difficultyMult = state.score >= 3000
            ? 1 + ((state.score - 3000) / 6000) * 0.45 // +45% health every 6k score
            : 1;
          const isHyperCharged = state.score >= 100000;

          // Spawn solar flares during Solar Flare event!
          if (state.cosmicEvent === 'solar' && Math.random() < 0.025) {
            state.solarFlares.push({
              x: Math.random() * width,
              y: -20,
              r: 15 + Math.random() * 20,
              speed: 80 + Math.random() * 80
            });
          }

          // Spawn asteroids during Asteroid Rain event!
          if (state.cosmicEvent === 'asteroid' && Math.random() < 0.08) {
            const size = 32 + Math.random() * 24;
            const astHp = Math.round(30 * difficultyMult);
            const astSpeed = (120 + Math.random() * 90) * (1 + (difficultyMult - 1) * 0.4);

            state.enemies.push({
              id: state.nextEnemyId++,
              x: 20 + Math.random() * (width - size - 40),
              y: -50,
              width: size,
              height: size,
              speed: astSpeed,
              type: 'asteroid' as any,
              color: '#d97706', // amber magma
              health: astHp,
              maxHealth: astHp,
              shootCooldown: 9999, // asteroids don't shoot!
              phase: Math.random() * 10,
              phaseSpeed: 0.5,
              isHyperCharged
            });
          }

          // Spawn normal enemies
          if (state.spawnTimer >= baseSpawnInterval) {
            state.spawnTimer = 0;
            const enemyTypeRand = Math.random();
            let type: Enemy['type'] = 'scout';
            let color = '#22c55e'; // neon green
            let hp = 20;

            if (enemyTypeRand < 0.15 && state.score > 300) {
              type = 'bomber';
              color = '#8b5cf6'; // intense purple
              hp = 60;
            } else if (enemyTypeRand < 0.40) {
              type = 'speeder';
              color = '#ec4899'; // pink
              hp = 10;
            }

            const scaledHp = Math.round(hp * difficultyMult);
            let scaledSpeed = type === 'speeder' 
              ? 260 * (1 + (difficultyMult - 1) * 0.4) 
              : (type === 'bomber' ? 90 : 140) * (1 + (difficultyMult - 1) * 0.55);
            
            // Clamp speed to avoid insane warp speeds
            scaledSpeed = Math.min(scaledSpeed, type === 'speeder' ? 450 : 300);

            const size = type === 'bomber' ? 40 : (type === 'speeder' ? 24 : 30);
            state.enemies.push({
              id: state.nextEnemyId++,
              x: 20 + Math.random() * (width - 60),
              y: -50,
              width: size,
              height: size,
              speed: scaledSpeed,
              type,
              color,
              health: scaledHp,
              maxHealth: scaledHp,
              shootCooldown: Math.random() * 1.5,
              phase: Math.random() * 10,
              phaseSpeed: (type === 'speeder' ? 3.5 : 1.5) * (1 + (difficultyMult - 1) * 0.2),
              isHyperCharged
            });
          }

          // Boss Spawner milestone: every 1500 score points if boss is not active and cooldown completed
          const desiredBosses = Math.floor(state.score / 1500);
          const isBossCurrentlyActive = state.enemies.some(e => e.type === 'boss');
          if (desiredBosses > state.bossSpawnedCount && !isBossCurrentlyActive && state.bossCooldownTimer <= 0) {
            state.bossSpawnedCount++;
            
            let bName = 'NEON VANGUARD';
            let bColor = '#ef4444'; // Hot Red
            let bHp = 400;
            let bSpeed = 60;
            let bCooldown = 1.0;
            
            const bIndex = state.bossSpawnedCount;
            if (bIndex === 2) {
              bName = 'CYBER CRUSADER';
              bColor = '#f59e0b'; // Amber Gold
              bHp = 650;
              bSpeed = 70;
              bCooldown = 0.9;
            } else if (bIndex === 3) {
              bName = 'PULSE EXECUTIONER';
              bColor = '#d946ef'; // Fuchsia
              bHp = 900;
              bSpeed = 75;
              bCooldown = 0.8;
            } else if (bIndex === 4) {
              bName = 'AETHER SINGULARITY';
              bColor = '#3b82f6'; // Bright Blue
              bHp = 1200;
              bSpeed = 85;
              bCooldown = 0.7;
            } else if (bIndex >= 5) {
              bName = 'OMEGA NEON ARCHITECT';
              bColor = '#10b981'; // Emerald Green
              bHp = 1600 + (bIndex - 5) * 400;
              bSpeed = 95;
              bCooldown = 0.6;
            }

            // Apply Hypercharged Boss Scaling
            const isBossHyperCharged = state.score >= 100000;
            let finalHp = bHp;
            let finalSpeed = bSpeed;
            let finalCooldown = bCooldown;
            let finalName = bName;

            if (isBossHyperCharged) {
              finalName = `⚠️ HYPER ${bName}`;
              finalHp = Math.round(bHp * difficultyMult);
              finalSpeed = bSpeed * (1 + (difficultyMult - 1) * 0.3);
              finalCooldown = bCooldown / (1 + (difficultyMult - 1) * 0.4);
            }

            state.enemies.push({
              id: state.nextEnemyId++,
              x: width / 2 - 45,
              y: -100,
              width: 90,
              height: 70,
              speed: finalSpeed,
              type: 'boss',
              color: bColor,
              health: finalHp,
              maxHealth: finalHp,
              shootCooldown: finalCooldown,
              phase: 0,
              phaseSpeed: 1.0,
              bossIndex: bIndex,
              isHyperCharged: isBossHyperCharged
            });
            
            setBossName(finalName);
            setBossActive(true);
            setBossHealthPercent(100);
          }
        }
      }

      // 4. UPDATE ENEMIES
      const bossEnemy = state.enemies.find(e => e.type === 'boss');
      if (!bossEnemy && bossActive) {
        setBossActive(false);
      }

      state.enemies = state.enemies.filter(enemy => {
        enemy.phase += enemy.phaseSpeed * enemyDt;

        // Custom motion patterns
        if (enemy.type === 'boss') {
          // Boss slides down to y=80, then glides back and forth
          if (enemy.y < 85) {
            enemy.y += enemy.speed * enemyDt;
          } else {
            enemy.x += Math.sin(enemy.phase) * enemy.speed * 1.4 * enemyDt;
            // Bound inside screen
            if (enemy.x < 10) enemy.x = 10;
            if (enemy.x > width - enemy.width - 10) enemy.x = width - enemy.width - 10;
          }
          
          // Update Bullet Hell Phase for Boss 3 (Pulse Executioner)
          const bIdx = enemy.bossIndex || 1;
          if (bIdx === 3) {
            const healthPct = enemy.health / enemy.maxHealth;
            if (healthPct <= 0.55 && !enemy.bulletHellPhaseTriggered) {
              enemy.bulletHellPhaseTriggered = true;
              enemy.bulletHellTimer = 8.0; // 8 seconds of absolute survival
              enemy.isImmune = true;
              setCosmicWarningBanner("🚨 WARNING: CORE OVERLOAD INITIATED! SURVIVE FOR 8 SECONDS!");
              SynthAudio.playPowerup();
            }

            if (enemy.bulletHellTimer > 0) {
              enemy.bulletHellTimer -= enemyDt;
              if (enemy.bulletHellTimer <= 0) {
                enemy.isImmune = false;
                setCosmicWarningBanner("✅ BOSS DEFENSIVE BARRIER DEPLETED! WEAPONS SYSTEM COMPROMISED!");
                setTimeout(() => setCosmicWarningBanner(null), 3500);
              }
            }
          }

          // Update UI
          setBossHealthPercent(Math.max(0, Math.round((enemy.health / enemy.maxHealth) * 100)));
          setBossImmune(!!enemy.isImmune);

           // Boss weapons
          enemy.shootCooldown -= enemyDt;
          if (enemy.shootCooldown <= 0) {
            const bIdx = enemy.bossIndex || 1;
            const bossCenterX = enemy.x + enemy.width / 2;
            const bossBottomY = enemy.y + enemy.height - 10;
            const playerCenterX = player.x + player.width / 2;

            if (bIdx === 1) {
              // Boss 1: Neon Vanguard - 5-bullet fan wave
              enemy.shootCooldown = 1.0 + Math.random() * 0.8;
              const angles = [-0.3, -0.15, 0, 0.15, 0.3];
              angles.forEach(ang => {
                state.projectiles.push({
                  x: bossCenterX,
                  y: bossBottomY,
                  vx: Math.sin(ang) * 180,
                  vy: 240,
                  color: '#ef4444',
                  size: 5,
                  damage: 15,
                  fromPlayer: false
                });
              });
            } else if (bIdx === 2) {
              // Boss 2: Cyber Crusader - Triple central shot + tracking side plasma orbs
              enemy.shootCooldown = 1.1 + Math.random() * 0.7;
              
              // Triple center
              const angles = [-0.1, 0, 0.1];
              angles.forEach(ang => {
                state.projectiles.push({
                  x: bossCenterX,
                  y: bossBottomY,
                  vx: Math.sin(ang) * 220,
                  vy: 280,
                  color: '#f59e0b',
                  size: 5,
                  damage: 12,
                  fromPlayer: false
                });
              });

              // Left/Right tracking plasma orbs
              const xOffsets = [-enemy.width * 0.35, enemy.width * 0.35];
              xOffsets.forEach(offsetX => {
                const spawnX = bossCenterX + offsetX;
                const dx = playerCenterX - spawnX;
                const vx = Math.max(-120, Math.min(120, dx * 0.65));
                state.projectiles.push({
                  x: spawnX,
                  y: bossBottomY - 15,
                  vx,
                  vy: 200,
                  color: '#fbbf24', // golden yellow glow
                  size: 7.5,
                  damage: 18,
                  fromPlayer: false
                });
              });
            } else if (bIdx === 3) {
              // Boss 3: Pulse Executioner - Rapid Spiral Vortex!
              if (enemy.bulletHellTimer > 0) {
                // Kinetic overcharge bullet hell: 3x faster, massive spiral of gold stars!
                enemy.shootCooldown = 0.095;
                const baseAngle = enemy.phase * 5.8 + Math.sin(timestamp / 120) * 1.5;
                const prCount = 5;
                for (let j = 0; j < prCount; j++) {
                  const ang = baseAngle + (j * Math.PI * 2) / prCount;
                  state.projectiles.push({
                    x: bossCenterX,
                    y: bossBottomY - 10,
                    vx: Math.sin(ang) * 210,
                    vy: Math.cos(ang) * 210 + 30, // slow descent
                    color: '#fbbf24', // Gold lightning glow
                    size: 5,
                    damage: 12,
                    fromPlayer: false
                  });
                }
              } else {
                enemy.shootCooldown = 0.35; // rapid fire
                const baseAngle = enemy.phase * 3.14;
                const prCount = 4;
                for (let i = 0; i < prCount; i++) {
                  const ang = baseAngle + (i * Math.PI * 2) / prCount;
                  state.projectiles.push({
                    x: bossCenterX,
                    y: bossBottomY - 10,
                    vx: Math.sin(ang) * 190,
                    vy: Math.cos(ang) * 190 + 90, // bias downwards
                    color: '#d946ef',
                    size: 4.5,
                    damage: 10,
                    fromPlayer: false
                  });
                }
              }
            } else if (bIdx === 4) {
              // Boss 4: Aether Singularity - Alternates between Expanding Rings and Sniper shots
              const statePulse = Math.floor(enemy.phase * 1.5) % 2;
              if (statePulse === 0) {
                // Expanding Ring
                enemy.shootCooldown = 1.4;
                const count = 8;
                for (let i = 0; i < count; i++) {
                  const theta = (i * Math.PI * 2) / count;
                  state.projectiles.push({
                    x: bossCenterX,
                    y: bossBottomY - 15,
                    vx: Math.cos(theta) * 170,
                    vy: Math.sin(theta) * 170 + 70,
                    color: '#3b82f6',
                    size: 5.5,
                    damage: 15,
                    fromPlayer: false
                  });
                }
              } else {
                // Fast double targeted sniping lasers
                enemy.shootCooldown = 1.0;
                const xOffsets = [-15, 15];
                xOffsets.forEach(offX => {
                  const sX = bossCenterX + offX;
                  const targetDx = playerCenterX - sX;
                  // target trajectory
                  const speedTotal = 360;
                  const targetDy = Math.max(100, player.y - bossBottomY);
                  const dist = Math.hypot(targetDx, targetDy);
                  const vx = (targetDx / dist) * speedTotal;
                  const vy = (targetDy / dist) * speedTotal;
                  state.projectiles.push({
                    x: sX,
                    y: bossBottomY,
                    vx,
                    vy,
                    color: '#60a5fa',
                    size: 4,
                    damage: 20,
                    fromPlayer: false
                  });
                });
              }
            } else {
              // Boss 5+: Omega Neon Architect - bullet hell finale!
              // Randomly triggers vortex or sweeping wall lasers + slow homing plasma sphere!
              const weaponMode = Math.floor(enemy.phase * 0.8) % 3;
              
              if (weaponMode === 0) {
                // Rapid targeted sweep
                enemy.shootCooldown = 0.22;
                const sweepAngle = Math.sin(timestamp / 160) * 0.45;
                state.projectiles.push({
                  x: bossCenterX + Math.sin(timestamp / 50) * 20,
                  y: bossBottomY,
                  vx: Math.sin(sweepAngle) * 230,
                  vy: 290,
                  color: '#10b981',
                  size: 5,
                  damage: 12,
                  fromPlayer: false
                });
              } else if (weaponMode === 1) {
                // Spiral fountain
                enemy.shootCooldown = 0.26;
                const ang1 = (timestamp / 100);
                const ang2 = ang1 + Math.PI;
                [ang1, ang2].forEach(ang => {
                  state.projectiles.push({
                    x: bossCenterX,
                    y: bossBottomY,
                    vx: Math.sin(ang) * 200,
                    vy: Math.cos(ang) * 120 + 200,
                    color: '#34d399',
                    size: 4.5,
                    damage: 10,
                    fromPlayer: false
                  });
                });
              } else {
                // Large Omega orb (slow, high damage shield-buster)
                enemy.shootCooldown = 1.8;
                state.projectiles.push({
                  x: bossCenterX,
                  y: bossBottomY,
                  vx: (playerCenterX - bossCenterX) * 0.2, // slow track
                  vy: 140,
                  color: '#ffffff',
                  size: 13,
                  damage: 35,
                  fromPlayer: false
                });
              }
            }
          }
        } else {
          // Normal enemy physics
          enemy.y += enemy.speed * enemyDt;
          
          if (enemy.type === 'scout') {
            // slight wobble side-to-side
            enemy.x += Math.sin(enemy.phase) * 50 * enemyDt;

            // Scout fire
            enemy.shootCooldown -= enemyDt;
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = (2.0 + Math.random() * 2.0) / (enemy.isHyperCharged ? 1.5 : 1.0);
              const enemyCenterX = enemy.x + enemy.width / 2;
              const enemyBottomY = enemy.y + enemy.height;

              if (enemy.isHyperCharged) {
                // Aimed shot directly towards the player
                const playerCenterX = player.x + player.width / 2;
                const dx = playerCenterX - enemyCenterX;
                const dy = player.y - enemyBottomY;
                const dist = Math.hypot(dx, dy) || 1;
                const vx = (dx / dist) * 260;
                const vy = (dy / dist) * 260;
                
                state.projectiles.push({
                  x: enemyCenterX,
                  y: enemyBottomY,
                  vx,
                  vy,
                  color: '#ec4899', // Hot Pink targeted blaster
                  size: 5,
                  damage: 14,
                  fromPlayer: false
                });
              } else {
                state.projectiles.push({
                  x: enemyCenterX,
                  y: enemyBottomY,
                  vx: 0,
                  vy: 220,
                  color: '#f59e0b',
                  size: 4,
                  damage: 10,
                  fromPlayer: false
                });
              }
            }
          } else if (enemy.type === 'bomber') {
            // heavy sinus drift
            enemy.x += Math.cos(enemy.phase) * 90 * enemyDt;

            enemy.shootCooldown -= enemyDt;
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = (1.6 + Math.random() * 1.0) / (enemy.isHyperCharged ? 1.4 : 1.0);
              const enemyCenterX = enemy.x + enemy.width / 2;
              const enemyBottomY = enemy.y + enemy.height;

              if (enemy.isHyperCharged) {
                // 3-way spread fire
                state.projectiles.push(
                  { x: enemyCenterX, y: enemyBottomY, vx: -80, vy: 220, color: '#d946ef', size: 5, damage: 15, fromPlayer: false },
                  { x: enemyCenterX, y: enemyBottomY, vx: 0, vy: 250, color: '#d946ef', size: 5, damage: 15, fromPlayer: false },
                  { x: enemyCenterX, y: enemyBottomY, vx: 80, vy: 220, color: '#d946ef', size: 5, damage: 15, fromPlayer: false }
                );
              } else {
                state.projectiles.push(
                  { x: enemyCenterX, y: enemyBottomY, vx: -50, vy: 200, color: '#c084fc', size: 4.5, damage: 12, fromPlayer: false },
                  { x: enemyCenterX, y: enemyBottomY, vx: 50, vy: 200, color: '#c084fc', size: 4.5, damage: 12, fromPlayer: false }
                );
              }
            }
          } else if (enemy.type === 'speeder') {
            // ultra-speed dash directly at player occasionally
            enemy.x += Math.sin(enemy.phase) * 150 * enemyDt;

            if (enemy.isHyperCharged) {
              enemy.shootCooldown -= enemyDt;
              if (enemy.shootCooldown <= 0) {
                enemy.shootCooldown = 1.0 + Math.random() * 1.5;
                state.projectiles.push({
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height,
                  vx: 0,
                  vy: 340, // fast projectile
                  color: '#22d3ee', // cyber blasters
                  size: 3.5,
                  damage: 8,
                  fromPlayer: false
                });
              }
            }
          }
        }

        // Draw Enemy
        ctx.shadowBlur = enemy.type === 'boss' ? 15 : ((enemy.type as any) === 'asteroid' ? 12 : 6);
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;

        if (enemy.type === 'boss') {
          const bIdx = enemy.bossIndex || 1;
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          const w = enemy.width;
          const h = enemy.height;

          ctx.save();
          if (bIdx === 1) {
            // Boss 1: NEON VANGUARD (Sleek red fighter)
            ctx.beginPath();
            ctx.moveTo(cx, enemy.y + h); // bottom primary spear tip
            ctx.lineTo(enemy.x, enemy.y + h * 0.35); // outer wing tip left
            ctx.lineTo(enemy.x + w * 0.2, enemy.y); // wing corner left
            ctx.lineTo(enemy.x + w * 0.4, enemy.y + h * 0.2); // inner joint left
            ctx.lineTo(enemy.x + w * 0.6, enemy.y + h * 0.2); // inner joint right
            ctx.lineTo(enemy.x + w * 0.8, enemy.y); // wing corner right
            ctx.lineTo(enemy.x + w, enemy.y + h * 0.35); // outer wing tip right
            ctx.closePath();
            ctx.fill();

            // Cockpit glow
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(cx, enemy.y + h * 0.45);
            ctx.lineTo(cx - 5, enemy.y + h * 0.25);
            ctx.lineTo(cx + 5, enemy.y + h * 0.25);
            ctx.closePath();
            ctx.fill();
          } else if (bIdx === 2) {
            // Boss 2: CYBER CRUSADER (Twin-pronged heavy ship, Gold/Amber)
            ctx.beginPath();
            ctx.moveTo(enemy.x + w * 0.15, enemy.y + h); // Left laser claw point
            ctx.lineTo(enemy.x, enemy.y + h * 0.2);
            ctx.lineTo(enemy.x + w * 0.3, enemy.y);
            ctx.lineTo(cx, enemy.y + h * 0.3); // center recession
            ctx.lineTo(enemy.x + w * 0.7, enemy.y);
            ctx.lineTo(enemy.x + w, enemy.y + h * 0.2);
            ctx.lineTo(enemy.x + w * 0.85, enemy.y + h); // Right laser claw point
            ctx.lineTo(cx, enemy.y + h * 0.4); // central underside
            ctx.closePath();
            ctx.fill();

            // Multi glowing visor ports
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemy.x + w * 0.25, enemy.y + h * 0.3, 10, 3);
            ctx.fillRect(enemy.x + w * 0.65, enemy.y + h * 0.3, 10, 3);
            ctx.fillRect(cx - 4, enemy.y + h * 0.18, 8, 3);
          } else if (bIdx === 3) {
            // Boss 3: PULSE EXECUTIONER (Fuchsia Decagon / Orbital platform with rotating spikes)
            // Central core
            ctx.beginPath();
            ctx.arc(cx, cy, h * 0.42, 0, Math.PI * 2);
            ctx.fill();
            
            // Outer spikes
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const spikeCount = 8;
            for (let i = 0; i < spikeCount; i++) {
              const theta = (enemy.phase * 2) + (i * Math.PI * 2) / spikeCount;
              const innerX = cx + Math.cos(theta) * (h * 0.42);
              const innerY = cy + Math.sin(theta) * (h * 0.42);
              const outerX = cx + Math.cos(theta) * (h * 0.62);
              const outerY = cy + Math.sin(theta) * (h * 0.62);
              ctx.moveTo(innerX, innerY);
              ctx.lineTo(outerX, outerY);
            }
            ctx.stroke();

            // Hyper-reactor core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, h * 0.18, 0, Math.PI * 2);
            ctx.fill();
          } else if (bIdx === 4) {
            // Boss 4: AETHER SINGULARITY (Cyan Diamond Star Destroyer with forward wings)
            ctx.beginPath();
            ctx.moveTo(cx, enemy.y + h * 1.1); // Ultra pointed forward nose
            ctx.lineTo(enemy.x, enemy.y + h * 0.7); // Swept back wingtip left
            ctx.lineTo(enemy.x + w * 0.3, enemy.y); // Wing shoulder left
            ctx.lineTo(cx, enemy.y + h * 0.15); // Engine bay joint
            ctx.lineTo(enemy.x + w * 0.7, enemy.y); // Wing shoulder right
            ctx.lineTo(enemy.x + w, enemy.y + h * 0.7); // Swept back wingtip right
            ctx.closePath();
            ctx.fill();

            // Wing panel glows
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x + w * 0.2, enemy.y + h * 0.4);
            ctx.lineTo(enemy.x + w * 0.4, enemy.y + h * 0.2);
            ctx.moveTo(enemy.x + w * 0.8, enemy.y + h * 0.4);
            ctx.lineTo(enemy.x + w * 0.6, enemy.y + h * 0.2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, enemy.y + h * 0.45, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Boss 5+: OMEGA NEON ARCHITECT (Giga Mothership with branching pylons, Emerald & white core)
            // Large wings
            ctx.beginPath();
            ctx.moveTo(cx, enemy.y + h * 0.9);
            ctx.lineTo(enemy.x, enemy.y + h * 0.5);
            ctx.lineTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + w * 0.22, enemy.y + h * 0.2);
            ctx.lineTo(enemy.x + w * 0.4, enemy.y);
            ctx.lineTo(enemy.x + w * 0.6, enemy.y);
            ctx.lineTo(enemy.x + w * 0.78, enemy.y + h * 0.2);
            ctx.lineTo(enemy.x + w, enemy.y);
            ctx.lineTo(enemy.x + w, enemy.y + h * 0.5);
            ctx.closePath();
            ctx.fill();

            // Giga Reactor beam core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 15, enemy.y + h * 0.35, 30, h * 0.4);
            
            // Rotating satellite spheres/pylons
            ctx.fillStyle = '#34d399';
            const orbitR = 45;
            const satX1 = cx + Math.cos(timestamp / 300) * orbitR;
            const satY1 = cy + Math.sin(timestamp / 300) * orbitR * 0.4;
            const satX2 = cx - Math.cos(timestamp / 300) * orbitR;
            const satY2 = cy - Math.sin(timestamp / 300) * orbitR * 0.4;
            
            ctx.beginPath();
            ctx.arc(satX1, satY1, 6, 0, Math.PI * 2);
            ctx.arc(satX2, satY2, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(satX1, satY1);
            ctx.moveTo(cx, cy);
            ctx.lineTo(satX2, satY2);
            ctx.stroke();
          }

          // Draw Hypercharged Boss Electric Aura Ring
          if (enemy.isHyperCharged) {
            ctx.save();
            ctx.strokeStyle = '#c084fc'; // neon purple electric
            ctx.lineWidth = 3;
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 12;

            // Pulsating orbital ring
            ctx.beginPath();
            const pulseRadius = Math.max(w, h) * 0.72 + Math.sin(timestamp / 60) * 6;
            ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Crackling sparks radiating from the ring
            ctx.strokeStyle = '#38bdf8'; // sky blue spark
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let s = 0; s < 5; s++) {
              const angle = (timestamp / 80) + (s * (Math.PI * 2) / 5);
              const sparkLength = 8 + Math.random() * 8;
              const sx1 = cx + Math.cos(angle) * pulseRadius;
              const sy1 = cy + Math.sin(angle) * pulseRadius;
              const sx2 = cx + Math.cos(angle + 0.08) * (pulseRadius + sparkLength);
              const sy2 = cy + Math.sin(angle + 0.08) * (pulseRadius + sparkLength);
              ctx.moveTo(sx1, sy1);
              ctx.lineTo(sx2, sy2);
            }
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();
        } else if ((enemy.type as any) === 'asteroid') {
          // Draw jagged asteroid rock
          ctx.fillStyle = '#451a03'; // Very dark brown
          ctx.strokeStyle = '#d97706'; // Magma glowing outline
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          const r = enemy.width / 2;
          for (let a = 0; a < Math.PI * 2; a += 0.6) {
            const offset = Math.sin(a * 4 + enemy.phase) * (r * 0.18);
            const px = cx + Math.cos(a) * (r + offset);
            const py = cy + Math.sin(a) * (r + offset);
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw internal molten fissures
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.4, cy - r * 0.1);
          ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
          ctx.stroke();
        } else {
          if (state.storyMode === 'story') {
            // Draw a cute vector Cybernetic Chicken!
            const cx = enemy.x + enemy.width / 2;
            const cy = enemy.y + enemy.height / 2;
            const w = enemy.width;
            const h = enemy.height;

            ctx.save();
            // 1. Draw glowing chicken wings (moving with sine wave)
            const wingSwing = Math.sin(timestamp / 100) * (w * 0.15);
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            // Left wing
            ctx.moveTo(cx - w * 0.2, cy);
            ctx.lineTo(enemy.x - wingSwing, cy - h * 0.25);
            ctx.lineTo(cx - w * 0.1, cy + h * 0.2);
            // Right wing
            ctx.moveTo(cx + w * 0.2, cy);
            ctx.lineTo(enemy.x + w + wingSwing, cy - h * 0.25);
            ctx.lineTo(cx + w * 0.1, cy + h * 0.2);
            ctx.closePath();
            ctx.fill();

            // 2. Draw round chicken body
            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw head
            ctx.beginPath();
            ctx.arc(cx, cy - h * 0.3, w * 0.22, 0, Math.PI * 2);
            ctx.fill();

            // 4. Draw orange beak (triangle)
            ctx.fillStyle = '#f97316'; // orange beak
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.08, cy - h * 0.28);
            ctx.lineTo(cx + w * 0.08, cy - h * 0.28);
            ctx.lineTo(cx, cy - h * 0.15);
            ctx.closePath();
            ctx.fill();

            // 5. Draw red comb on head
            ctx.fillStyle = '#ef4444'; // red comb
            ctx.beginPath();
            ctx.arc(cx, cy - h * 0.5, w * 0.08, 0, Math.PI * 2);
            ctx.arc(cx - w * 0.08, cy - h * 0.48, w * 0.06, 0, Math.PI * 2);
            ctx.arc(cx + w * 0.08, cy - h * 0.48, w * 0.06, 0, Math.PI * 2);
            ctx.fill();

            // 6. Draw glowing blue cybernetic visor/eyes
            ctx.fillStyle = '#00f0ff'; // cyber visor
            ctx.fillRect(cx - w * 0.12, cy - h * 0.38, w * 0.24, h * 0.06);

            ctx.restore();
          } else {
            // Classic invaders style
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
            ctx.lineTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.3);
            ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.3);
            ctx.lineTo(enemy.x + enemy.width, enemy.y);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Draw hypercharged outline overlay for normal enemies
        if (enemy.isHyperCharged && enemy.type !== 'boss') {
          ctx.save();
          ctx.strokeStyle = '#ec4899'; // hot pink
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 10;
          ctx.strokeRect(enemy.x - 4, enemy.y - 4, enemy.width + 8, enemy.height + 8);
          ctx.restore();
        }

        ctx.shadowBlur = 0;

        // Health bar for tougher enemies (bomber and boss)
        if (enemy.type === 'bomber' && enemy.health < enemy.maxHealth) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 3);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * (enemy.health / enemy.maxHealth), 3);
        }

        // Check crash collision with player
        const distToPlayer = Math.hypot(
          (enemy.x + enemy.width / 2) - (player.x + player.width / 2),
          (enemy.y + enemy.height / 2) - (player.y + player.height / 2)
        );

        if (distToPlayer < (enemy.width / 2 + player.width / 2.5)) {
          // Crash explosion!
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 15);
          
          if (player.powerups.invincibility <= 0) {
            const armorReduction = 1 - (upgrades.plasmaArmor || 0) * 0.08;
            const crashDamage = (enemy.type === 'boss' ? 50 : (enemy.type === 'bomber' ? 30 : 15)) * armorReduction;
            state.shield = Math.max(0, state.shield - crashDamage);
            setShield(state.shield);
            state.multiplier = 1; // reset combo multiplier
            SynthAudio.playHurt();
          }

          // Kill non-boss enemy on crash
          if (enemy.type !== 'boss') {
            state.enemiesKilled++;
            onStoryEnemyKilled(enemy.type);
            return false;
          } else {
            // Boss takes massive damage instead of instant dying
            enemy.health -= 80;
            if (enemy.health <= 0) {
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444', 35);
              state.score += 500;
              state.scrap += 25;
              state.bossCooldownTimer = 75; // 75 seconds of peace between bosses
              state.enemiesKilled++;
              onStoryEnemyKilled(enemy.type);
              setScore(state.score);
              setScrap(state.scrap);
              SynthAudio.playExplosion();
              setBossActive(false);
              return false;
            }
          }
        }

        // Keep scouts/speeders inside bounding height
        if (enemy.y > height + 60) {
          // If speeder goes off bottom, user doesn't lose anything except opportunity
          return false;
        }

        return true;
      });

      // 5. UPDATE PROJECTILES
      state.projectiles = state.projectiles.filter(proj => {
        const pDt = proj.fromPlayer ? dt : enemyDt;
        proj.x += proj.vx * pDt;
        proj.y += proj.vy * pDt;

        let effectiveX = proj.x;
        if (proj.isWave) {
          proj.wavePhase = (proj.wavePhase || 0) + pDt * 10;
          effectiveX = proj.x + Math.sin(proj.wavePhase) * (proj.waveAmp || 35);
        } else if (proj.isTesla) {
          proj.teslaPhase = (proj.teslaPhase || 0) + pDt * 30;
          effectiveX = proj.x + Math.sin(proj.teslaPhase) * 16;
        }

        // Draw bullet glowing
        ctx.fillStyle = proj.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = proj.color;
        ctx.beginPath();
        if (state.storyMode === 'story' && !proj.fromPlayer) {
          // Draw high-yield glowing plasma egg (ellipse)
          ctx.ellipse(effectiveX, proj.y, proj.size * 0.9, proj.size * 1.35, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(effectiveX, proj.y, proj.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Player laser vs Enemies
        if (proj.fromPlayer) {
          proj.hitEnemies = proj.hitEnemies || [];
          for (let i = 0; i < state.enemies.length; i++) {
            const enemy = state.enemies[i];
            const enemyId = enemy.id || i;
            if (proj.hitEnemies.includes(enemyId)) continue;

            if (
              effectiveX > enemy.x &&
              effectiveX < enemy.x + enemy.width &&
              proj.y > enemy.y &&
              proj.y < enemy.y + enemy.height
            ) {
              // Spark particles
              createExplosion(effectiveX, proj.y, enemy.color, 4);

              // Take Damage (Boss wing vs main body branch with immunity checks)
              if (enemy.type === 'boss') {
                if (enemy.isImmune) {
                  // Completely immune! Play deflection sparks and sound
                  createExplosion(effectiveX, proj.y, '#facc15', 7); // gold sparks
                  proj.hitEnemies.push(enemyId);
                  
                  // Piercing check
                  const pierceBonus = state.rogueliteBuffs?.laserPierceBonus || 0;
                  proj.piercedCount = proj.piercedCount || 0;
                  if (proj.piercedCount < pierceBonus) {
                    proj.piercedCount++;
                    continue;
                  }
                  return false; // delete bullet
                }

                const cx = enemy.x + enemy.width / 2;
                if (effectiveX < cx - enemy.width * 0.15 && enemy.leftWingAlive !== false) {
                  enemy.leftWingHp = (enemy.leftWingHp !== undefined ? enemy.leftWingHp : 180) - proj.damage;
                  createExplosion(effectiveX, proj.y, '#facc15', 3); // sparks
                  if (enemy.leftWingHp <= 0) {
                    enemy.leftWingAlive = false;
                    enemy.speed = (enemy.speed || 1.2) * 0.65;
                    enemy.shootCooldown = (enemy.shootCooldown || 1.0) * 0.55; // fires much faster!
                    createExplosion(enemy.x + enemy.width * 0.15, enemy.y + enemy.height * 0.2, '#ef4444', 25);
                    SynthAudio.playExplosion();
                    setCosmicWarningBanner("⚠️ BOSS LEFT WING DESTROYED! SPEED DECREASED, WEAPON CORE FLUX!");
                    setTimeout(() => setCosmicWarningBanner(null), 3500);
                  }
                  enemy.health -= proj.damage * 0.4;
                } else if (effectiveX > cx + enemy.width * 0.15 && enemy.rightWingAlive !== false) {
                  enemy.rightWingHp = (enemy.rightWingHp !== undefined ? enemy.rightWingHp : 180) - proj.damage;
                  createExplosion(effectiveX, proj.y, '#facc15', 3); // sparks
                  if (enemy.rightWingHp <= 0) {
                    enemy.rightWingAlive = false;
                    enemy.speed = (enemy.speed || 1.2) * 0.65;
                    enemy.shootCooldown = (enemy.shootCooldown || 1.0) * 0.55; // fires much faster!
                    createExplosion(enemy.x + enemy.width * 0.85, enemy.y + enemy.height * 0.2, '#ef4444', 25);
                    SynthAudio.playExplosion();
                    setCosmicWarningBanner("⚠️ BOSS RIGHT WING DESTROYED! SPEED DECREASED, WEAPON CORE FLUX!");
                    setTimeout(() => setCosmicWarningBanner(null), 3500);
                  }
                  enemy.health -= proj.damage * 0.4;
                } else {
                  enemy.health -= proj.damage;
                }
              } else {
                enemy.health -= proj.damage;
              }

              if (proj.isNeutron && proj.size > 3) {
                // Split on impact with enemy!
                state.projectiles.push(
                  { x: effectiveX, y: proj.y - 12, vx: -120, vy: -380, color: '#f59e0b', size: 2.5, damage: proj.damage * 0.45, fromPlayer: true },
                  { x: effectiveX, y: proj.y - 12, vx: 120, vy: -380, color: '#f59e0b', size: 2.5, damage: proj.damage * 0.45, fromPlayer: true }
                );
              }
              
              if (enemy.health <= 0) {
                // Large explosion
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, enemy.type === 'boss' ? 35 : 12);
                SynthAudio.playExplosion();
                
                // Add score + multiplier combo mechanics
                let baseReward = enemy.type === 'boss' ? 500 : (enemy.type === 'bomber' ? 60 : (enemy.type === 'speeder' ? 30 : 20));
                if ((enemy.type as any) === 'asteroid') {
                  baseReward = 15; // asteroid gives 15 points
                }
                const scoreMult = state.cosmicEvent === 'warp' ? 2 : 1;
                state.score += baseReward * state.multiplier * scoreMult;
                state.enemiesKilled++;

                onStoryEnemyKilled(enemy.type);

                // Trigger multiplier increase
                state.multiplier = Math.min(5, state.multiplier + 0.2);
                state.multiplierTimer = 4.0; // 4 seconds to maintain multiplier

                setScore(Math.round(state.score));

                // Drop items/scrap
                if (enemy.type === 'boss') {
                  state.scrap += 25;
                  setScrap(state.scrap);
                  setBossActive(false);
                  state.bossCooldownTimer = 75; // 75 seconds of peace between bosses
                  
                  // Trigger Roguelite pick-a-buff overlay!
                  triggerBuffSelection();
                } else if ((enemy.type as any) === 'asteroid') {
                  // Asteroid splits into 3 pieces of amethyst scrap!
                  for (let k = 0; k < 3; k++) {
                    state.collectibles.push({
                      x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 16,
                      y: enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 16,
                      type: 'scrap',
                      color: '#d946ef',
                      size: 6,
                      pulse: Math.random() * 5
                    });
                  }
                } else {
                  // Standard chance to drop scrap or power-ups
                  spawnCollectible(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                }
                
                // Remove enemy
                state.enemies.splice(i, 1);
              }

              // Apply Pierce Bonus
              proj.hitEnemies.push(enemyId);
              const pierceBonus = state.rogueliteBuffs?.laserPierceBonus || 0;
              proj.piercedCount = proj.piercedCount || 0;
              if (proj.piercedCount < pierceBonus) {
                proj.piercedCount++;
                continue; // Skip bullet deletion, let it pierce!
              }

              return false; // delete bullet
            }
          }
        } else {
          // Enemy lasers vs Player
          const playerCenterX = player.x + player.width / 2;
          const playerCenterY = player.y + player.height / 2;
          const distToLaser = Math.hypot(proj.x - playerCenterX, proj.y - playerCenterY);

          if (distToLaser < (player.width / 2.5 + proj.size)) {
            // Hit player!
            if (player.powerups.invincibility <= 0) {
              const armorReduction = 1 - (upgrades.plasmaArmor || 0) * 0.08;
              state.shield = Math.max(0, state.shield - proj.damage * armorReduction);
              setShield(state.shield);
              state.multiplier = 1; // broken combo multiplier
              SynthAudio.playHurt();
              createExplosion(proj.x, proj.y, '#ef4444', 8);
            } else {
              // Glowing shield deflected sparks
              createExplosion(proj.x, proj.y, '#a855f7', 4);
              SynthAudio.playPowerShoot(); // chime-ish deflection feedback
            }

            return false; // delete laser
          }
        }

        // Filter out out-of-bounds lasers
        return (proj.y > -20 && proj.y < height + 20 && proj.x > -20 && proj.x < width + 20);
      });

      // 6. COLLECTIBLES & MAGNET ACTION
      state.collectibles = state.collectibles.filter(item => {
        item.pulse += dt * 4;
        
        // Magnet effect: pull items towards player if magnet power up is active or upgraded
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const dist = Math.hypot(item.x - playerCenterX, item.y - playerCenterY);

        // Magnet range based on upgrade level & active power-up (Level 1: 50px, Level 5: 150px. Active power-up: +200px!)
        const hasMagnetPower = player.powerups.magnet > 0;
        const pullRadiusBonus = stateRef.current.rogueliteBuffs?.pullRadiusBonus || 0;
        let magnetRange = 50 + (upgrades.scrapMagnet * 25) + (hasMagnetPower ? 200 : 0) + pullRadiusBonus;
        
        // Apply Sol Sovereign skin passive (+100px item attraction magnet range)
        if (upgrades.selectedSkin === 'gold') {
          magnetRange += 100;
        }

        // In the tutorial, grant a generous magnet range to make collection easy but not automatic
        if (isTutorial) {
          magnetRange = 150;
        }

        if (dist < magnetRange) {
          const speed = (hasMagnetPower ? 350 : 200) * dt;
          const dx = playerCenterX - item.x;
          const dy = playerCenterY - item.y;
          item.x += (dx / dist) * speed;
          item.y += (dy / dist) * speed;
        } else {
          // Drift down slowly
          item.y += 110 * dt;

          // In tutorial, wrap items to top to prevent softlocks if they are missed
          if (isTutorial && item.y > height) {
            item.y = 40;
            item.x = 50 + Math.random() * (width - 100);
          }
        }

        // Draw highly distinguishable, high-fidelity glowing geometries and icons for each item type
        const r = item.size + Math.sin(item.pulse) * 1.5;

        if (item.type === 'scrap') {
          ctx.save();
          ctx.shadowBlur = 8 + Math.sin(item.pulse) * 2;
          ctx.shadowColor = item.color;
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 1.5;
          ctx.fillStyle = 'rgba(217, 70, 239, 0.2)'; // semi-transparent fill
          ctx.beginPath();
          const sides = 6;
          const rot = (timestamp / 400) % (Math.PI * 2);
          for (let i = 0; i < sides; i++) {
            const theta = rot + (i * Math.PI * 2) / sides;
            const px = item.x + Math.cos(theta) * r;
            const py = item.y + Math.sin(theta) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
          
          // Inner glowing core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x, item.y, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (item.type === 'heal') {
          ctx.save();
          ctx.shadowBlur = 14 + Math.sin(item.pulse) * 3;
          ctx.shadowColor = item.color;
          
          // Outer circle
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          
          // Draw bright white cross in center
          ctx.fillStyle = '#ffffff';
          const crossW = r * 0.28;
          const crossH = r * 0.8;
          // horizontal bar
          ctx.fillRect(item.x - crossH / 2, item.y - crossW / 2, crossH, crossW);
          // vertical bar
          ctx.fillRect(item.x - crossW / 2, item.y - crossH / 2, crossW, crossH);
          ctx.restore();
        } else if (item.type === 'invincibility') {
          ctx.save();
          ctx.shadowBlur = 16 + Math.sin(item.pulse) * 4;
          ctx.shadowColor = item.color;
          
          ctx.strokeStyle = '#c084fc'; // Light lavender
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          
          // Draw shield path
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - r); // top center
          ctx.quadraticCurveTo(item.x + r, item.y - r, item.x + r, item.y - r * 0.2); // top right
          ctx.quadraticCurveTo(item.x + r, item.y + r * 0.4, item.x, item.y + r * 1.1); // bottom point
          ctx.quadraticCurveTo(item.x - r, item.y + r * 0.4, item.x - r, item.y - r * 0.2); // bottom point left
          ctx.quadraticCurveTo(item.x - r, item.y - r, item.x, item.y - r); // top left
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
          
          // Inner shield icon symbol (looks like a clean Greek letter omega or fortress shield core)
          ctx.fillStyle = '#ffffff';
          ctx.font = 'black 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Ω', item.x, item.y - 1.5);
          ctx.restore();
        } else if (item.type === 'double') {
          ctx.save();
          ctx.shadowBlur = 14 + Math.sin(item.pulse) * 3;
          ctx.shadowColor = item.color;
          
          ctx.strokeStyle = item.color;
          ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
          ctx.lineWidth = 2.5;
          
          // Circle boundaries
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          
          // Double arrowheads / firepower chevrons
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Lower chevron
          ctx.beginPath();
          ctx.moveTo(item.x - r * 0.5, item.y + r * 0.25);
          ctx.lineTo(item.x, item.y - r * 0.25);
          ctx.lineTo(item.x + r * 0.5, item.y + r * 0.25);
          ctx.stroke();
          
          // Upper chevron
          ctx.beginPath();
          ctx.moveTo(item.x - r * 0.5, item.y - r * 0.2);
          ctx.lineTo(item.x, item.y - r * 0.7);
          ctx.lineTo(item.x + r * 0.5, item.y - r * 0.2);
          ctx.stroke();
          
          ctx.restore();
        } else if (item.type === 'magnet') {
          ctx.save();
          ctx.shadowBlur = 14 + Math.sin(item.pulse) * 3;
          ctx.shadowColor = item.color;
          
          ctx.strokeStyle = item.color;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.lineWidth = 2.5;
          
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          
          // Draw horseshoe magnet U-shape
          ctx.translate(item.x, item.y);
          ctx.rotate(timestamp / 450); // slow rotating attraction force
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          // Arc bottom of the U
          ctx.arc(0, 0, r * 0.45, 0, Math.PI, false);
          ctx.stroke();
          
          // Red tip (N)
          ctx.strokeStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(r * 0.45, 0);
          ctx.lineTo(r * 0.45, -r * 0.22);
          ctx.stroke();
          
          // Blue tip (S)
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          ctx.moveTo(-r * 0.45, 0);
          ctx.lineTo(-r * 0.45, -r * 0.22);
          ctx.stroke();
          
          ctx.restore();
        } else if (item.type === 'timewarp') {
          ctx.save();
          ctx.shadowBlur = 14 + Math.sin(item.pulse) * 3;
          ctx.shadowColor = item.color;
          
          ctx.strokeStyle = item.color;
          ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
          ctx.lineWidth = 2.5;
          
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          
          // Draw beautiful hourglass inside
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = '#22d3ee';
          ctx.lineWidth = 1.8;
          ctx.lineJoin = 'miter';
          
          const hW = r * 0.38;
          const hH = r * 0.55;
          
          ctx.beginPath();
          ctx.moveTo(item.x - hW, item.y - hH);
          ctx.lineTo(item.x + hW, item.y - hH);
          ctx.lineTo(item.x + 1, item.y);
          ctx.lineTo(item.x + hW, item.y + hH);
          ctx.lineTo(item.x - hW, item.y + hH);
          ctx.lineTo(item.x - 1, item.y);
          ctx.lineTo(item.x - hW, item.y - hH);
          ctx.closePath();
          ctx.stroke();
          
          // Sand falling visual
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(item.x - hW + 1.8, item.y - hH + 1.8);
          ctx.lineTo(item.x + hW - 1.8, item.y - hH + 1.8);
          ctx.lineTo(item.x, item.y - 0.5);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + 0.5);
          ctx.lineTo(item.x - hW + 1.8, item.y + hH - 1.8);
          ctx.lineTo(item.x + hW - 1.8, item.y + hH - 1.8);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }

        // Player collected item collision
        if (dist < (player.width / 1.8 + item.size)) {
          createExplosion(item.x, item.y, item.color, 6);

          if (isTutorial) {
            state.tutorialProgressCount++;
          }

          if (item.type === 'scrap') {
            let scrapAmount = 1;
            if (upgrades.selectedSkin === 'gold') {
              scrapAmount *= 2; // Sol Sovereign passive: Double Scrap rewards!
            }
            if (state.cosmicEvent === 'solar') {
              scrapAmount *= 2; // Solar Flare weather double rewards!
            }
            state.scrap += scrapAmount;
            setScrap(state.scrap);
            SynthAudio.playCollect();
          } else if (item.type === 'heal') {
            state.shield = Math.min(state.maxShield, state.shield + 25);
            setShield(state.shield);
            SynthAudio.playPowerup();
            
            // Score Multiplier Risk/Reward Rule:
            // Collecting a heal halves the current combo score multiplier rather than a full reset!
            state.multiplier = Math.max(1.0, Number((state.multiplier / 2).toFixed(1)));
            state.multiplierTimer = 4.0; // Refresh timer so they can maintain the remaining combo
            
            setCosmicWarningBanner("⚠️ HEAL PROTOCOL ENGAGED: COMBO MULTIPLIER HALVED!");
            setTimeout(() => setCosmicWarningBanner(null), 3000);
          } else if (item.type === 'invincibility') {
            player.powerups.invincibility = 8.0; // 8 seconds of ultimate shield
            setInvincibilityDuration(8);
            SynthAudio.playPowerup();
          } else if (item.type === 'double') {
            player.powerups.doubleLaser = 10.0; // 10s double shots
            setDoubleDuration(10);
            SynthAudio.playPowerup();
          } else if (item.type === 'magnet') {
            player.powerups.magnet = 12.0; // 12s massive item vacuum
            setMagnetDuration(12);
            SynthAudio.playPowerup();
          } else if (item.type === 'timewarp') {
            player.powerups.timewarp = 8.0; // 8s time warp slow-mo
            setTimewarpDuration(8);
            SynthAudio.playPowerup();
          }

          return false; // delete item
        }

        // Out of bounds filter
        return item.y < height + 40;
      });

      // 7. PARTICLES DUST
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;

        return p.alpha > 0;
      });

      // 7.5. COSMIC EVENTS PHYSICS
      // A. Solar flares physics loop
      state.solarFlares = state.solarFlares.filter(flare => {
        flare.y += flare.speed * enemyDt;
        
        // Draw molten heatwave flare
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f97316';
        ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
        ctx.beginPath();
        ctx.arc(flare.x, flare.y, flare.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Hit detection with player ship
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const dist = Math.hypot(flare.x - playerCenterX, flare.y - playerCenterY);
        if (dist < (player.width / 1.8 + flare.r)) {
          // Heat crash!
          createExplosion(flare.x, flare.y, '#f97316', 15);
          if (player.powerups.invincibility <= 0) {
            const armorReduction = 1 - (upgrades.plasmaArmor || 0) * 0.08;
            state.shield = Math.max(0, state.shield - 20 * armorReduction);
            state.multiplier = 1;
            SynthAudio.playHurt();
          }
          return false; // destroy flare on impact
        }
        
        return flare.y < height + 40;
      });

      // B. Pulsar sweep beam warnings & beam drawing
      if (state.cosmicEvent === 'pulsar') {
        // Move pulsar target coordinate back and forth
        state.pulsarX += state.pulsarDir * 180 * enemyDt;
        if (state.pulsarX > width - 40) {
          state.pulsarX = width - 40;
          state.pulsarDir = -1;
        }
        if (state.pulsarX < 40) {
          state.pulsarX = 40;
          state.pulsarDir = 1;
        }
        
        // Update states
        state.pulsarStateTimer += enemyDt;
        if (state.pulsarState === 'warning' && state.pulsarStateTimer >= 3.0) {
          state.pulsarState = 'firing';
          state.pulsarStateTimer = 0;
          SynthAudio.playPowerup(); // Play high alarm chime warning
        } else if (state.pulsarState === 'firing' && state.pulsarStateTimer >= 2.0) {
          state.pulsarState = 'warning';
          state.pulsarStateTimer = 0;
        }
        
        // Draw Pulsar Node at the top
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(state.pulsarX, 20, 10 + Math.sin(timestamp / 50) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Render beam column
        if (state.pulsarState === 'warning') {
          // Soft tracking warn column
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(state.pulsarX, 20);
          ctx.lineTo(state.pulsarX, height);
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(state.pulsarX, 20);
          ctx.lineTo(state.pulsarX, height);
          ctx.stroke();
        } else if (state.pulsarState === 'firing') {
          // Violent lightning energy ray
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#06b6d4';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 55 + Math.sin(timestamp / 20) * 15;
          ctx.beginPath();
          ctx.moveTo(state.pulsarX, 20);
          ctx.lineTo(state.pulsarX, height);
          ctx.stroke();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 12 + Math.sin(timestamp / 10) * 4;
          ctx.beginPath();
          ctx.moveTo(state.pulsarX, 20);
          ctx.lineTo(state.pulsarX, height);
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Check collision with player ship
          const playerCenterX = player.x + player.width / 2;
          const playerLeft = player.x;
          const playerRight = player.x + player.width;
          const beamRadius = 25;
          if (playerRight >= state.pulsarX - beamRadius && playerLeft <= state.pulsarX + beamRadius) {
            // Player is inside the beam, take heat damage
            if (player.powerups.invincibility <= 0) {
              state.shield = Math.max(0, state.shield - 35 * dt); // continuous laser decay
              state.multiplier = 1;
              if (Math.random() < 0.12) {
                SynthAudio.playHurt();
                createExplosion(playerCenterX, player.y + player.height / 2, '#06b6d4', 3);
              }
            }
          }
        }
      }

      // Draw Time Warp Screen Vignette Filter
      if (isTimeWarp) {
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 4 + Math.sin(timestamp / 100) * 2;
        ctx.strokeRect(0, 0, width, height);

        // Grid/distortion lines
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
        ctx.lineWidth = 1;
        const lineSpacing = 30;
        for (let xCoord = 0; xCoord < width; xCoord += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(xCoord, 0);
          ctx.lineTo(xCoord, height);
          ctx.stroke();
        }
        for (let yCoord = 0; yCoord < height; yCoord += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, yCoord);
          ctx.lineTo(width, yCoord);
          ctx.stroke();
        }

        // Radial vignette
        const vignette = ctx.createRadialGradient(width / 2, height / 2, width / 3, width / 2, height / 2, width / 1.1);
        vignette.addColorStop(0, 'rgba(34, 211, 238, 0)');
        vignette.addColorStop(1, 'rgba(34, 211, 238, 0.18)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // --- FLIGHT ACADEMY CANVAS INDICATORS ---
      if (isTutorial) {
        const player = state.player;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        ctx.save();
        if (state.tutorialStep === 0) {
          // Pulse value
          const pulse = 1 + Math.sin(timestamp / 150) * 0.15;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#06b6d4';
          
          // Concentric dashed ring around player
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(playerCenterX, playerCenterY, 50 * pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Steering indicator text
          ctx.shadowBlur = 4;
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText("MANEUVER VESSEL", playerCenterX, playerCenterY + player.height + 25);
          ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
          ctx.fillText("[ WASD / ARROWS / DRAG ]", playerCenterX, playerCenterY + player.height + 36);

        } else if (state.tutorialStep === 1) {
          // Draw targeting reticle on all targets
          state.enemies.forEach((enemy) => {
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const angle = (timestamp / 200) % (Math.PI * 2);
            
            ctx.strokeStyle = '#22d3ee';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#22d3ee';
            ctx.lineWidth = 1.5;
            
            // Spinning outer brackets
            ctx.beginPath();
            ctx.arc(ex, ey, enemy.width * 0.9, angle, angle + Math.PI / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ex, ey, enemy.width * 0.9, angle + Math.PI, angle + Math.PI * 1.5);
            ctx.stroke();

            // Inner crosshair
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ex - 8, ey); ctx.lineTo(ex + 8, ey);
            ctx.moveTo(ex, ey - 8); ctx.lineTo(ex, ey + 8);
            ctx.stroke();

            // Target lock text
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText("LOCK_ON [HP:15]", ex, ey - enemy.height / 2 - 8);

            // Laser alignment lines from player ship
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(playerCenterX, player.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          });

        } else if (state.tutorialStep === 2) {
          // Highlight scraps
          state.collectibles.forEach((item) => {
            if (item.type === 'scrap') {
              const pulse = 8 + Math.sin(timestamp / 80) * 3;
              
              ctx.strokeStyle = '#d946ef'; // Amethyst Magenta
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#d946ef';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 3]);
              
              ctx.beginPath();
              ctx.arc(item.x, item.y, pulse + 12, 0, Math.PI * 2);
              ctx.stroke();

              // Draw little lock arrow towards player
              const dist = Math.hypot(playerCenterX - item.x, playerCenterY - item.y);
              if (dist > 10) {
                const dx = (playerCenterX - item.x) / dist;
                const dy = (playerCenterY - item.y) / dist;
                ctx.fillStyle = '#f472b6';
                ctx.beginPath();
                ctx.arc(item.x + dx * 20, item.y + dy * 20, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });

        } else if (state.tutorialStep === 3) {
          // Highlight upgrades
          state.collectibles.forEach((item) => {
            const pulse = 10 + Math.sin(timestamp / 60) * 2.5;
            ctx.strokeStyle = item.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = item.color;
            ctx.lineWidth = 1.5;
            
            // Draw hexagonal target rings
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3 + (timestamp / 300);
              const px = item.x + Math.cos(angle) * (pulse + 4);
              const py = item.y + Math.sin(angle) * (pulse + 4);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Label text
            ctx.fillStyle = item.color;
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            const label = item.type === 'heal' ? 'SHIELD RECHARGE' : 'DOUBLE-BLASTER';
            ctx.fillText(label, item.x, item.y - pulse - 6);
          });

        } else if (state.tutorialStep === 4) {
          // Draw warp streaks
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#22d3ee';
          for (let i = 0; i < 8; i++) {
            const x = (i * 50 + timestamp) % width;
            const y = (i * 90 + timestamp * 2) % height;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 25);
            ctx.stroke();
          }

          // Warp warning overlay
          ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText("CADET TRAINING COMPLETE", width / 2, height / 2 - 20);
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
          ctx.fillText("INITIATING HYPERSPACE ENGAGEMENT...", width / 2, height / 2);
        }
        ctx.restore();
      }

      // 7.7. HUD SYNCHRONIZER (Optimized throttling)
      if (timestamp - state.lastHudUpdate >= 200) {
        state.lastHudUpdate = timestamp;
        setScore(Math.round(state.score));
        setScrap(state.scrap);
        setShield(Math.round(state.shield));
        setMaxShield(state.maxShield);
        setActiveEvent(state.cosmicEvent);
        setEventTimeLeft(Math.round(state.cosmicEventTimer));
        if (isTutorial) {
          setTutStep(state.tutorialStep);
          setTutProgress(state.tutorialProgressCount);
          setTutPhaseCleared(!!state.tutorialPhaseCleared);
        }
      }

      // 8. GAME OVER TRIGGER
      if (state.shield <= 0) {
        if (!state.hasRevivedThisRun && !isTutorial) {
          state.hasRevivedThisRun = true; // Mark as spent so they don't get double prompted
          setShowingRevivePrompt(true);
          return;
        } else {
          SynthAudio.playGameOver();
          onGameOver(Math.round(state.score), state.scrap, state.enemiesKilled);
          return;
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [paused, upgrades, bossActive, musicOn, showingRevivePrompt]);

  // Touch and Mouse Move Drag controls - delta movement to avoid finger blocking the ship
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (paused || stateRef.current.showingBuffChoice) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    stateRef.current.touch.isDragging = true;
    stateRef.current.touch.lastX = touch.clientX - rect.left;
    stateRef.current.touch.lastY = touch.clientY - rect.top;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.touch.isDragging || paused || stateRef.current.showingBuffChoice) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    const dx = currentX - stateRef.current.touch.lastX;
    const dy = currentY - stateRef.current.touch.lastY;

    const player = stateRef.current.player;
    const { width, height } = stateRef.current;

    // Apply delta movement, sensitive multiplier
    player.x = Math.max(0, Math.min(width - player.width, player.x + dx * 1.45));
    player.y = Math.max(40, Math.min(height - player.height - 10, player.y + dy * 1.45));

    stateRef.current.touch.lastX = currentX;
    stateRef.current.touch.lastY = currentY;
  };

  const handleTouchEnd = () => {
    stateRef.current.touch.isDragging = false;
  };

  // Drag and click mouse control fallback
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (paused || stateRef.current.showingBuffChoice) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    stateRef.current.touch.isDragging = true;
    stateRef.current.touch.lastX = e.clientX - rect.left;
    stateRef.current.touch.lastY = e.clientY - rect.top;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.touch.isDragging || paused || stateRef.current.showingBuffChoice) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const dx = currentX - stateRef.current.touch.lastX;
    const dy = currentY - stateRef.current.touch.lastY;

    const player = stateRef.current.player;
    const { width, height } = stateRef.current;

    player.x = Math.max(0, Math.min(width - player.width, player.x + dx * 1.45));
    player.y = Math.max(40, Math.min(height - player.height - 10, player.y + dy * 1.45));

    stateRef.current.touch.lastX = currentX;
    stateRef.current.touch.lastY = currentY;
  };

  const handleMouseUp = () => {
    stateRef.current.touch.isDragging = false;
  };

  const handleReviveSuccess = () => {
    const state = stateRef.current;
    state.hasRevivedThisRun = true;
    state.shield = state.maxShield;
    setShield(state.maxShield); // Synchronize shield to UI state
    
    // EMP BLAST: blow up standard enemies on screen with amazing cyan explosions
    state.enemies.forEach(enemy => {
      for (let i = 0; i < 15; i++) {
        state.particles.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: (Math.random() - 0.5) * 350,
          vy: (Math.random() - 0.5) * 350,
          color: '#22d3ee', // Cyan particles
          size: Math.random() * 4 + 2,
          alpha: 1,
          decay: Math.random() * 0.05 + 0.02
        });
      }
    });
    // Keep bosses but clear standard enemies
    state.enemies = state.enemies.filter(e => e.type === 'boss');
    state.projectiles = []; // Clear hostile bullets! This is crucial so they don't spawn-die!
    
    // Give player brief invincibility (e.g. 3.5 seconds)
    state.player.powerups.invincibility = 3.5;
    
    // Reset React state
    setShowingRevivePrompt(false);
    setPlayingReviveAd(false);
    setHasRevived(true);
    
    // Resume game loop!
    state.lastTime = performance.now();
  };

  // Convert shield value to visual health fraction
  const healthPercent = Math.max(0, Math.round((shield / maxShield) * 100));

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden" ref={containerRef}>
      
      {/* STORY MODE FLOATING HUD PANEL */}
      {gameMode === 'story' && !showingDialogue && (
        <div className="absolute top-15 inset-x-3 bg-slate-900/90 border border-amber-500/30 backdrop-blur-md rounded-xl px-3 py-2 z-20 shadow-md flex justify-between items-center gap-2">
          <div className="flex flex-col">
            <span className="text-amber-400 text-[8px] tracking-widest uppercase font-mono font-black">
              CHAPTER {chapter}/5
            </span>
            <span className="text-slate-200 text-[10px] font-sans font-extrabold uppercase truncate max-w-[130px]">
              {chapter === 1 && "Scout Patrol"}
              {chapter === 2 && "Empress Squadron"}
              {chapter === 3 && "Rooster Decimation"}
              {chapter === 4 && "Singularity Coop"}
              {chapter === 5 && "Omega Core God"}
            </span>
          </div>

          <div className="flex-1 max-w-[140px] flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
              <span className="font-bold">WAVE {wave}/3</span>
              <span className="text-amber-400 font-extrabold">
                {wave === 3 ? "BOSS ENGAGED" : `${killCount}/${killGoal} PLUCKED`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300 rounded-full"
                style={{ 
                  width: wave === 3 ? "100%" : `${Math.round((killCount / killGoal) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* STORY MODE DIALOGUE OVERLAY */}
      {gameMode === 'story' && showingDialogue && activeDialogueLines.length > 0 && (
        <div className="absolute bottom-24 inset-x-4 bg-slate-900/95 border-2 border-amber-500/80 backdrop-blur-md rounded-xl p-4.5 z-40 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex flex-col gap-3.5">
          <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-black font-mono tracking-widest uppercase">
                {activeDialogueLines[dialogueIndex].speaker}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
              TRANSMISSION {dialogueIndex + 1}/{activeDialogueLines.length}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            {/* Speaker avatar indicator */}
            <div className="w-12 h-12 rounded-lg border border-amber-500/40 bg-slate-950 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
              {activeDialogueLines[dialogueIndex].avatar === 'cluck' && <span className="text-2xl">🐔</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'empress' && <span className="text-2xl">👑</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'commander' && <span className="text-2xl">🐓</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'overlord' && <span className="text-2xl">🥚</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'omega' && <span className="text-2xl">👾</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'raider' && <span className="text-2xl">🚀</span>}
              {activeDialogueLines[dialogueIndex].avatar === 'ai' && <span className="text-2xl">🤖</span>}
              
              {/* Animated corner lines */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-400" />
            </div>

            <p className="text-xs text-slate-100 font-mono leading-relaxed flex-grow">
              {activeDialogueLines[dialogueIndex].text}
            </p>
          </div>

          <button
            onClick={() => {
              SynthAudio.playCollect();
              if (dialogueIndex + 1 < activeDialogueLines.length) {
                setDialogueIndex(dialogueIndex + 1);
              } else {
                // Completed dialogues
                showDialogueScreen(false);
                
                if (dialogueType === 'outro') {
                  // Advanced chapter!
                  const nextCh = chapter + 1;
                  if (nextCh <= 5) {
                    setChapter(nextCh);
                    setWave(1);
                    setKillCount(0);
                    setKillGoal(10);
                    
                    stateRef.current.storyChapter = nextCh;
                    stateRef.current.storyWave = 1;
                    stateRef.current.storyKillsThisWave = 0;
                    stateRef.current.storyKillGoal = 10;
                    stateRef.current.storyBossSpawned = false;
                    
                    setChapterTransitionScreen(true);
                    setTimeout(() => {
                      setChapterTransitionScreen(false);
                      setDialogueType('intro');
                      setActiveDialogueLines(CHAPTER_DIALOGUES[nextCh].intro);
                      setDialogueIndex(0);
                      showDialogueScreen(true);
                    }, 4000);
                  } else {
                    // Completed the entire story mode campaign! Win the game!
                    onGameOver(stateRef.current.score, stateRef.current.scrap, stateRef.current.enemiesKilled);
                  }
                }
              }
            }}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-widest rounded-lg transition-all duration-200 border border-amber-400/50 shadow-[0_2px_8px_rgba(245,158,11,0.2)] active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>{dialogueIndex + 1 < activeDialogueLines.length ? "TRANSMIT NEXT" : "DISMISS SIGNAL"}</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STORY CHAPTER INTER-MISSION TRANSITION BANNER */}
      {gameMode === 'story' && chapterTransition && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center gap-6">
          <div className="relative p-6 border-2 border-amber-500/50 rounded-2xl max-w-sm flex flex-col gap-4 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-bounce">
            <h2 className="text-2xl font-black text-amber-400 font-sans tracking-tight uppercase">CHAPTER SECURED!</h2>
            <div className="h-[2px] w-24 bg-amber-500/40 mx-auto" />
            <p className="text-sm font-mono text-slate-200 leading-relaxed">
              Scanning subspace coordinates... Hyperdrive warming up... Loading Sector {chapter} defenses. Prepare for contact!
            </p>
            <div className="w-full h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-amber-500 animate-[pulse_1.5s_infinite] rounded-full w-full" />
            </div>
          </div>
        </div>
      )}

      {/* FLIGHT ACADEMY TUTORIAL DIALOG */}
      {isTutorial && isTutorialCollapsed && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragMomentum={false}
          dragElastic={0.1}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-18 right-4 left-4 md:left-auto md:right-4 md:w-[260px] bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md rounded-lg py-1.5 px-3 z-30 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
              ACADEMY PILOT PHASE {tutStep + 1}/5
            </span>
          </div>
          <button 
            onClick={() => setIsTutorialCollapsed(false)}
            className="text-[9px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition px-2 py-0.5 rounded font-mono font-bold uppercase pointer-events-auto"
          >
            EXPAND GUIDE
          </button>
        </motion.div>
      )}

      {isTutorial && !isTutorialCollapsed && (
        <motion.div 
          drag
          dragConstraints={containerRef}
          dragMomentum={false}
          dragElastic={0.1}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="absolute top-18 left-4 right-4 md:left-auto md:right-4 md:w-[380px] bg-slate-950/95 border-2 border-cyan-500/40 backdrop-blur-lg rounded-xl p-4 z-30 shadow-[0_0_25px_rgba(6,182,212,0.3)] flex flex-col gap-2.5 cursor-grab active:cursor-grabbing select-none hover:bg-slate-950/98 transition-colors duration-200"
        >
          {/* Draggable Handle Indicator */}
          <div className="flex flex-col items-center justify-center gap-0.5 border-b border-cyan-500/10 pb-1.5">
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-500/40 animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-cyan-500/40 animate-pulse delay-75" />
              <span className="w-1 h-1 rounded-full bg-cyan-500/40 animate-pulse delay-150" />
            </div>
            <span className="text-[7px] text-cyan-500/40 font-mono tracking-widest uppercase select-none font-bold">
              ⚡ DRAG TO REPOSITION GUIDE ⚡
            </span>
          </div>

          {/* Decorative scanner lines and corner brackets */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-cyan-400 animate-pulse" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-cyan-400 animate-pulse" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-cyan-400 animate-pulse" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-cyan-400 animate-pulse" />
          
          <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </div>
              <span className="text-cyan-400 text-xs font-black font-mono tracking-widest uppercase">
                FLIGHT ACADEMY SIMULATION
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 rounded text-[9px] text-cyan-300 font-mono font-bold uppercase">
                PHASE {tutStep + 1} / 5
              </div>
              <button 
                onClick={() => setIsTutorialCollapsed(true)}
                className="text-slate-400 hover:text-cyan-400 text-[10px] font-mono font-bold border border-slate-800 hover:border-cyan-500/30 bg-slate-900/40 px-1.5 py-0.5 rounded transition pointer-events-auto"
              >
                MINIMIZE
              </button>
            </div>
          </div>

          {/* Virtual Co-Pilot Avatar Box */}
          <div className="flex gap-3 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg select-none">
            {/* Holographic AI wave avatar */}
            <div className="flex flex-col items-center justify-center bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-2 h-11 w-11 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />
              {/* Dynamic waveform bars */}
              <div className="flex items-end gap-0.5 h-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["20%", "90%", "30%", "100%", "20%"] }}
                    transition={{
                      duration: 0.8 + i * 0.15,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-1 bg-cyan-400 rounded-sm shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                  />
                ))}
              </div>
              <span className="text-[6px] text-cyan-300 font-mono font-bold tracking-tighter mt-1 uppercase">A.I. CO-PILOT</span>
            </div>

            {/* Instruction dialogue text */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-mono text-cyan-400 font-extrabold uppercase tracking-wide">VALERIE (ACADEMY AI)</span>
              <p className="text-[10px] text-slate-200 font-mono leading-relaxed mt-0.5 italic">
                {tutStep === 0 && "Welcome Cadet. Calibrate thruster response. Move the vessel across the grid."}
                {tutStep === 1 && "Direct hit! Active training targets ahead. Obliterate the 3 oncoming target orbs."}
                {tutStep === 2 && "Exquisite shooting! Debris yielded amethyst energy cores. Salvage the 3 scraps to refuel."}
                {tutStep === 3 && "Supply drones arrived! Grab either the Green Shield Core or Blue Double-Laser Upgrade."}
                {tutStep === 4 && "Flawless training sequence! Hold tightly as we synchronize your hyperdrive vectors."}
              </p>
            </div>
          </div>

          {/* Active Flight Checklist */}
          <div className="bg-slate-950/50 border border-slate-900 rounded-lg p-2.5 space-y-2 select-none">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold">TACTICAL CHECKLIST</span>
            <div className="space-y-1.5 font-mono text-[9px] text-slate-300">
              {tutStep === 0 && (
                <div className="space-y-1">
                  {tutPhaseCleared ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>Thrusters Calibrated! [100%]</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="animate-ping h-1 w-1 bg-cyan-400 rounded-full" />
                      <span>[ ] MANEUVER: Ignite Thrusters (WASD / Arrows / Drag) ({Math.round(Math.min(100, (tutProgress / 1.2) * 100))}% Calibrated)</span>
                    </div>
                  )}
                </div>
              )}
              {tutStep === 1 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 line-through">
                    <span className="text-emerald-400">✓</span>
                    <span>Thrusters Calibrated</span>
                  </div>
                  {tutPhaseCleared ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>LIVE TARGETS: All Target Orbs Obliterated!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="animate-ping h-1 w-1 bg-cyan-400 rounded-full animate-pulse" />
                      <span>[ ] LIVE TARGETS: Obliterate Orbs ({Math.max(0, 3 - (stateRef.current?.enemies?.length || 0))}/3 Destroyed)</span>
                    </div>
                  )}
                </div>
              )}
              {tutStep === 2 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 line-through">
                    <span className="text-emerald-400">✓</span>
                    <span>Orbs Cleared</span>
                  </div>
                  {tutPhaseCleared ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>HARVEST RESOURCE: Amethyst Refueling Complete!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="animate-ping h-1 w-1 bg-cyan-400 rounded-full animate-pulse" />
                      <span>[ ] HARVEST RESOURCE: Collect Amethyst Scraps ({Math.min(3, Math.round(tutProgress))}/3 Salvaged)</span>
                    </div>
                  )}
                </div>
              )}
              {tutStep === 3 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 line-through">
                    <span className="text-emerald-400">✓</span>
                    <span>Amethyst Harvested</span>
                  </div>
                  {tutPhaseCleared ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>POWER UPGRADE: Core Subsystems Overloaded!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="animate-ping h-1 w-1 bg-cyan-400 rounded-full animate-pulse" />
                      <span>[ ] POWER UPGRADE: Grab Shield Core or Double Laser</span>
                    </div>
                  )}
                </div>
              )}
              {tutStep === 4 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span>✓</span>
                    <span>Systems Overloaded & Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-yellow-400 animate-pulse">
                    <span>⚡</span>
                    <span>WARP SEQUENCE: Click "COMPLETE GRADUATION" below...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MANUAL PROGRESSION BUTTON - GLOWING CYAN */}
          {tutPhaseCleared ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={advanceTutorialStep}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-black font-mono rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 tracking-wider uppercase flex items-center justify-center gap-2 animate-[pulse_1.5s_infinite] pointer-events-auto"
            >
              <span>
                {tutStep === 0 && "PROCEED TO LIVE TARGET PRACTICE →"}
                {tutStep === 1 && "PROCEED TO NEON SCRAP HARVESTING →"}
                {tutStep === 2 && "PROCEED TO TACTICAL UPGRADES →"}
                {tutStep === 3 && "PROCEED TO GRADUATION PHASE →"}
                {tutStep === 4 && "COMPLETE GRADUATION & DEPLOY TO ACTIVE UNIVERSE ⚡"}
              </span>
            </motion.button>
          ) : (
            <div className="w-full py-2 px-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-center text-[10px] font-mono text-cyan-400/70 uppercase select-none">
              <span>
                {tutStep === 0 && "MANEUVER SHIP TO TRIGGER SYSTEM SYNC..."}
                {tutStep === 1 && "DESTROY ALL 3 TARGET ORBS TO CLEAR PHASE..."}
                {tutStep === 2 && "COLLECT ALL 3 AMETHYST SCRAPS TO REFUEL..."}
                {tutStep === 3 && "ACQUIRE EITHER POWER-UP IN THE SECTOR..."}
                {tutStep === 4 && "GRADUATION READY"}
              </span>
            </div>
          )}

          {/* Progress Gauge */}
          <div className="space-y-1 mt-0.5 select-none">
            <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-400 tracking-wider">
              <span>SIMULATION SYNC STATUS</span>
              <span className="text-cyan-400 uppercase">
                {tutStep === 0 && "IGNITION TRIGGER PENDING"}
                {tutStep === 1 && "TARGET LOCK ACTIVE"}
                {tutStep === 2 && "GRAVITY RECOVERY MATRIX ACTIVE"}
                {tutStep === 3 && "TACTICAL CORE INBOUND"}
                {tutStep === 4 && "HYPERDRIVE VECTORS LOCKED"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 border border-slate-800/80 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 transition-all duration-300 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                style={{ 
                  width: tutStep === 0 ? "20%" : tutStep === 1 ? `${Math.round((Math.max(0, 3 - (stateRef.current?.enemies?.length || 0)) / 3) * 100)}%` : tutStep === 2 ? `${Math.min(100, Math.round((tutProgress / 3) * 100))}%` : tutStep === 3 ? "80%" : "100%" 
                }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 1. TOP GAME STATUS BAR HUD */}
      <div className="absolute top-0 inset-x-0 h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-3.5 z-20 shadow-lg">
        {/* Score & Multiplier */}
        <div className="flex flex-col">
          <span className="text-slate-400 text-[8px] tracking-widest uppercase font-mono font-bold flex items-center gap-1">
            Score
            {score >= 100000 && (
              <span className="text-[7px] leading-none bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-black tracking-widest uppercase animate-pulse border border-purple-500/30">
                ANOMALY
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-black font-mono text-base tracking-tight">{score}</span>
            {stateRef.current.multiplier > 1.1 && (
              <span className="text-[9px] font-black bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono animate-pulse">
                x{stateRef.current.multiplier.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Health bar */}
        <div className="flex-1 max-w-[120px] mx-3">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-slate-400 text-[8px] uppercase tracking-widest font-mono font-bold">Shield</span>
            <span className={`text-[9px] font-mono font-black ${healthPercent < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
              {shield}/{maxShield}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 rounded-full ${
                healthPercent < 30 ? 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse' : 'bg-gradient-to-r from-cyan-500 to-teal-400'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* Currency Scrap & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full shadow-sm">
            <Coins className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 font-mono text-xs font-black">{scrap}</span>
          </div>

          <button 
            id="audio-music-btn"
            onClick={toggleMusic} 
            className={`p-1 rounded-xl border transition-all ${musicOn ? 'bg-slate-900/80 text-cyan-400 border-slate-700/50 shadow-md' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
          >
            {musicOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button 
            id="pause-btn"
            onClick={onPause} 
            className="px-2.5 py-1 bg-slate-900 border border-slate-700/50 text-slate-300 hover:text-white text-[9px] font-mono font-black rounded-sm skew-x-[-10deg] hover:bg-slate-800 transition shadow-md"
          >
            <span className="inline-block skew-x-[10deg]">PAUSE</span>
          </button>
        </div>
      </div>

      {/* 2. BOSS INCOMING BANNER ALERT */}
      {bossActive && (
        <div className={`absolute top-16 inset-x-4 backdrop-blur-md rounded-lg p-2.5 z-20 transition-all duration-300 ${
          bossImmune 
            ? 'bg-amber-950/85 border border-amber-500 shadow-lg shadow-amber-500/10' 
            : 'bg-red-950/80 border border-red-500/50 animate-pulse'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-ping ${bossImmune ? 'bg-amber-400' : 'bg-red-500'}`} />
              <span className={`text-xs font-bold font-mono tracking-wider uppercase ${bossImmune ? 'text-amber-400' : 'text-red-400'}`}>
                {bossImmune ? 'SHIELDING: OVERLOAD PROTOCOL' : `WARNING: ${bossName}`}
              </span>
            </div>
            <span className={`font-mono text-xs font-black tracking-wide uppercase px-1.5 py-0.5 rounded ${
              bossImmune ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-red-400'
            }`}>
              {bossImmune ? 'IMMUNE' : `${bossHealthPercent}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-150 ${bossImmune ? 'bg-gradient-to-r from-amber-500 to-yellow-300 animate-pulse' : 'bg-red-500'}`}
              style={{ width: `${bossImmune ? 100 : bossHealthPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* COSMIC WEATHER ALERT BANNER */}
      {cosmicWarningBanner && (
        <div className="absolute top-32 inset-x-4 bg-amber-950/95 border border-amber-500/60 backdrop-blur-md rounded-lg p-3 z-30 shadow-2xl text-center flex flex-col items-center justify-center animate-bounce">
          <span className="text-amber-400 text-[9px] uppercase tracking-widest font-mono font-bold animate-pulse">COSMIC EVENT DETECTED</span>
          <p className="text-white text-xs font-mono font-bold mt-1">{cosmicWarningBanner}</p>
        </div>
      )}

      {/* 3. ACTIVE POWERUP TIMERS */}
      <div className="absolute bottom-4 left-3 flex flex-col gap-1.5 z-20 pointer-events-none">
        {invincibilityDuration > 0 && (
          <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 backdrop-blur px-2.5 py-1 rounded-md text-purple-300">
            <Shield className="w-3 h-3 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium">SHIELD {invincibilityDuration}s</span>
          </div>
        )}
        {doubleDuration > 0 && (
          <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-500/40 backdrop-blur px-2.5 py-1 rounded-md text-blue-300">
            <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium">FIREPOWER {doubleDuration}s</span>
          </div>
        )}
        {magnetDuration > 0 && (
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 backdrop-blur px-2.5 py-1 rounded-md text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium">VACUUM {magnetDuration}s</span>
          </div>
        )}
        {timewarpDuration > 0 && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/40 backdrop-blur px-2.5 py-1 rounded-md text-cyan-300">
            <Hourglass className="w-3 h-3 text-cyan-400 animate-spin" />
            <span className="text-[10px] font-mono font-medium">TIME-WARP {timewarpDuration}s</span>
          </div>
        )}
      </div>

      {/* ACTIVE COSMIC WEATHER WIDGET */}
      {activeEvent !== 'none' && (
        <div className="absolute bottom-4 right-3 flex flex-col gap-1 z-20 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/50 backdrop-blur px-3 py-1.5 rounded-lg text-amber-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono">Weather</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-white">
                {activeEvent === 'warp' && '🌀 Hyperspace Warp'}
                {activeEvent === 'solar' && '☀️ Solar Flare'}
                {activeEvent === 'asteroid' && '☄️ Asteroid Rain'}
                {activeEvent === 'pulsar' && '⚡ Pulsar Sweep'}
              </span>
              <span className="text-[8px] text-amber-400 font-mono">Active: {eventTimeLeft}s left</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. CANVAS COMPONENT */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="w-full h-full cursor-pointer touch-none bg-slate-950"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Drag instruction overlay (vanishes after scoring 50 points) */}
      {score < 50 && (
        <div className="absolute bottom-16 inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10 animate-pulse">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest bg-slate-950/80 px-4 py-2 border border-slate-800 rounded-full">
            ← Drag or ARROWS/WASD to steer →
          </p>
          <span className="text-[9px] text-slate-500 font-mono mt-1">Weapons fire automatically!</span>
        </div>
      )}

      {/* ROGUELITE PICK-A-BUFF OVERLAY */}
      {showingBuffChoice && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center z-50 p-6 select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm flex flex-col items-center text-center"
          >
            {/* Crown icon / Alert header */}
            <div className="w-12 h-12 rounded-full border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 animate-bounce">
              <Award className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 uppercase">
              Sector Cleared
            </h2>
            <p className="text-[10px] font-mono font-bold uppercase text-cyan-500 tracking-wider mb-6">
              Vessel Refit: Select Refit Module
            </p>

            <div className="w-full flex flex-col gap-3.5">
              {buffOptions.map((buff) => {
                // Pick icon
                const IconComponent = buff.icon === 'zap' ? Zap
                  : buff.icon === 'shield' ? Shield
                  : buff.icon === 'heart' ? Heart
                  : buff.icon === 'magnet' ? Sparkles
                  : buff.icon === 'target' ? Target
                  : buff.icon === 'sparkles' ? Sparkles
                  : buff.icon === 'activity' ? AlertTriangle
                  : Award;

                return (
                  <button
                    key={buff.id}
                    onClick={() => applySelectedBuff(buff.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:bg-cyan-950/20 hover:border-cyan-500/50 transition-all duration-200 shadow-md group flex items-start gap-3"
                  >
                    <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 shrink-0 transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black font-mono tracking-tight text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {buff.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 leading-tight mt-1 group-hover:text-slate-300 transition-colors">
                        {buff.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-[8px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">
              Enhancements apply for the entire run duration
            </div>
          </motion.div>
        </div>
      )}

      {/* SELECT STARTER PHILOSOPHY OVERLAY (INSIDE GAME AFTER DEPLOY SHIP) */}
      {localStarterLoadout === null && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center z-50 p-6 select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm flex flex-col items-center text-center"
          >
            {/* Immersive pulsing header shield */}
            <div className="w-12 h-12 rounded-full border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
              <Shield className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase italic">
              Vessel Configuration
            </h2>
            <p className="text-[10px] font-mono font-bold uppercase text-cyan-500 tracking-wider mb-6">
              SELECT STARTER PHILOSOPHY
            </p>

            <div className="w-full flex flex-col gap-3">
              {[
                {
                  id: 'balanced',
                  name: 'Balanced Loadout',
                  desc: 'Standard hull plating (100 capacity shield) and standard balanced weapons cycle.',
                  icon: Shield,
                  activeClass: 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-cyan-500/10'
                },
                {
                  id: 'glass',
                  name: 'Glass Cannon',
                  desc: 'Fragile shield capacity (40 capacity shield), but gain +50% laser output yield and +10% speed!',
                  icon: Zap,
                  activeClass: 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] bg-rose-500/10'
                },
                {
                  id: 'tank',
                  name: 'Heavy Plate Tank',
                  desc: 'Immense plating (+80 capacity shield), but weapons cycle 30% slower and thruster responsiveness is reduced by 20%.',
                  icon: Battery,
                  activeClass: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-500/10'
                }
              ].map((opt) => {
                const isSelected = selectedTempLoadout === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedTempLoadout(opt.id as any);
                      SynthAudio.playCollect();
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 shadow-md flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? opt.activeClass 
                        : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border shrink-0 transition-colors ${
                      isSelected ? 'bg-slate-950 border-cyan-500/30 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11px] font-black font-mono tracking-tight transition-colors ${
                        isSelected ? 'text-white font-black' : 'text-slate-300'
                      }`}>
                        {opt.name.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 leading-snug mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setLocalStarterLoadout(selectedTempLoadout);
                if (onSelectStarterLoadout) {
                  onSelectStarterLoadout(selectedTempLoadout);
                }
                SynthAudio.playPowerup();
              }}
              className="w-full mt-6 py-3 bg-cyan-500 text-slate-950 font-black rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] hover:bg-cyan-400 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition duration-300 transform active:scale-[0.98] cursor-pointer"
            >
              <span>ENGAGE & LAUNCH VESSEL</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* EMERGENCY REVIVE AD PROMPT */}
      {showingRevivePrompt && !playingReviveAd && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-center items-center z-50 p-6 select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-5 text-center space-y-5 shadow-2xl relative"
          >
            {/* Pulsing red alarm marker */}
            <div className="mx-auto w-12 h-12 rounded-full border border-red-500/50 bg-red-500/10 flex items-center justify-center text-red-400 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-red-500 font-bold tracking-widest animate-pulse block">
                ⚠️ SHIELD ENERGY DEPLETED
              </span>
              <h3 className="text-lg font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-red-400 italic tracking-widest font-sans">
                EMERGENCY REVIVE
              </h3>
            </div>

            <p className="text-[10px] text-slate-350 leading-relaxed font-mono px-2">
              Vessel core integrity critical. Watch a short sponsor broadcast to completely restore ship shield and blast away current threats!
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                id="revive-watch-ad-btn"
                onClick={() => {
                  SynthAudio.playCollect();
                  setPlayingReviveAd(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-sm skew-x-[-10deg] shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] tracking-widest transition text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4 fill-current text-slate-950 skew-x-[10deg]" />
                <span className="inline-block skew-x-[10deg] uppercase font-black text-[10px]">WATCH AD TO REVIVE</span>
              </button>
              
              <button
                id="revive-decline-btn"
                onClick={() => {
                  SynthAudio.playGameOver();
                  setShowingRevivePrompt(false);
                  onGameOver(Math.round(stateRef.current.score), stateRef.current.scrap, stateRef.current.enemiesKilled);
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 rounded-sm skew-x-[-10deg] font-bold tracking-widest transition text-[9px] uppercase cursor-pointer"
              >
                <span className="inline-block skew-x-[10deg]">DECLINE & ABORT SORTIE</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* REWARDED AD PLAYING OVERLAY */}
      {playingReviveAd && (
        <AdPlayerOverlay
          adName="revive_ad"
          onReward={handleReviveSuccess}
          onCancel={() => {
            setPlayingReviveAd(false);
          }}
        />
      )}

    </div>
  );
}
