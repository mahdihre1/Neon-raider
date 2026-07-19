/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upgrades, GameStats, Achievement, SHIP_SKINS } from './types';
import { SynthAudio } from './utils/audio';
import GameBoard from './components/GameBoard';
import UpgradesStore from './components/UpgradesStore';
import StatsPanel from './components/StatsPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import UsernameModal from './components/UsernameModal';
import { AdPlayerOverlay } from './components/AdPlayerOverlay';
import CompliancePages from './components/CompliancePages';
import { submitHighScore } from './lib/firebase';
import { 
  Shield, 
  Zap, 
  Sparkles, 
  Award, 
  Trophy, 
  Coins, 
  Settings, 
  Play, 
  Gamepad2, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Info,
  Smartphone,
  ChevronRight,
  User,
  Loader,
  Battery,
  Heart,
  RefreshCw,
  Tv
} from 'lucide-react';

const LOCAL_STORAGE_UPGRADES_KEY = 'neon_raider_upgrades_v1';
const LOCAL_STORAGE_STATS_KEY = 'neon_raider_stats_v1';
const LOCAL_STORAGE_USERNAME_KEY = 'neon_raider_username_v1';

const INITIAL_UPGRADES: Upgrades = {
  maxShield: 1,
  fireRate: 1,
  scrapMagnet: 1,
  weaponType: 1,
  companionDrone: 0,
  plasmaArmor: 0,
  criticalChance: 0,
  selectedSkin: 'cyan',
  unlockedSkins: ['cyan'],
  selectedWeapon: 'plasma',
  weaponPlasmaLevel: 1,
  weaponIonLevel: 1,
  weaponWaveLevel: 1,
  weaponNeutronLevel: 1,
  weaponTeslaLevel: 1
};

const INITIAL_STATS: GameStats = {
  highScore: 0,
  totalScrap: 0,
  accumulatedScrap: 0,
  runsPlayed: 0,
  enemiesDestroyed: 0
};

const INITIAL_ACHIEVEMENTS = [
  { id: 'first_flight', title: 'First Sortie', description: 'Launched your space fighter into the asteroid belt.', unlocked: false, icon: 'play', progressMax: 1, progressCurrent: 0 },
  { id: 'boss_slayer', title: 'Elite Hunter', description: 'Destroyed a giant Neon Boss mothership.', unlocked: false, icon: 'target', progressMax: 1, progressCurrent: 0 },
  { id: 'scrap_baron', title: 'Scrap Baron', description: 'Accumulated 200 total permanent neon scrap.', unlocked: false, icon: 'coins', progressMax: 200, progressCurrent: 0 },
  { id: 'neon_legend', title: 'Cosmic Legend', description: 'Scored 3,000 or more points in a single run.', unlocked: false, icon: 'trophy', progressMax: 3000, progressCurrent: 0 },
  { id: 'vigilante', title: 'Vigilante', description: 'Defeated a total of 100 enemies.', unlocked: false, icon: 'zap', progressMax: 100, progressCurrent: 0 }
];

