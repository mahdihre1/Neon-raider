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
  RefreshCw
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

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedUpgrades = localStorage.getItem(LOCAL_STORAGE_UPGRADES_KEY);
      if (storedUpgrades) {
        setUpgrades({
          ...INITIAL_UPGRADES,
          ...JSON.parse(storedUpgrades)
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
  const handleGameOver = (finalScore: number, scrapSalvaged: number, enemiesKilled: number) => {
    SynthAudio.stopMusic();

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

      {/* MOBILE CONTAINER WRAPPER - Curved smartphone frame for desktop, seamlessly full-screen on true mobiles */}
      <div className="relative w-full max-w-md h-[100vh] sm:h-[840px] bg-slate-950 sm:rounded-[36px] overflow-hidden border-0 sm:border-8 border-slate-900/80 shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col z-10 transition-all">
        
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
                className="absolute inset-0 flex flex-col justify-between bg-slate-950/40 p-6 font-sans text-slate-200"
              >
                {/* Upper Status controls */}
                <div className="flex justify-between items-center z-10">
                  <div 
                    onClick={() => { SynthAudio.playCollect(); setShowUsernameModal(true); }}
                    className="flex items-center space-x-3 bg-slate-900/60 backdrop-blur-md p-1.5 pr-4 rounded-full border border-slate-700/50 shadow-xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border border-slate-200/40 flex items-center justify-center font-black text-xs text-white group-hover:from-cyan-300 group-hover:to-blue-500 transition-all">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[100px]">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Commander</span>
                      <span className="text-[10px] font-bold tracking-tight text-white font-mono truncate">{username}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      className={`px-3 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all ${sfxOn ? 'bg-slate-900/80 text-cyan-400 border-slate-700/50 shadow-lg' : 'bg-slate-950 text-slate-600 border-slate-800'}`}
                    >
                      SFX
                    </button>
                  </div>
                </div>

                {/* Ambient Scrolling Synth Logo Design */}
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center z-10">
                  {/* Decorative Glowing Ship Icon */}
                  <motion.div 
                    animate={{ y: [0, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-20 h-20 mb-6 relative flex items-center justify-center bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 shadow-xl shadow-cyan-500/5"
                  >
                    <div 
                      className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[36px] border-l-transparent border-r-transparent filter drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse"
                      style={{ borderBottomColor: activeSkinObj.color }}
                    />
                  </motion.div>

                  <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 italic uppercase select-none">
                    Neon Raider
                  </h1>
                  <p className="text-cyan-400 font-mono tracking-[0.3em] text-[10px] mt-2 uppercase opacity-80">
                    DEEP SPACE COMBAT SIMULATOR
                  </p>

                  {/* Active Ship Specs */}
                  <div className="bg-slate-900/60 border border-slate-700/50 backdrop-blur-md px-4 py-2.5 rounded-xl flex items-center gap-2.5 max-w-[280px] mt-6 shadow-lg">
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeSkinObj.color }} />
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-mono tracking-wider">SELECTED VESSEL</p>
                      <p className="text-xs font-bold text-slate-200 font-mono uppercase">{activeSkinObj.name}</p>
                    </div>
                  </div>

                </div>

                {/* Dashboard Action Navigation Buttons */}
                <div className="space-y-4 z-10">
                  {/* GAME MODE SELECTION CARD */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2 font-mono">
                    <p className="text-[9px] text-slate-500 font-bold tracking-widest text-center uppercase">SELECT MISSION MODULE</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { SynthAudio.playCollect(); setGameMode('normal'); }}
                        className={`py-2 px-1 rounded-lg border text-[10px] font-black tracking-tight transition duration-200 flex flex-col items-center gap-1 ${
                          gameMode === 'normal' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                            : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Zap className={`w-3.5 h-3.5 ${gameMode === 'normal' ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span>NORMAL ARCADE</span>
                      </button>
                      <button
                        onClick={() => { SynthAudio.playCollect(); setGameMode('story'); }}
                        className={`py-2 px-1 rounded-lg border text-[10px] font-black tracking-tight transition duration-200 flex flex-col items-center gap-1 ${
                          gameMode === 'story' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse' 
                            : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${gameMode === 'story' ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span>CLUCK STORY</span>
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-400 text-center opacity-80 leading-snug">
                      {gameMode === 'normal' 
                        ? "Continuous cosmic hazards & scaling enemy toughness." 
                        : "Goofy multi-wave narrative campaign. Defeat the space hens!"}
                    </p>
                  </div>

                  {/* PLAY TRIGGER - Skewed Deploy style! */}
                  <button
                    id="play-game-btn"
                    onClick={handleStartGame}
                    className="w-full py-4 bg-cyan-500 text-slate-950 font-black rounded-sm skew-x-[-12deg] shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:bg-cyan-400 uppercase tracking-widest text-lg flex items-center justify-center gap-2 transition duration-300 transform active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 skew-x-[12deg]">
                      <Play className="w-5 h-5 fill-current text-slate-950" />
                      <span>DEPLOY SHIP</span>
                    </div>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {/* HANGAR STORE */}
                    <button
                      id="open-store-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('upgrades'); }}
                      className="py-2.5 px-2 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 text-slate-200 rounded-xl text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1 font-mono shadow-md"
                    >
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span>HANGAR ({stats.totalScrap})</span>
                    </button>

                    {/* RECORDS AND STATS */}
                    <button
                      id="open-stats-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('stats'); }}
                      className="py-2.5 px-2 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 text-slate-200 rounded-xl text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1 font-mono shadow-md"
                    >
                      <Award className="w-4 h-4 text-cyan-400" />
                      <span>RECORDS</span>
                    </button>

                    {/* LIVE LEADERBOARD */}
                    <button
                      id="open-leaderboard-btn"
                      onClick={() => { SynthAudio.playCollect(); setGameState('leaderboard'); }}
                      className="py-2.5 px-2 bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 text-slate-200 rounded-xl text-[10px] font-bold tracking-tight transition flex flex-col items-center justify-center gap-1 font-mono shadow-md"
                    >
                      <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>LEADERS</span>
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
                    className="w-full py-2 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-cyan-400 font-bold rounded-lg text-[9px] font-mono tracking-widest transition flex items-center justify-center gap-1.5 uppercase shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>LAUNCH FLIGHT ACADEMY</span>
                  </button>

                  {/* Simple Touch controls hint */}
                  <div className="text-center pt-2 text-[9px] text-slate-500 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-900/20 py-1.5 rounded-lg border border-slate-800/40">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>SYSTEM STATUS: ALL SYSTEMS NOMINAL</span>
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
                className="absolute inset-0 bg-slate-950/40 p-6 flex flex-col justify-between font-sans text-slate-100"
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
        </div>
      </div>
    </div>
  );
}
