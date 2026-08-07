import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, Zap, CheckCircle2, X, ExternalLink, ShieldCheck, Sparkles, Volume2, VolumeX, Play, ArrowRight } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface AdPlayerOverlayProps {
  adName: 'revive_ad' | 'double_scraps';
  onReward: () => void;
  onCancel: () => void;
  directAdUrl?: string;
}

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({
  adName,
  onReward,
  onCancel,
  directAdUrl
}) => {
  const [timeLeft, setTimeLeft] = useState(4);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoClaimed, setAutoClaimed] = useState(false);

  const sponsor = {
    brand: "HILLTOP ADS NETWORK",
    title: "HIGH-PERFORMANCE GAME MONETIZATION",
    description: "Verified Ad Network • Powered by HilltopAds Anti-Fraud Infrastructure",
    badge: "HILLTOP ADS VERIFIED",
    color: "from-cyan-500 via-blue-500 to-purple-600"
  };

  // Timer Countdown Effect with auto-claim fallback
  useEffect(() => {
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
  }, [isMuted]);

  const handleClaimReward = () => {
    if (autoClaimed) return;
    setAutoClaimed(true);
    SynthAudio.playCollect();
    onReward();
  };

  const handleVisitSponsor = () => {
    const targetUrl = directAdUrl || 'https://hilltopads.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const totalDuration = 4;
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl select-none">
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950/90 to-slate-950 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -15 }}
          className="relative w-full max-w-md bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
                <Tv className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black text-cyan-400 tracking-wider uppercase">
                    SPONSOR BROADCAST
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[8px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
                    VERIFIED
                  </span>
                </div>
                <p className="text-[9px] font-mono text-slate-400">
                  {adName === 'revive_ad' ? 'REWARD: FULL SHIELD REVIVE' : 'REWARD: 2X SCRAP BONUS'}
                </p>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close Broadcast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Animated Video Canvas Simulation */}
          <div className="relative p-6 bg-slate-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px]">
            {/* Animated Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:14px_14px] opacity-40" />

            {/* Glowing Pulsing Ring */}
            <div className="absolute w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl animate-pulse pointer-events-none" />

            {/* Video Simulation Screen */}
            <div className="relative z-10 space-y-3 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                {sponsor.badge}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black font-mono text-white tracking-wide uppercase">
                  {sponsor.brand}
                </h3>
                <p className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                  {sponsor.title}
                </p>
              </div>

              {/* Visual Audio Equalizer Animation */}
              <div className="flex items-center justify-center gap-1 h-6 py-1">
                {[40, 80, 60, 100, 50, 90, 70, 30, 85, 45].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isCompleted ? '20%' : [`${h}%`, '20%', `${h}%`] }}
                    transition={{ repeat: Infinity, duration: 0.6 + (i * 0.1), ease: "easeInOut" }}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-teal-300 rounded-full"
                  />
                ))}
              </div>

              {/* Visit Sponsor Button */}
              <button
                onClick={handleVisitSponsor}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-mono font-bold tracking-wider transition cursor-pointer"
              >
                <span>VISIT SPONSOR SITE</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white text-xs transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Progress Bar & Countdown */}
          <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-slate-400 uppercase">BROADCAST STATUS</span>
              <span className={isCompleted ? "text-emerald-400 font-black" : "text-cyan-400"}>
                {isCompleted ? "✔ BROADCAST COMPLETE" : `PLAYING (${timeLeft}s)`}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                    : "bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-900 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center gap-2.5">
            {isCompleted ? (
              <button
                onClick={handleClaimReward}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.5)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer animate-bounce"
              >
                <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-400" />
                <span>CLAIM REWARD ({adName === 'revive_ad' ? 'REVIVE SHIP' : '2X SCRAP'})</span>
              </button>
            ) : (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>WATCHING AD ({timeLeft}s)...</span>
                </div>
                <button
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white font-mono text-[10px] uppercase font-bold transition cursor-pointer"
                >
                  SKIP AD (NO REWARD)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
