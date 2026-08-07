import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, Zap, CheckCircle2, X, ExternalLink, ShieldCheck, Sparkles, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface AdPlayerOverlayProps {
  adName: 'revive_ad' | 'double_scraps';
  onReward: () => void;
  onCancel: () => void;
  directAdUrl?: string; // Optional direct HilltopAds link if available
}

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({
  adName,
  onReward,
  onCancel,
  directAdUrl
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSponsorIndex, setActiveSponsorIndex] = useState(0);

  const sponsors = [
    {
      brand: "HILLTOP ADS NETWORK",
      title: "HIGH-PERFORMANCE TECH MONETIZATION",
      description: "Blazing fast global CPM network & anti-fraud ad infrastructure for next-gen games.",
      badge: "VERIFIED PARTNER",
      cta: "EXPLORE NETWORK",
      color: "from-cyan-500 to-blue-600"
    },
    {
      brand: "NEON CORE QUANTUM DRIVE",
      title: "OVERCLOCK YOUR FLIGHT SYSTEM",
      description: "Upgrade your hull shields with plasma quantum matrix drives. Zero latency performance.",
      badge: "CYBER HARDWARE",
      cta: "UPGRADE VESSEL",
      color: "from-purple-500 to-indigo-600"
    },
    {
      brand: "CYBERPUNK ARCADE PASS",
      title: "UNLIMITED TACTICAL SORTIES",
      description: "Dominate the global leaderboards with ultra-low latency server synchronization.",
      badge: "ARCADE PREMIUM",
      cta: "VIEW LEADERBOARDS",
      color: "from-amber-500 to-yellow-500"
    }
  ];

  useEffect(() => {
    setActiveSponsorIndex(Math.floor(Math.random() * sponsors.length));
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsCompleted(true);
      if (!isMuted) {
        SynthAudio.playCollect();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          if (!isMuted) {
            SynthAudio.playCollect();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isMuted]);

  const handleClaimReward = () => {
    SynthAudio.playCollect();
    onReward();
  };

  const handleVisitSponsor = () => {
    if (directAdUrl) {
      window.open(directAdUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback HilltopAds / sponsor portal reference
      window.open('https://hilltopads.com', '_blank', 'noopener,noreferrer');
    }
  };

  const currentSponsor = sponsors[activeSponsorIndex];
  const totalDuration = 5;
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl select-none">
        {/* Outer Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950/80 to-purple-950/20 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="relative w-full max-w-lg bg-slate-900/95 border-2 border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="bg-slate-950/80 border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Tv className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                    SPONSOR BROADCAST
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[8px] font-mono text-cyan-300 font-bold">
                    <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
                    HILLTOP ADS VERIFIED
                  </span>
                </div>
                <p className="text-[9px] font-mono text-slate-400">
                  {adName === 'revive_ad' ? 'REWARD: FULL SHIELD EMERGENCY REVIVE' : 'REWARD: 2X SCRAP MULTIPLIER'}
                </p>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition cursor-pointer"
              title="Abort Broadcast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ad Broadcast Canvas Simulation */}
          <div className="relative p-6 bg-slate-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[260px]">
            {/* Cyber Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

            {/* Glowing Accent Ring */}
            <div className={`absolute w-64 h-64 rounded-full bg-gradient-to-r ${currentSponsor.color} blur-[90px] opacity-20 animate-pulse pointer-events-none`} />

            {/* Content Display */}
            <div className="relative z-10 max-w-md space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                {currentSponsor.badge}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black font-mono text-white tracking-wide uppercase">
                  {currentSponsor.brand}
                </h3>
                <p className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
                  {currentSponsor.title}
                </p>
              </div>

              <p className="text-[11px] font-mono text-slate-350 leading-relaxed max-w-xs mx-auto">
                {currentSponsor.description}
              </p>

              {/* Sponsor Direct Link Button */}
              <button
                onClick={handleVisitSponsor}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-mono font-bold tracking-wider transition cursor-pointer"
              >
                <span>{currentSponsor.cta}</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-white text-xs transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Progress & Verification Bar */}
          <div className="bg-slate-950/90 px-6 py-2.5 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                <span className="text-slate-400 uppercase">BROADCAST PROGRESS</span>
                <span className={isCompleted ? "text-emerald-400" : "text-cyan-400"}>
                  {isCompleted ? "100% COMPLETE" : `${timeLeft}s REMAINING`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-right font-mono text-[8px] text-slate-500 shrink-0">
              <div className="text-slate-400 font-bold">HILLTOP ADS TAG</div>
              <div className="text-slate-600 truncate max-w-[90px]">001e98a977...</div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 bg-slate-900 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
            >
              CANCEL
            </button>

            {isCompleted ? (
              <button
                onClick={handleClaimReward}
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_45px_rgba(16,185,129,0.6)] transition duration-300 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-400" />
                <span>CLAIM REWARD ({adName === 'revive_ad' ? 'REVIVE SHIP' : '2X SCRAP'})</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>WATCHING SPONSOR BROADCAST ({timeLeft}s)...</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
