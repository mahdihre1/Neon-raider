import React from 'react';
import { GameStats, Achievement } from '../types';
import { Award, Zap, Shield, Target, Trophy, Play, CheckCircle, Circle } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface StatsPanelProps {
  stats: GameStats;
  achievements: Achievement[];
  onClose: () => void;
}

export default function StatsPanel({ stats, achievements, onClose }: StatsPanelProps) {
  
  const getStatItems = () => [
    { label: 'Highest Score', value: stats.highScore, icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Total Scrap Salvaged', value: stats.totalScrap, icon: Trophy, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', isScrap: true },
    { label: 'Sorties Launched', value: stats.runsPlayed, icon: Play, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'Enemies Defeated', value: stats.enemiesDestroyed, icon: Target, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-md text-slate-100 font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-lg font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic">
            Service Record
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
          {unlockedCount}/{achievements.length} MEDALS
        </span>
      </div>

      {/* STATS BENTO MATRIX */}
      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        
        {/* STATS MATRIX */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {getStatItems().map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-md backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-semibold">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                    {item.value}
                  </span>
                  {item.isScrap && <span className="text-[10px] text-yellow-400 font-mono font-bold">S</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACHIEVEMENTS BLOCK */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono tracking-widest uppercase text-slate-500 px-1 font-bold">Completions & Medals</h3>
          
          <div className="space-y-3">
            {achievements.map((ach) => {
              const progressPercent = Math.min(100, Math.round((ach.progressCurrent / ach.progressMax) * 100));
              
              return (
                <div 
                  key={ach.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col gap-3 ${
                    ach.unlocked 
                      ? 'bg-slate-900/80 border-cyan-500/20 shadow-md shadow-cyan-500/5' 
                      : 'bg-slate-900/30 border-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3.5">
                      {/* Custom Icon Circle */}
                      <div className={`p-2.5 rounded-xl shrink-0 border transition-all ${
                        ach.unlocked 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse' 
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}>
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold tracking-tight ${ach.unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                          {ach.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {ach.description}
                        </p>
                      </div>
                    </div>
                    {ach.unlocked ? (
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* PROGRESS BAR FOR ACTIVE ACHIEVEMENTS */}
                  {!ach.unlocked && ach.progressMax > 1 && (
                    <div className="space-y-1.5 mt-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                        <span>PROGRESS</span>
                        <span>{ach.progressCurrent}/{ach.progressMax}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md shrink-0 flex justify-center">
        <button
          id="close-stats-btn"
          onClick={() => { SynthAudio.playCollect(); onClose(); }}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 rounded-sm skew-x-[-12deg] border border-slate-700/50 shadow-lg font-black tracking-widest transition duration-300 uppercase text-xs transform active:scale-[0.98]"
        >
          <span className="inline-block skew-x-[12deg]">BACK TO FLIGHT DECK</span>
        </button>
      </div>
    </div>
  );
}
