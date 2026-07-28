import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  Sparkles, 
  Zap, 
  Shield, 
  Heart, 
  Hourglass, 
  Award, 
  Coins, 
  Target, 
  AlertTriangle, 
  Crosshair, 
  Flame, 
  Info,
  ChevronRight,
  HelpCircle,
  Smartphone,
  MousePointer
} from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface TutorialPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFlightAcademy?: () => void;
}

export const TutorialPanel: React.FC<TutorialPanelProps> = ({ isOpen, onClose, onStartFlightAcademy }) => {
  const [activeCategory, setActiveCategory] = useState<'avoid' | 'collect' | 'controls'>('avoid');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[88vh] text-slate-100 overflow-hidden font-sans"
        >
          {/* TOP HEADER BAR */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <HelpCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-white uppercase italic">
                  TACTICAL FIELD GUIDE
                </h2>
                <p className="text-[10px] sm:text-xs font-mono text-slate-400">
                  RECON INTEL: HAZARDS, COLLECTIBLES & CONTROLS
                </p>
              </div>
            </div>

            <button
              onClick={() => { SynthAudio.playCollect(); onClose(); }}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700/50 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CATEGORY TABS */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/90 border-b border-slate-800/80 font-mono text-[10px] sm:text-xs font-bold">
            <button
              onClick={() => { SynthAudio.playCollect(); setActiveCategory('avoid'); }}
              className={`py-2.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase cursor-pointer ${
                activeCategory === 'avoid'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>WHAT TO AVOID</span>
            </button>

            <button
              onClick={() => { SynthAudio.playCollect(); setActiveCategory('collect'); }}
              className={`py-2.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase cursor-pointer ${
                activeCategory === 'collect'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>WHAT TO COLLECT</span>
            </button>

            <button
              onClick={() => { SynthAudio.playCollect(); setActiveCategory('controls'); }}
              className={`py-2.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase cursor-pointer ${
                activeCategory === 'controls'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONTROLS & SKILLS</span>
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {/* TAB 1: WHAT TO AVOID */}
            {activeCategory === 'avoid' && (
              <div className="space-y-4">
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-200 flex items-center gap-2.5 font-mono">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>DANGER: Collision with hostiles or enemy projectiles depletes ship Shields! Avoid all red/purple/amber hazards.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* RED CRUISER */}
                  <div className="p-3.5 bg-slate-950/80 border border-rose-500/30 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-rose-500/40 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                        <path d="M20 36 L6 14 L12 4 L20 10 L28 4 L34 14 Z" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
                        <circle cx="20" cy="18" r="3" fill="#ffffff" />
                        <line x1="12" y1="36" x2="12" y2="40" stroke="#ef4444" strokeWidth="2" />
                        <line x1="28" y1="36" x2="28" y2="40" stroke="#ef4444" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400 font-mono">BASIC CRUISER</span>
                        <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono border border-rose-500/30">HOSTILE</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Standard fleet drone. Moves in straight paths and fires single laser blasters downfield.
                      </p>
                    </div>
                  </div>

                  {/* SPEED INTERCEPTOR */}
                  <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-amber-500/40 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                        <path d="M20 38 L8 10 L20 18 L32 10 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
                        <path d="M20 2 L20 18" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-400 font-mono">SPEED INTERCEPTOR</span>
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">FAST</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Fast-moving dart fighter. Sweeps in aggressive zig-zag patterns across the battlefield.
                      </p>
                    </div>
                  </div>

                  {/* PLASMA BOMBER */}
                  <div className="p-3.5 bg-slate-950/80 border border-purple-500/30 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-purple-500/40 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                        <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1" />
                        <circle cx="20" cy="20" r="5" fill="#ffffff" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-400 font-mono">PLASMA BOMBER</span>
                        <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-500/30">HEAVY</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Armored vessel with high HP. Fires multi-directional spread plasma projectiles.
                      </p>
                    </div>
                  </div>

                  {/* SPACE ASTEROID */}
                  <div className="p-3.5 bg-slate-950/80 border border-slate-700 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]">
                        <polygon points="20,4 32,8 38,20 30,34 16,38 4,28 6,14" fill="#475569" stroke="#f97316" strokeWidth="1.5" />
                        <circle cx="16" cy="18" r="3" fill="#334155" />
                        <circle cx="26" cy="26" r="2" fill="#334155" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-400 font-mono">SPACE ASTEROID</span>
                        <span className="text-[8px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-mono border border-orange-500/30">OBSTACLE</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Tumbling space rock debris. Destructible with laser cannons, but causes heavy ramming damage.
                      </p>
                    </div>
                  </div>

                  {/* ALIEN DREADNOUGHT BOSS */}
                  <div className="p-3.5 bg-slate-950/80 border border-rose-600/50 rounded-xl flex items-start gap-3.5 shadow-md sm:col-span-2">
                    <div className="w-14 h-14 bg-slate-900 border border-rose-600/60 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 40 40" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(225,29,72,0.9)]">
                        <path d="M20 38 L4 18 L12 4 L20 12 L28 4 L36 18 Z" fill="#e11d48" stroke="#fecdd3" strokeWidth="1" />
                        <rect x="16" y="20" width="8" height="6" fill="#ffffff" />
                        <circle cx="8" cy="30" r="3" fill="#fbbf24" />
                        <circle cx="32" cy="30" r="3" fill="#fbbf24" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400 font-mono">DREADNOUGHT BOSSES</span>
                        <span className="text-[8px] bg-rose-600/30 text-rose-200 px-1.5 py-0.5 rounded font-mono border border-rose-500/50">MEGA BOSS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Appears every 5 waves with massive health bars! Unleashes bullet hell patterns and homing missiles. Defeat for huge score bonuses and rare loot drops.
                      </p>
                    </div>
                  </div>

                  {/* HOSTILE PROJECTILES */}
                  <div className="p-3.5 bg-slate-950/80 border border-rose-500/20 rounded-xl flex items-start gap-3.5 shadow-md sm:col-span-2">
                    <div className="w-14 h-14 bg-slate-900 border border-rose-500/30 rounded-lg flex items-center justify-center shrink-0 gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                      <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                      <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-rose-300 font-mono">HOSTILE PROJECTILES</span>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Red laser bolts, amber plasma spheres, and purple seeker rounds. Dodge them by sliding your ship smoothly around the arena.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WHAT TO COLLECT */}
            {activeCategory === 'collect' && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 font-mono">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>RECOVERY & BUFFS: Destroy hostiles to drop valuable Scrap Metal and powerful tactical combat orbs!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* SCRAP METAL */}
                  <div className="p-3.5 bg-slate-950/80 border border-amber-500/40 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-amber-500/50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-amber-600 to-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.8)] rotate-12">
                        <Coins className="w-5 h-5 text-slate-950" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-400 font-mono">SCRAP METAL</span>
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">CURRENCY</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Collected from defeated hostiles. Spent in the Hangar for permanent weapon upgrades, shields, and ship skins.
                      </p>
                    </div>
                  </div>

                  {/* SHIELD RECOVERY */}
                  <div className="p-3.5 bg-slate-950/80 border border-cyan-500/40 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-cyan-500/50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                        <Heart className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-cyan-400 font-mono">NANO-SHIELD ORB</span>
                        <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">+25 SHIELD</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Instantly repairs +25 Shield HP. Keep your shield full to maintain high score combo multipliers!
                      </p>
                    </div>
                  </div>

                  {/* AEGIS INVINCIBILITY */}
                  <div className="p-3.5 bg-slate-950/80 border border-yellow-400/50 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-yellow-400/60 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-300 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.9)] animate-pulse">
                        <Shield className="w-5 h-5 text-yellow-300 fill-yellow-300/30" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-yellow-300 font-mono">AEGIS INVINCIBILITY</span>
                        <span className="text-[8px] bg-yellow-400/20 text-yellow-200 px-1.5 py-0.5 rounded font-mono border border-yellow-400/40">8 SECONDS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Surrounds your vessel with an impenetrable barrier. Become completely immune and ram through hostiles!
                      </p>
                    </div>
                  </div>

                  {/* QUAD LASER ARRAY */}
                  <div className="p-3.5 bg-slate-950/80 border border-orange-500/40 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-orange-500/50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.8)]">
                        <Flame className="w-5 h-5 text-orange-400 fill-orange-400/30" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-400 font-mono">QUAD LASER ORB</span>
                        <span className="text-[8px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-mono border border-orange-500/30">10 SECONDS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Overclocks ship blasters to 4-stream rapid fire, obliterating entire waves of hostiles in seconds.
                      </p>
                    </div>
                  </div>

                  {/* QUANTUM MAGNET */}
                  <div className="p-3.5 bg-slate-950/80 border border-purple-500/40 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-purple-500/50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-400 font-mono">QUANTUM MAGNET</span>
                        <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-500/30">12 SECONDS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Creates a gravitational field pull that automatically pulls all Scrap and Powerup orbs across the screen straight to you!
                      </p>
                    </div>
                  </div>

                  {/* TEMPORAL WARP */}
                  <div className="p-3.5 bg-slate-950/80 border border-emerald-500/40 rounded-xl flex items-start gap-3.5 shadow-md">
                    <div className="w-14 h-14 bg-slate-900 border border-emerald-500/50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                        <Hourglass className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400 font-mono">TEMPORAL WARP</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">8 SECONDS</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Dilates time, slowing down enemy movement and bullet velocities by 60% for smooth tactical precision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTROLS & SKILLS */}
            {activeCategory === 'controls' && (
              <div className="space-y-4">
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200 flex items-center gap-2.5 font-mono">
                  <Target className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>COMBAT PILOTING: Designed for seamless mobile touch drag & instant desktop responsiveness.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* TOUCH CONTROLS */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
                      <Smartphone className="w-4 h-4" />
                      <span>MOBILE TOUCH PILOTING</span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Touch & drag anywhere on screen to move ship smoothly.</li>
                      <li>Blasters fire continuously automatically.</li>
                      <li>Tap the bottom-right <span className="text-cyan-400 font-bold">EMP BUTTON</span> to discharge shockwaves when charged.</li>
                    </ul>
                  </div>

                  {/* KEYBOARD CONTROLS */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
                      <MousePointer className="w-4 h-4" />
                      <span>DESKTOP KEYBOARD</span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                      <li><span className="text-white font-mono bg-slate-800 px-1 rounded">Arrow Keys</span> or <span className="text-white font-mono bg-slate-800 px-1 rounded">WASD</span> to steer vessel.</li>
                      <li><span className="text-white font-mono bg-slate-800 px-1 rounded">SPACEBAR</span> or <span className="text-white font-mono bg-slate-800 px-1 rounded">B</span> to trigger EMP Shockwave skill.</li>
                      <li><span className="text-white font-mono bg-slate-800 px-1 rounded">ESC</span> or <span className="text-white font-mono bg-slate-800 px-1 rounded">P</span> to pause game sortie.</li>
                    </ul>
                  </div>

                  {/* SUPER SKILL: EMP SHOCKWAVE */}
                  <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-slate-950 border border-cyan-500/50 rounded-xl space-y-2 sm:col-span-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                        <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>ULTIMATE SKILL: EMP SHOCKWAVE DISCHARGE</span>
                      </div>
                      <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded font-mono uppercase">
                        CHARGE 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Every enemy destroyed charges your EMP Capacitor (+10% per kill, +25% per Boss). When the button flashes bright cyan, tap it to trigger an instant screen-wide EMP pulse that <span className="text-cyan-300 font-bold">wipes all hostile bullets</span> and deals 120 shock damage to all active hostiles!
                    </p>
                  </div>

                  {/* SCORE COMBO MECHANICS */}
                  <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2 sm:col-span-2">
                    <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>SCORE MULTIPLIER & ROGUELITE BUFFS</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Defeating enemies repeatedly without taking shield damage builds your <span className="text-amber-400 font-bold">Score Multiplier (up to 8x)</span>! Clearing wave milestones unlocks powerful Roguelite Buff choices during the sortie (Overclocked Cannons, Magnet Aura, Shield Boosters).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS FOOTER */}
          <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Tip: Upgrades purchased in the Hangar persist permanently across all games!</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onStartFlightAcademy && (
                <button
                  onClick={() => {
                    SynthAudio.playCollect();
                    onClose();
                    onStartFlightAcademy();
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-lg text-xs font-mono font-bold tracking-wider transition flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PLAY INTERACTIVE SIMULATOR</span>
                </button>
              )}

              <button
                onClick={() => { SynthAudio.playCollect(); onClose(); }}
                className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 rounded-lg text-xs font-mono font-black tracking-wider transition shadow-lg shadow-cyan-500/20 uppercase cursor-pointer"
              >
                GOT IT, CAPTAIN
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
