import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SynthAudio } from '../utils/audio';
import { Tv, Volume2, Sparkles, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdPlayerOverlayProps {
  onReward: () => void;
  onCancel: () => void;
  adName: 'revive_ad' | 'double_scraps';
}

const MOCK_ADS = [
  {
    sponsor: "VIPER PLASMA DYNAMICS",
    tagline: "OBLITERATE SPACE ASTEROIDS IN STYLE",
    desc: "Upgrade to the dual-channel Viper Interceptor loadout. Experience up to +15% rapid-fire frequencies on your main plasma arrays. Available now in the Hangar shop!",
    badge: "HYPER-DRIVE COMPATIBLE",
    color: "from-pink-500 to-rose-600",
    glow: "rgba(244, 63, 94, 0.3)"
  },
  {
    sponsor: "AMETHYST MINING CORP",
    tagline: "SALVAGING THE GALAXY, ONE ROCK AT A TIME",
    desc: "High hazard, astronomical pay! Join our harvesting fleet in the deep Orion Nebula. Harness raw amethyst crystals with state-of-the-art quantum vacuums.",
    badge: "FLEET POSITIONS OPEN",
    color: "from-purple-500 to-indigo-600",
    glow: "rgba(147, 51, 234, 0.3)"
  },
  {
    sponsor: "CYBERDRONE NANO-SHIELDING",
    tagline: "BECAUSE SPACE IS A HOSTILE VOID",
    desc: "Deploy automated nanite shield-cells. Offers up to 40% cumulative damage mitigation on heavy laser collisions. Shield your vessel, survive the sector!",
    badge: "50% DISCOUNT ACTIVE",
    color: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.3)"
  },
  {
    sponsor: "CO-PILOT SENTIENT AI v4.2",
    tagline: "INTELLIGENT DIAGNOSTICS FOR ELITE PILOTS",
    desc: "Tired of manual asteroid targeting? Let our neural network auto-aim secondary ion pulses while you focus on high-speed thruster maneuvers. Start a 30-cycle trial!",
    badge: "NEURAL NETWORK ON-LINE",
    color: "from-cyan-500 to-blue-600",
    glow: "rgba(6, 182, 212, 0.3)"
  }
];

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({ onReward, onCancel, adName }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [adIndex] = useState(() => Math.floor(Math.random() * MOCK_ADS.length));
  const [isRealAdActive, setIsRealAdActive] = useState(false);
  const [statusText, setStatusText] = useState("ESTABLISHING HIGH-BANDWIDTH SYNC...");

  useEffect(() => {
    // 1. ATTEMPT REAL GOOGLE ADSENSE H5 GAMES adBreak
    const win = window as any;
    let fallbackTimer: number;

    const startFallback = () => {
      setIsRealAdActive(false);
      setStatusText("SPONSOR BROADCAST ACTIVE");
      
      // Fallback 5-second countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Completed!
            SynthAudio.playPowerup();
            onReward();
            return 0;
          }
          // Tick sound
          SynthAudio.playCollect();
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    };

    if (win.adBreak) {
      try {
        setStatusText("REQUESTING AD BREAK...");
        win.adBreak({
          type: 'reward',
          name: adName,
          beforeAd: () => {
            setIsRealAdActive(true);
            setStatusText("PLAYING REAL AD...");
          },
          afterAd: () => {
            setIsRealAdActive(false);
          },
          beforeReward: (showAdFn: () => void) => {
            showAdFn();
          },
          adDismissed: () => {
            onCancel();
          },
          adViewed: () => {
            onReward();
          },
          adBreakDone: (placementInfo: any) => {
            console.log("AdSense H5 Ad Placement Completed:", placementInfo);
            // If ad breaks are not ready or blocked, immediately fallback to simulated video
            if (placementInfo && (placementInfo.breakStatus === 'notReady' || placementInfo.breakStatus === 'error' || placementInfo.breakStatus === 'timeout')) {
              startFallback();
            }
          }
        });
      } catch (err) {
        console.warn("Google H5 ads broke, launching fallback:", err);
        startFallback();
      }
    } else {
      // No AdSense object loaded (e.g. localhost, preview iframe, ad-blocker) -> launch immersive simulation
      startFallback();
    }
  }, [adName, onReward, onCancel]);

  const ad = MOCK_ADS[adIndex];

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          id="ad-player-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col items-center justify-center p-6 text-slate-100 overflow-hidden font-mono select-none"
        >
          {/* Holographic background noise */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,6px_100%] pointer-events-none" />
          
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-5 relative flex flex-col gap-5 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            
            {/* Blinking corner decals */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400 animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400 animate-pulse" />

            {/* Header / Network Status */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold tracking-widest">
                <Tv className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>SPONSOR FEED INJECTION</span>
              </div>
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black tracking-widest animate-pulse">
                {statusText}
              </span>
            </div>

            {/* Simulated Live Stream Block */}
            {!isRealAdActive ? (
              <div className="flex flex-col gap-4">
                {/* Visual Ad Box */}
                <div className={`relative bg-gradient-to-br ${ad.color} border border-white/10 rounded-xl p-5 text-center min-h-[160px] flex flex-col justify-between overflow-hidden shadow-2xl`}>
                  
                  {/* Subtle Gridlines overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                  
                  {/* Glowing core shadow */}
                  <div className="absolute inset-0 mix-blend-screen pointer-events-none" style={{ boxShadow: `inset 0 0 40px ${ad.glow}` }} />

                  <div>
                    <span className="text-[8px] bg-black/40 border border-white/20 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest inline-block mb-2">
                      {ad.badge}
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{ad.sponsor}</h4>
                    <p className="text-[10px] text-amber-200 font-black tracking-wider uppercase mt-1 italic">&ldquo;{ad.tagline}&rdquo;</p>
                  </div>

                  <p className="text-[9px] text-slate-150 font-sans leading-relaxed mt-3 px-1">
                    {ad.desc}
                  </p>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <span className="text-[8px] text-white/50">SECURE BROADCAST NETWORK</span>
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>

                {/* Progress bar and counter */}
                <div className="space-y-2 mt-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>TRANSMISSION COHERENCY</span>
                    <span className="text-amber-400 font-black">{countdown} SECS REMAINING</span>
                  </div>
                  {/* Outer bar */}
                  <div className="w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="text-xs text-slate-400 tracking-wider">PLAYING CLIENT BROADSHEET AD...</span>
              </div>
            )}

            {/* Footer / Info / Skip Trigger */}
            <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-850 pt-3">
              <span>AD CLIENT ID: ca-pub-5288827544368702</span>
              <div className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-slate-500" />
                <span>AUDIO SYNTH CONNECTED</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
