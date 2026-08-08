import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, CheckCircle2, X, ShieldCheck, Sparkles, Volume2, VolumeX, Play, ExternalLink } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

export interface RewardedAdModalProps {
  adZoneUrl?: string;
  vastTagUrl?: string; // alias for backward compatibility
  rewardLabel?: string;
  onReward: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  adName?: 'revive_ad' | 'double_scraps';
}

export interface AdPlayerOverlayProps {
  adName?: 'revive_ad' | 'double_scraps';
  rewardLabel?: string;
  adZoneUrl?: string;
  vastTagUrl?: string; // alias
  onReward: () => void;
  onCancel: () => void;
  directAdUrl?: string;
}

const DEFAULT_AD_ZONE_URL = "https://vapid-size.com/dtmaFJz/d.GoNVvvZ/GzUe/Vebmt9wuwZSUOltkrPeTVclyIO_TfkNzlNkzyc/tyNVz/In5oORTMMR4HMOQN";

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({
  adName = 'revive_ad',
  rewardLabel,
  adZoneUrl,
  vastTagUrl,
  onReward,
  onCancel,
  directAdUrl
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [adLaunched, setAdLaunched] = useState(false);

  const activeZoneUrl = adZoneUrl || vastTagUrl || directAdUrl || DEFAULT_AD_ZONE_URL;
  const displayRewardLabel = rewardLabel || (adName === 'revive_ad' ? 'FULL SHIELD REVIVE' : '2X SCRAP BONUS');

  const sponsor = {
    brand: "HILLTOP ADS NETWORK",
    title: "ZONE #7299377 SPONSOR BROADCAST",
    badge: "HILLTOP ADS VERIFIED"
  };

  const handleWatchAd = () => {
    if (adLaunched) return;
    setAdLaunched(true);

    if (!isMuted) {
      SynthAudio.playCollect();
    }

    // Trigger Popunder / Direct Link Ad directly in user click gesture context
    try {
      window.open(activeZoneUrl, '_blank', 'noopener,noreferrer');
      const script = document.createElement('script');
      script.src = activeZoneUrl;
      script.async = true;
      document.body.appendChild(script);
    } catch (err) {
      console.warn("HilltopAds Zone launch error:", err);
    }

    // Grant reward immediately upon user-triggered ad engagement
    onReward();
  };

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
                  REWARD: {displayRewardLabel.toUpperCase()}
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
          <div className="relative p-6 bg-slate-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[200px]">
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
                    animate={{ height: [`${h}%`, '20%', `${h}%`] }}
                    transition={{ repeat: Infinity, duration: 0.6 + (i * 0.1), ease: "easeInOut" }}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-teal-300 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white text-xs transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Broadcast Info Notice */}
          <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-center">
            <p className="text-[10px] font-mono text-slate-400">
              Click below to trigger the sponsor ad & claim your reward.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-900 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleWatchAd}
              disabled={adLaunched}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {adLaunched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>REWARD UNLOCKED</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>WATCH AD & CLAIM ({displayRewardLabel.toUpperCase()})</span>
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 font-mono text-[10px] uppercase font-bold transition cursor-pointer whitespace-nowrap"
            >
              SKIP AD (NO REWARD)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  adZoneUrl,
  vastTagUrl,
  rewardLabel,
  onReward,
  onClose,
  onCancel,
  adName = 'revive_ad'
}) => {
  const handleClose = onClose || onCancel || (() => {});
  return (
    <AdPlayerOverlay
      adName={adName}
      rewardLabel={rewardLabel}
      adZoneUrl={adZoneUrl || vastTagUrl}
      onReward={onReward}
      onCancel={handleClose}
    />
  );
};