export default function App() {
  const [gameState, setGameState] = useState<'splash' | 'game' | 'upgrades' | 'stats' | 'gameover' | 'leaderboard'>('splash');
  const [paused, setPaused] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceTab, setComplianceTab] = useState<'about' | 'privacy' | 'contact'>('about');

  // Starter philosophy & death insights
  const [starterLoadout, setStarterLoadout] = useState<'balanced' | 'glass' | 'tank'>('balanced');
  const [deathCause, setDeathCause] = useState<string | null>(null);
  const [suggestedUpgrade, setSuggestedUpgrade] = useState<string | null>(null);

  // Username & Leaderboard states
  const [username, setUsername] = useState<string>('PILOT_RAIDER');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submittedThisRun, setSubmittedThisRun] = useState(false);

  // Tutorial modes state
  const [tutorialActive, setTutorialActive] = useState(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [gameMode, setGameMode] = useState<'normal' | 'story'>('normal');

  // Persistence States
  const [upgrades, setUpgrades] = useState<Upgrades>(INITIAL_UPGRADES);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Audio settings
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);

  // Current Run States
  const [currentRun, setCurrentRun] = useState({
    score: 0,
    scrap: 0,
    enemiesKilled: 0,
    isNewHighScore: false,
    unlockedMedalsThisRun: [] as string[]
  });

  // Rewarded Video Ad double scraps states
  const [scrapsDoubled, setScrapsDoubled] = useState(false);
  const [playingDoubleAd, setPlayingDoubleAd] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedUpgrades = localStorage.getItem(LOCAL_STORAGE_UPGRADES_KEY);
      if (storedUpgrades) {
        setUpgrades({
          ...INITIAL_UPGRADES,
          ...JSON.parse(storedUpgrades),
          selectedWeapon: 'plasma'
        });
      }

      const storedStats = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
      if (storedStats) {
        const loadedStats = JSON.parse(storedStats);
        setStats(loadedStats);
        recalculateAchievements(loadedStats);
      }

      const storedUsername = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        const generated = 'RAIDER_' + Math.floor(100 + Math.random() * 900);
        setUsername(generated);
        setShowUsernameModal(true);
      }
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }
  }, []);

  // Sync volume settings to synth controller
  useEffect(() => {
    SynthAudio.musicEnabled = musicOn;
    SynthAudio.sfxEnabled = sfxOn;
  }, [musicOn, sfxOn]);

  const saveToStorage = (newUpgrades: Upgrades, newStats: GameStats) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_UPGRADES_KEY, JSON.stringify(newUpgrades));
      localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  const handleSaveUsername = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, newUsername);
    setShowUsernameModal(false);
  };

  // Check and update achievements based on permanent stats
  const recalculateAchievements = (currentStats: GameStats): Achievement[] => {
    const updated = INITIAL_ACHIEVEMENTS.map(ach => {
      let progress = 0;
      let unlocked = false;

      if (ach.id === 'first_flight') {
        progress = currentStats.runsPlayed > 0 ? 1 : 0;
        unlocked = progress >= ach.progressMax;
      } else if (ach.id === 'boss_slayer') {
        // Boss slayer state
        progress = currentStats.enemiesDestroyed >= 1 ? 1 : 0; // Simplified tracker or set true if boss killed
        unlocked = currentStats.highScore >= 1500; // Slaying a boss matches 1500 score milestone
      } else if (ach.id === 'scrap_baron') {
        progress = currentStats.accumulatedScrap;
        unlocked = progress >= ach.progressMax;
      } else if (ach.id === 'neon_legend') {
        progress = currentStats.highScore;
        unlocked = progress >= ach.progressMax;
      } else if (ach.id === 'vigilante') {
        progress = currentStats.enemiesDestroyed;
        unlocked = progress >= ach.progressMax;
      }

      return {
        ...ach,
        progressCurrent: Math.min(ach.progressMax, progress),
        unlocked
      };
    });

    setAchievements(updated);
    return updated;
  };

  // Run start handler
  const handleStartGame = () => {
    SynthAudio.playCollect();
    const tutorialCompleted = localStorage.getItem('neon_raider_tutorial_completed_v1') === 'true';
    if (!tutorialCompleted) {
      setShowTutorialPrompt(true);
    } else {
      setTutorialActive(false);
      setPaused(false);
      setGameState('game');
      SynthAudio.startMusic();
    }
  };

  const handleTutorialComplete = () => {
    SynthAudio.playPowerup();
    localStorage.setItem('neon_raider_tutorial_completed_v1', 'true');
    
    // Award a handsome onboarding bonus: 150 Amethyst Scraps!
    const updatedStats = {
      ...stats,
      totalScrap: stats.totalScrap + 150,
      accumulatedScrap: stats.accumulatedScrap + 150
    };
    setStats(updatedStats);
    saveToStorage(upgrades, updatedStats);
    
    setTutorialActive(false);
    setGameState('splash');
  };

  // Run Game over handler
  const handleGameOver = (finalScore: number, scrapSalvaged: number, enemiesKilled: number, dCause?: string, sUpgrade?: string) => {
    SynthAudio.stopMusic();
    setScrapsDoubled(false);

    setDeathCause(dCause || "Vessel hull integrity compromised due to excessive energy drain.");
    setSuggestedUpgrade(sUpgrade || "Nano-Shield Capacity (increases max shield and survival window).");

    const isNewHighScore = finalScore > stats.highScore;
    const nextHighScore = isNewHighScore ? finalScore : stats.highScore;
    const nextTotalScrap = stats.totalScrap + scrapSalvaged;
    const nextAccumulatedScrap = stats.accumulatedScrap + scrapSalvaged;
    const nextRuns = stats.runsPlayed + 1;
    const nextEnemies = stats.enemiesDestroyed + enemiesKilled;

    const updatedStats: GameStats = {
      highScore: nextHighScore,
      totalScrap: nextTotalScrap,
      accumulatedScrap: nextAccumulatedScrap,
      runsPlayed: nextRuns,
      enemiesDestroyed: nextEnemies
    };

    // Recalculate Achievements and detect if any medals were newly unlocked this specific run
    const priorAchievements = [...achievements];
    const newAchievements = recalculateAchievements(updatedStats);
    
    const unlockedMedalsThisRun: string[] = [];
    newAchievements.forEach((ach, index) => {
      if (ach.unlocked && !priorAchievements[index].unlocked) {
        unlockedMedalsThisRun.push(ach.title);
      }
    });

    setStats(updatedStats);
    saveToStorage(upgrades, updatedStats);

    setCurrentRun({
      score: finalScore,
      scrap: scrapSalvaged,
      enemiesKilled,
      isNewHighScore,
      unlockedMedalsThisRun
    });

    setGameState('gameover');
    setSubmittedThisRun(false);

    // Auto-submit score to the live leaderboard if > 0
    if (finalScore > 0) {
      setIsSubmittingScore(true);
      submitHighScore(username, finalScore).then((success) => {
        setIsSubmittingScore(false);
        setSubmittedThisRun(success);
      }).catch((err) => {
        console.error("Leaderboard submission error:", err);
        setIsSubmittingScore(false);
      });
    }
  };

  const handleDoubleScrapsSuccess = () => {
    const extraScrap = currentRun.scrap;
    setCurrentRun(prev => ({
      ...prev,
      scrap: prev.scrap * 2
    }));

    const updatedStats = {
      ...stats,
      totalScrap: stats.totalScrap + extraScrap,
      accumulatedScrap: stats.accumulatedScrap + extraScrap
    };

    setStats(updatedStats);
    saveToStorage(upgrades, updatedStats);

    setScrapsDoubled(true);
    setPlayingDoubleAd(false);
  };

  // Purchase standard level upgrades
  const handlePurchaseUpgrade = (key: keyof Omit<Upgrades, 'selectedSkin' | 'unlockedSkins'>, cost: number) => {
    const updatedUpgrades = {
      ...upgrades,
      [key]: (upgrades[key] as number) + 1
    };

    const updatedStats = {
      ...stats,
      totalScrap: stats.totalScrap - cost
    };

    setUpgrades(updatedUpgrades);
    setStats(updatedStats);
    recalculateAchievements(updatedStats);
    saveToStorage(updatedUpgrades, updatedStats);
  };

  // Unlock custom ship skins
  const handleUnlockSkin = (skinId: string, cost: number) => {
    const updatedUpgrades = {
      ...upgrades,
      unlockedSkins: [...upgrades.unlockedSkins, skinId],
      selectedSkin: skinId // Auto equip on unlock
    };

    const updatedStats = {
      ...stats,
      totalScrap: stats.totalScrap - cost
    };

    setUpgrades(updatedUpgrades);
    setStats(updatedStats);
    recalculateAchievements(updatedStats);
    saveToStorage(updatedUpgrades, updatedStats);
  };

  // Change active skin
  const handleSelectSkin = (skinId: string) => {
    const updatedUpgrades = {
      ...upgrades,
      selectedSkin: skinId
    };
    setUpgrades(updatedUpgrades);
    saveToStorage(updatedUpgrades, stats);
  };

  // Change active weapon
  const handleSelectWeapon = (weaponId: string) => {
    const updatedUpgrades = {
      ...upgrades,
      selectedWeapon: weaponId
    };
    setUpgrades(updatedUpgrades);
    saveToStorage(updatedUpgrades, stats);
  };

  const handlePause = () => {
    setPaused(true);
    SynthAudio.playCollect();
  };

  const handleResume = () => {
    setPaused(false);
    SynthAudio.playCollect();
  };

  const handleReturnToMenu = () => {
    setPaused(false);
    setGameState('splash');
    SynthAudio.stopMusic();
    SynthAudio.playCollect();
  };

  const toggleSound = () => {
    const next = !sfxOn;
    setSfxOn(next);
    SynthAudio.sfxEnabled = next;
  };

  const toggleMusicLocal = () => {
    const next = !musicOn;
    setMusicOn(next);
    SynthAudio.musicEnabled = next;
    if (next && gameState === 'game') {
      SynthAudio.startMusic();
    } else {
      SynthAudio.stopMusic();
    }
  };

  // Find active ship skin color details
  const activeSkinObj = SHIP_SKINS.find(s => s.id === upgrades.selectedSkin) || SHIP_SKINS[0];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-6 overflow-hidden relative selection:bg-cyan-500/30 selection:text-white">
      {/* Dynamic atmospheric radial dot grid background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* 3D COMMAND DECK: Flexible row layout on desktop, center column on mobile */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 xl:gap-8 w-full max-w-6xl z-10 transition-all">

        {/* LEFT DECK PANEL: PILOT INSTRUMENTS & HUD MANUAL (Desktop Only) */}
        <div className="hidden lg:flex flex-col w-64 h-[840px] bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-5 backdrop-blur-md justify-between select-none text-slate-300 font-sans shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Gamepad2 className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-black font-mono tracking-wider text-slate-100 uppercase">SYS MONITOR</h3>
                <p className="text-[9px] font-mono text-emerald-400">● FLIGHT DECK SECURE</p>
              </div>
            </div>

            {/* Flight Controls Instruction Module */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 block">Flight Controls</span>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 space-y-2 font-mono text-[9px] text-slate-300 leading-relaxed shadow-inner">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">A</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">S</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">D</span>
                  <span className="text-slate-500">/</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">ARROWS</span>
                </div>
                <p className="text-slate-400 text-[8px] leading-snug">Press keyboard arrows or keys to move fighter vessel.</p>
                
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/50 mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">MOUSE</span>
                  <span className="text-slate-500">/</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">TOUCH DRAG</span>
                </div>
                <p className="text-slate-400 text-[8px] leading-snug">Drag anywhere on or near simulation screen to guide ship.</p>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/50 mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">ESC</span>
                  <span className="text-slate-500">/</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">P</span>
                </div>
                <p className="text-slate-400 text-[8px] leading-snug">Instantly pause active simulation runs.</p>
              </div>
            </div>

            {/* Active Philosophy details */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 block">Hull Philosophy</span>
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 space-y-2 font-mono text-[9px] shadow-inner">
                <div className={`p-1.5 rounded-lg border transition-all ${starterLoadout === 'balanced' ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300' : 'bg-transparent border-transparent text-slate-500'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-[8px]">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>BALANCED CORES</span>
                  </div>
                  <p className="text-[7px] text-slate-400 leading-snug mt-0.5">100 capacity shield, standard cooling rate.</p>
                </div>
                <div className={`p-1.5 rounded-lg border transition-all ${starterLoadout === 'glass' ? 'bg-rose-950/20 border-rose-500/40 text-rose-300' : 'bg-transparent border-transparent text-slate-500'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-[8px]">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>GLASS CANNON</span>
                  </div>
                  <p className="text-[7px] text-rose-450 leading-snug mt-0.5">+50% raw damage yield, -60% shield capacity.</p>
                </div>
                <div className={`p-1.5 rounded-lg border transition-all ${starterLoadout === 'tank' ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-transparent border-transparent text-slate-500'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-[8px]">
                    <Battery className="w-3.5 h-3.5 shrink-0" />
                    <span>HEAVY PLATE TANK</span>
                  </div>
                  <p className="text-[7px] text-slate-450 leading-snug mt-0.5">+80 max shield hull, weapon cycles 30% slower.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick specs footer */}
          <div className="space-y-1.5 pt-3 border-t border-slate-850 text-center font-mono text-[8px] text-slate-500 uppercase tracking-widest leading-none">
            <p className="text-cyan-400/70">Vessel: Raider Starfighter</p>
            <p>Firmware: v1.9.5-A</p>
          </div>
        </div>

        {/* MOBILE CONTAINER WRAPPER - Curved smartphone frame for desktop, seamlessly full-screen on true mobiles */}
        <div className="relative w-full max-w-md h-[100vh] sm:h-[840px] bg-slate-950 sm:rounded-[36px] overflow-hidden border-0 sm:border-8 border-slate-900/80 shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col transition-all">
        
        {/* Phone Dynamic Bezel / Speaker Notch for Desktop */}
        <div className="hidden sm:block absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-center z-50">
          <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-center gap-1.5 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* SCREEN FRAME CONTAINER */}
        <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden sm:mt-6">
          <AnimatePresence mode="wait">
            
            {/* 1. SPLASH SCREEN (FLIGHT DECK DASHBOARD) */}
            {gameState === 'splash' && (
              <motion.div 
                key="splash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-between bg-slate-950/40 p-4 sm:p-6 font-sans text-slate-200 overflow-y-auto scrollbar-none"
              >
                {/* Upper Status controls */}
                <div className="flex justify-between items-center z-10">
                  <div 
                    onClick={() => { SynthAudio.playCollect(); setShowUsernameModal(true); }}
                    className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md p-1 pr-3.5 rounded-full border border-slate-800 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900 transition-all group select-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border border-slate-700 flex items-center justify-center font-black text-xs text-white group-hover:from-cyan-300 group-hover:to-blue-500 transition-all">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[100px]">
                      <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold">Commander</span>
                      <span className="text-[10px] font-bold tracking-tight text-white font-mono truncate">{username}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      id="music-toggle-menu"
                      onClick={toggleMusicLocal}
                      className={`p-1.5 rounded-xl border transition-all ${musicOn ? 'bg-slate-900/80 text-cyan-400 border-slate-700/50 shadow-lg' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
                    >
                      {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button 
                      id="sfx-toggle-menu"
                      onClick={toggleSound}
                      className={`px-2.5 py-1 rounded-xl border text-[9px] font-mono font-bold transition-all ${sfxOn ? 'bg-slate-900/80 text-cyan-400 border-slate-700/50 shadow-lg' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
                    >
                      SFX
                    </button>
                  </div>
                </div>

                {/* Ambient Scrolling Synth Logo Design */}
                <div className="flex-1 flex flex-col items-center justify-center py-4 text-center z-10">
                  {/* Decorative Glowing Ship Icon - Compact on Mobile */}
                  <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-14 h-14 sm:w-20 sm:h-20 mb-3 sm:mb-6 relative flex items-center justify-center bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl"
                  >
                    <svg 
                      className="w-8 h-8 sm:w-11 sm:h-11 transition-all duration-300"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={activeSkinObj.color} 
                      strokeWidth="2"
                    >
                      <path 
                        d="M12 2L4 21l8-4 8 4-8-19z" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill={`${activeSkinObj.color}20`}
                        className="animate-pulse"
                      />
                    </svg>
                  </motion.div>

                  <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 italic uppercase select-none">
                    Neon Raider
                  </h1>
                  <p className="text-cyan-400 font-mono tracking-[0.3em] text-[9px] sm:text-[10px] mt-1 sm:mt-2 uppercase opacity-80">
                    DEEP SPACE COMBAT SIMULATOR
                  </p>

                  {/* Active Ship Specs */}
                  <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 sm:py-2.5 rounded-xl flex items-center gap-2 max-w-[280px] mt-3 sm:mt-6 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: activeSkinObj.color }} />
                    <div className="text-left">
                      <p className="text-[8px] text-slate-500 font-mono tracking-wider">SELECTED VESSEL</p>
                      <p className="text-[11px] font-bold text-slate-200 font-mono uppercase">{activeSkinObj.name}</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Action Navigation Buttons */}
                <div className="space-y-3 sm:space-y-4 z-10">
                  {/* GAME MODE SELECTION CARD */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col gap-1.5 font-mono shadow-md">
                    <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest text-center uppercase">SELECT MISSION MODULE</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { SynthAudio.playCollect(); setGameMode('normal'); }}
                        className={`py-1.5 px-1 rounded-lg border text-[9px] sm:text-[10px] font-black tracking-tight transition duration-200 flex flex-col items-center gap-0.5 ${
                          gameMode === 'normal' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                            : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Zap className={`w-3 h-3 ${gameMode === 'normal' ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span>NORMAL ARCADE</span>
                      </button>
                      <button
                        onClick={() => { SynthAudio.playCollect(); setGameMode('story'); }}
                        className={`py-1.5 px-1 rounded-lg border text-[9px] sm:text-[10px] font-black tracking-tight transition duration-200 flex flex-col items-center gap-0.5 ${
                          gameMode === 'story' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse' 
                            : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className={`w-3 h-3 ${gameMode === 'story' ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span>CLUCK STORY</span>
                      </button>
                    </div>
                    <p className="text-[7px] sm:text-[8px] text-slate-400 text-center opacity-80 leading-snug">
                      {gameMode === 'normal' 
                        ? "Continuous cosmic hazards & scaling enemy toughness." 
                        : "Goofy multi-wave narrative campaign. Defeat the space hens!"}
                    </p>
                  </div>

                  {/* PLAY TRIGGER - Skewed Deploy style! */}
                  <button
                    id="play-game-btn"
                    onClick={handleStartGame}
                    className="w-full py-3.5 bg-cyan-500 text-slate-950 font-black rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:bg-cyan-400 uppercase tracking-widest text-base flex items-center justify-center gap-2 transition duration-300 transform active:scale-[0.98] select-none cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current text-slate-950" />
                    <span>DEPLOY SHIP</span>
                  </button>

                  {/* HIGH-CONTRAST CONSOLE DECK BUTTONS - Guaranteed display with flex structure */}
                  <div className="flex justify-between items-stretch gap-2 w-full">
                    {/* HANGAR STORE */}
                    <button
                      id="open-store-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('upgrades'); }}
                      className="flex-1 py-3 px-1.5 bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-200 rounded-xl text-[9px] sm:text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1.5 font-mono shadow-md cursor-pointer group active:scale-[0.97]"
                    >
                      <Coins className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform duration-200" />
                      <div className="flex flex-col items-center">
                        <span className="uppercase text-slate-300">HANGAR</span>
                        <span className="text-[8px] text-yellow-400 font-black">({stats.totalScrap})</span>
                      </div>
                    </button>

                    {/* RECORDS AND STATS */}
                    <button
                      id="open-stats-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('stats'); }}
                      className="flex-1 py-3 px-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 rounded-xl text-[9px] sm:text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1.5 font-mono shadow-md cursor-pointer group active:scale-[0.97]"
                    >
                      <Award className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
                      <div className="flex flex-col items-center">
                        <span className="uppercase text-slate-300">RECORDS</span>
                        <span className="text-[8px] text-cyan-400 font-bold">BEST: {stats.highScore}</span>
                      </div>
                    </button>

                    {/* LIVE LEADERBOARD */}
                    <button
                      id="open-leaderboard-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('leaderboard'); }}
                      className="flex-1 py-3 px-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-200 rounded-xl text-[9px] sm:text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1.5 font-mono shadow-md cursor-pointer group active:scale-[0.97]"
                    >
                      <Trophy className="w-4 h-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform duration-200" />
                      <div className="flex flex-col items-center">
                        <span className="uppercase text-slate-300">LEADERS</span>
                        <span className="text-[8px] text-amber-400 font-bold">TOP RANKS</span>
                      </div>
                    </button>
                  </div>

                  {/* FLIGHT ACADEMY TRAINING PORTAL */}
                  <button
                    onClick={() => {
                      SynthAudio.playCollect();
                      setTutorialActive(true);
                      setPaused(false);
                      setGameState('game');
                      SynthAudio.startMusic();
                    }}
                    className="w-full py-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 font-bold rounded-lg text-[9px] font-mono tracking-widest transition flex items-center justify-center gap-1.5 uppercase shadow-sm cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>LAUNCH FLIGHT ACADEMY</span>
                  </button>

                  {/* Simple Touch controls hint */}
                  <div className="text-center pt-1.5 text-[8px] text-slate-500 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-900/20 py-1.5 rounded-lg border border-slate-850">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                    <span>SYSTEM STATUS: ALL SYSTEMS NOMINAL</span>
                  </div>

                  {/* Compliance Policy Footers */}
                  <div className="flex justify-center items-center gap-3.5 text-[9px] font-mono text-slate-500 pt-1">
                    <button
                      onClick={() => { SynthAudio.playCollect(); setComplianceTab('about'); setShowCompliance(true); }}
                      className="hover:text-cyan-400 transition-colors uppercase cursor-pointer"
                    >
                      About
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => { SynthAudio.playCollect(); setComplianceTab('privacy'); setShowCompliance(true); }}
                      className="hover:text-cyan-400 transition-colors uppercase cursor-pointer"
                    >
                      Privacy
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => { SynthAudio.playCollect(); setComplianceTab('contact'); setShowCompliance(true); }}
                      className="hover:text-cyan-400 transition-colors uppercase cursor-pointer"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. GAMEPLAY COMPONENT */}
            {gameState === 'game' && (
              <motion.div 
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <GameBoard
                  upgrades={upgrades}
                  paused={paused}
                  setPaused={setPaused}
                  onPause={handlePause}
                  onGameOver={handleGameOver}
                  isTutorial={tutorialActive}
                  onTutorialComplete={handleTutorialComplete}
                  gameMode={gameMode}
                  starterLoadout={starterLoadout}
                  onSelectStarterLoadout={setStarterLoadout}
                  musicOn={musicOn}
                  setMusicOn={setMusicOn}
                  sfxOn={sfxOn}
                  setSfxOn={setSfxOn}
                />

                {/* PAUSE SCREEN MODAL OVERLAY */}
                {paused && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6 w-full max-w-[280px] text-center space-y-5 shadow-2xl backdrop-blur-md"
                    >
                      <h3 className="text-base font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic tracking-widest font-sans">SORTIE PAUSED</h3>
                      
                      <div className="space-y-3">
                        <button
                          id="resume-btn"
                          onClick={handleResume}
                          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm skew-x-[-10deg] shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] font-black tracking-widest transition text-xs"
                        >
                          <span className="inline-block skew-x-[10deg]">RESUME MISSION</span>
                        </button>
                        <button
                          id="quit-btn"
                          onClick={handleReturnToMenu}
                          className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-sm skew-x-[-10deg] font-bold tracking-widest transition text-xs"
                        >
                          <span className="inline-block skew-x-[10deg]">ABORT SORTIE</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. STORE COMPONENT */}
            {gameState === 'upgrades' && (
              <motion.div 
                key="upgrades"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute inset-0"
              >
                <UpgradesStore
                  upgrades={upgrades}
                  totalScrap={stats.totalScrap}
                  onPurchaseUpgrade={handlePurchaseUpgrade}
                  onUnlockSkin={handleUnlockSkin}
                  onSelectSkin={handleSelectSkin}
                  onSelectWeapon={handleSelectWeapon}
                  onClose={() => setGameState('splash')}
                />
              </motion.div>
            )}

            {/* 4. STATS RECORDS PANEL */}
            {gameState === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute inset-0"
              >
                <StatsPanel
                  stats={stats}
                  achievements={achievements}
                  onClose={() => setGameState('splash')}
                />
              </motion.div>
            )}

            {/* 5. GAME OVER SUMMARY REPORT */}
            {gameState === 'gameover' && (
              <motion.div 
                key="gameover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 p-6 flex flex-col justify-between font-sans text-slate-100 overflow-y-auto scrollbar-none"
              >
                {/* Header */}
                <div className="text-center py-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-black bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    SHIP CORE DE-STABILIZED
                  </span>
                  <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 italic mt-3 tracking-tighter">
                    Sortie Terminated
                  </h2>
                </div>

                {/* Score and Scrap Review */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 my-auto backdrop-blur-sm shadow-xl">
                  
                  {/* Score details */}
                  <div className="text-center pb-4 border-b border-slate-800/80">
                    <p className="text-[9px] font-mono uppercase text-slate-500 tracking-widest font-bold">TOTAL SCORE RECORDED</p>
                    <p className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight mt-1">{currentRun.score}</p>
                    
                    {currentRun.isNewHighScore && (
                      <span className="inline-block mt-2 text-[9px] font-mono font-black bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-full animate-bounce uppercase tracking-wider">
                        👑 NEW SECTOR RECORD!
                      </span>
                    )}

                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                      {isSubmittingScore ? (
                        <>
                          <Loader className="w-3 h-3 text-cyan-400 animate-spin" />
                          <span>Syncing sector score...</span>
                        </>
                      ) : submittedThisRun ? (
                        <span className="text-emerald-400 font-bold">✓ Telemetry synced to live leaderboard</span>
                      ) : (
                        <span className="text-slate-600">Off-line Telemetry</span>
                      )}
                    </div>
                  </div>

                  {/* Multi-stats overview */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 shadow-inner">
                      <p className="text-[8px] font-mono uppercase text-slate-500 font-bold tracking-wider">Scrap Salvaged</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Coins className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                        <span className="text-sm font-black font-mono text-yellow-400">+{currentRun.scrap}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 shadow-inner">
                      <p className="text-[8px] font-mono uppercase text-slate-500 font-bold tracking-wider">Kills Confirmed</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-sm font-black font-mono text-cyan-300">{currentRun.enemiesKilled}</span>
                      </div>
                    </div>
                  </div>

                  {/* DOUBLE SCRAP AD BUTTON */}
                  {currentRun.scrap > 0 && (
                    <div className="pt-1">
                      <button
                        id="double-scrap-ad-btn"
                        disabled={scrapsDoubled}
                        onClick={() => {
                          SynthAudio.playCollect();
                          setPlayingDoubleAd(true);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl border font-mono uppercase text-[9px] tracking-wider transition flex items-center justify-center gap-2 font-bold cursor-pointer select-none active:scale-[0.98] ${
                          scrapsDoubled
                            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border-amber-500/30 hover:border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse'
                        }`}
                      >
                        {scrapsDoubled ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>✓ SCRAPS DOUBLE CREDITED!</span>
                          </>
                        ) : (
                          <>
                            <Tv className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                            <span>📺 Watch Ad to Double Scrap (+{currentRun.scrap})!</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Death Analysis Review Panel */}
                  {deathCause && (
                    <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-red-400 font-bold font-mono text-[9px] uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>TACTICAL CASUALTY REPORT</span>
                      </div>
                      <p className="text-[10px] text-slate-200 font-sans italic leading-relaxed">
                        &ldquo;{deathCause}&rdquo;
                      </p>
                      {suggestedUpgrade && (
                        <div className="pt-1.5 border-t border-red-500/20 text-[9px] font-mono text-slate-450">
                          <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">RECOMMENDED COUNTERMEASURE</span>
                          {suggestedUpgrade}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Achievements Unlocked Alert popup */}
                  {currentRun.unlockedMedalsThisRun.length > 0 && (
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest">Medals Earned!</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentRun.unlockedMedalsThisRun.map((m, idx) => (
                          <span key={idx} className="text-[9px] bg-cyan-500/10 text-slate-200 border border-cyan-500/20 px-2.5 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="space-y-4">
                  {/* Retry Sortie */}
                  <button
                    id="retry-sortie-btn"
                    onClick={handleStartGame}
                    className="w-full py-4 bg-cyan-500 text-slate-950 font-black rounded-sm skew-x-[-12deg] shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:bg-cyan-400 uppercase tracking-widest text-base flex items-center justify-center gap-2 transition duration-300 transform active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 skew-x-[12deg]">
                      <Play className="w-5 h-5 fill-current text-slate-950" />
                      <span>LAUNCH NEW SORTIE</span>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Hangar Upgrades store */}
                    <button
                      id="goto-upgrades-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('upgrades'); }}
                      className="py-3 px-4 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-1.5 font-mono shadow-md"
                    >
                      <Coins className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                      <span>HANGAR</span>
                    </button>

                    {/* Flight Deck Return */}
                    <button
                      id="goto-deck-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('splash'); }}
                      className="py-3 px-4 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-1.5 font-mono shadow-md"
                    >
                      <span>FLIGHT DECK</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. LIVE LEADERBOARD COMPONENT */}
            {gameState === 'leaderboard' && (
              <motion.div 
                key="leaderboard"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute inset-0"
              >
                <LeaderboardPanel
                  currentUsername={username}
                  onClose={() => setGameState('splash')}
                />
              </motion.div>
            )}



          </AnimatePresence>

          {showCompliance && (
            <CompliancePages
              onClose={() => setShowCompliance(false)}
              initialTab={complianceTab}
            />
          )}

          {showUsernameModal && (
            <UsernameModal
              currentUsername={username}
              onSave={handleSaveUsername}
              onClose={() => setShowUsernameModal(false)}
              canCancel={!!localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY)}
            />
          )}

          {showTutorialPrompt && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-[300px] shadow-2xl space-y-4 text-center">
                {/* CYBERNETIC EMBLEM */}
                <div className="mx-auto w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Award className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic tracking-wider font-sans">
                    ACADEMY TRAINING
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">ENROLL IN PILOT SIMULATOR COURSE</p>
                </div>

                <div className="text-[10px] text-slate-300 font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-850 text-left leading-relaxed space-y-1.5">
                  <p className="text-cyan-400 font-bold">• Learn basic flight controls</p>
                  <p className="text-cyan-400 font-bold">• Master targeting & scrap collection</p>
                  <p className="text-yellow-400 font-black">• Earn +150 Amethyst Scrap Bonus!</p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowTutorialPrompt(false);
                      setTutorialActive(true);
                      setPaused(false);
                      setGameState('game');
                      SynthAudio.startMusic();
                    }}
                    className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm skew-x-[-10deg] shadow-[0_0_15px_rgba(34,211,238,0.2)] font-black tracking-widest transition text-[10px]"
                  >
                    <span className="inline-block skew-x-[10deg]">START TRAINING</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowTutorialPrompt(false);
                      localStorage.setItem('neon_raider_tutorial_completed_v1', 'true');
                      setTutorialActive(false);
                      setPaused(false);
                      setGameState('game');
                      SynthAudio.startMusic();
                    }}
                    className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 rounded-sm skew-x-[-10deg] font-bold tracking-widest transition text-[9px]"
                  >
                    <span className="inline-block skew-x-[10deg]">SKIP & DEPLOY</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {playingDoubleAd && (
            <AdPlayerOverlay
              adName="double_scraps"
              onReward={handleDoubleScrapsSuccess}
              onCancel={() => {
                setPlayingDoubleAd(false);
              }}
            />
          )}
        </div>
      </div>

        {/* RIGHT DECK PANEL: PILOT RECORDS & ACHIEVEMENT STATUS (Desktop Only) */}
        <div className="hidden lg:flex flex-col w-64 h-[840px] bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-5 backdrop-blur-md justify-between select-none text-slate-300 font-sans shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-black font-mono tracking-wider text-slate-100 uppercase">PILOT LOG</h3>
                <p className="text-[9px] font-mono text-cyan-400">● RECORDS & STATISTICS</p>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-slate-950/40 border border-slate-850 p-2 text-center rounded-xl shadow-inner">
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">High Score</p>
                <p className="text-xs font-black text-amber-300 mt-0.5">{stats.highScore.toLocaleString()}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-2 text-center rounded-xl shadow-inner">
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">Runs Played</p>
                <p className="text-xs font-black text-cyan-300 mt-0.5">{stats.runsPlayed}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-2 text-center rounded-xl shadow-inner">
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">Amethyst Scrap</p>
                <p className="text-xs font-black text-yellow-400 mt-0.5">{stats.totalScrap}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-2 text-center rounded-xl shadow-inner">
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">Kills Total</p>
                <p className="text-xs font-black text-rose-450 mt-0.5">{stats.enemiesDestroyed}</p>
              </div>
            </div>

            {/* Achievements Racks */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 block">Medals Status</span>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-none font-mono shadow-inner animate-fade-in">
                {achievements.map((ach) => (
                  <div key={ach.id} className="flex items-start gap-2 text-[9px] leading-snug">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      ach.unlocked 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                        : 'bg-slate-900/60 border-slate-850 text-slate-600'
                    }`}>
                      {ach.unlocked ? '✓' : '•'}
                    </div>
                    <div>
                      <p className={`font-black uppercase tracking-tight text-[8px] transition-colors ${ach.unlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                        {ach.title}
                      </p>
                      <p className="text-[7px] text-slate-500 leading-normal mt-0.5">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Pilot Node Status */}
          <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl justify-center font-mono text-[8px] text-slate-400 uppercase tracking-wider shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[170px]">PILOT ID: {username}</span>
          </div>
        </div>

      </div>

      {/* Outer Global Compliance Footer for AdSense crawler compliance */}
      <footer className="w-full max-w-6xl mt-6 border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 z-10 select-none px-4 gap-3 sm:gap-0">
        <p>© 2026 NEON RAIDER ARCADE. ALL RIGHTS RESERVED.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { SynthAudio.playCollect(); setComplianceTab('about'); setShowCompliance(true); }}
            className="hover:text-cyan-400 hover:underline transition-colors uppercase cursor-pointer"
          >
            About Arcade
          </button>
          <span>•</span>
          <button
            onClick={() => { SynthAudio.playCollect(); setComplianceTab('privacy'); setShowCompliance(true); }}
            className="hover:text-cyan-400 hover:underline transition-colors uppercase cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => { SynthAudio.playCollect(); setComplianceTab('contact'); setShowCompliance(true); }}
            className="hover:text-cyan-400 hover:underline transition-colors uppercase cursor-pointer"
          >
            Contact Hub
          </button>
        </div>
      </footer>
    </div>
  );
}
