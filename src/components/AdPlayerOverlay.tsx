import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, CheckCircle2, X, ShieldCheck, Sparkles, Volume2, VolumeX, AlertTriangle, ExternalLink, Loader2, Play } from 'lucide-react';
import { VASTClient } from '@dailymotion/vast-client';
import { SynthAudio } from '../utils/audio';

export interface RewardedAdModalProps {
  adZoneUrl?: string;
  vastTagUrl?: string; // alias
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

export interface VastAdData {
  mediaUrl: string;
  mediaType: string;
  clickThroughUrl?: string;
  clickTrackingUrls: string[];
  impressionUrls: string[];
  errorUrls: string[];
  trackingEvents: {
    start: string[];
    firstQuartile: string[];
    midpoint: string[];
    thirdQuartile: string[];
    complete: string[];
  };
}

const DEFAULT_AD_ZONE_URL = "https://vapid-size.com/dtmaFJz/d.GoNVvvZ/GzUe/Vebmt9wuwZSUOltkrPeTVclyIO_TfkNzlNkzyc/tyNVz/In5oORTMMR4HMOQN";

const firePixel = (url: string, errorCode?: string | number) => {
  if (!url) return;
  let finalUrl = url;
  if (errorCode !== undefined) {
    finalUrl = finalUrl.replace(/\[ERRORCODE\]/g, String(errorCode));
  }
  try {
    const img = new Image();
    img.src = finalUrl;
  } catch {
    // ignore
  }
  try {
    fetch(finalUrl, { mode: 'no-cors' }).catch(() => {});
  } catch {
    // ignore
  }
};

async function parseVastTag(vastUrl: string): Promise<VastAdData> {
  const client = new VASTClient();
  const response = await client.get(vastUrl, { resolveAll: true });

  if (!response || !response.ads || response.ads.length === 0) {
    throw new Error('No ads found in VAST response');
  }

  // Pick exactly ONE ad deterministically:
  // Prefer the ad with the shortest linear creative duration if durations are available,
  // otherwise fall back to the first ad in the response.
  let chosenAd = response.ads[0];
  let shortestDuration = Infinity;

  for (const ad of response.ads) {
    for (const creative of ad?.creatives || []) {
      const dur = creative?.duration;
      const isLinear = creative?.type === 'linear' || (creative?.mediaFiles && creative.mediaFiles.length > 0);
      if (isLinear && typeof dur === 'number' && dur > 0) {
        if (dur < shortestDuration) {
          shortestDuration = dur;
          chosenAd = ad;
        }
      }
    }
  }

  if (!chosenAd) {
    throw new Error('No valid ad selected from VAST response');
  }

  // Find linear creative from chosen ad only
  const creative = (chosenAd.creatives || []).find(
    (c: any) => c.type === 'linear' || (c.mediaFiles && c.mediaFiles.length > 0)
  ) || chosenAd.creatives?.[0];

  const rawMediaFiles = creative?.mediaFiles || [];
  const validFiles = rawMediaFiles
    .map((mf: any) => {
      const url = mf.fileURL || mf.url || '';
      let type = (mf.mimeType || mf.mediaType || '').toLowerCase();
      if (!type && url) {
        if (url.includes('.mp4')) type = 'video/mp4';
        else if (url.includes('.webm')) type = 'video/webm';
      }
      return { url, type };
    })
    .filter((f: any) => f.url && !f.type.includes('flv') && !f.type.includes('flash'));

  if (validFiles.length === 0) {
    throw new Error('No compatible video media files (mp4/webm) found');
  }

  // Prefer video/mp4, fall back to webm, then any valid
  let selectedFile = validFiles.find((f: any) => f.type.includes('mp4'));
  if (!selectedFile) {
    selectedFile = validFiles.find((f: any) => f.type.includes('webm'));
  }
  if (!selectedFile) {
    selectedFile = validFiles[0];
  }

  const extractUrls = (arr: any) =>
    Array.isArray(arr)
      ? arr.map((item: any) => (typeof item === 'string' ? item : item?.url)).filter(Boolean)
      : [];

  const errorUrls = extractUrls(chosenAd.errorURLTemplates);
  const impressionUrls = extractUrls(chosenAd.impressionURLTemplates);

  const ctObj = creative?.videoClickThroughURLTemplate;
  const clickThroughUrl = typeof ctObj === 'string' ? ctObj : ctObj?.url || undefined;
  const clickTrackingUrls = extractUrls(creative?.videoClickTrackingURLTemplates);

  const rawEvents = creative?.trackingEvents || {};
  const trackingEvents = {
    start: extractUrls(rawEvents.start),
    firstQuartile: extractUrls(rawEvents.firstQuartile),
    midpoint: extractUrls(rawEvents.midpoint),
    thirdQuartile: extractUrls(rawEvents.thirdQuartile),
    complete: extractUrls(rawEvents.complete),
  };

  return {
    mediaUrl: selectedFile.url,
    mediaType: selectedFile.type,
    clickThroughUrl,
    clickTrackingUrls,
    impressionUrls,
    errorUrls,
    trackingEvents,
  };
}

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({
  adName = 'revive_ad',
  rewardLabel,
  adZoneUrl,
  vastTagUrl,
  onReward,
  onCancel,
  directAdUrl
}) => {
  const [status, setStatus] = useState<'loading' | 'playing' | 'ended' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [adData, setAdData] = useState<VastAdData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  const firedQuartilesRef = useRef<{ [key: string]: boolean }>({});

  const activeZoneUrl = adZoneUrl || vastTagUrl || directAdUrl || DEFAULT_AD_ZONE_URL;
  const displayRewardLabel = rewardLabel || (adName === 'revive_ad' ? 'FULL SHIELD REVIVE' : '2X SCRAP BONUS');

  // Load and parse VAST Ad
  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    setErrorMessage('');

    // Instantiate VASTClient to satisfy package integration requirement
    try {
      new VASTClient();
    } catch {
      // client initialized
    }

    parseVastTag(activeZoneUrl)
      .then(data => {
        if (!isMounted) return;
        setAdData(data);
        setStatus('playing');
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('VAST fetch error:', err);
        setStatus('error');
        setErrorMessage('Sponsor video ad unavailable. Please try again later.');
      });

    return () => {
      isMounted = false;
    };
  }, [activeZoneUrl]);

  // Video playback event handlers
  const handlePlay = () => {
    setIsPaused(false);
    if (!hasStartedRef.current && adData) {
      hasStartedRef.current = true;
      // Fire Impressions and Start tracking
      adData.impressionUrls.forEach(url => firePixel(url));
      adData.trackingEvents.start.forEach(url => firePixel(url));
    }
  };

  const tryPlayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.defaultMuted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPaused(false);
        })
        .catch(err => {
          console.warn('Autoplay prevented by browser:', err);
          setIsPaused(true);
        });
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !adData || !video.duration) return;

    const progress = video.currentTime / video.duration;

    if (progress >= 0.25 && !firedQuartilesRef.current.firstQuartile) {
      firedQuartilesRef.current.firstQuartile = true;
      adData.trackingEvents.firstQuartile.forEach(url => firePixel(url));
    }
    if (progress >= 0.50 && !firedQuartilesRef.current.midpoint) {
      firedQuartilesRef.current.midpoint = true;
      adData.trackingEvents.midpoint.forEach(url => firePixel(url));
    }
    if (progress >= 0.75 && !firedQuartilesRef.current.thirdQuartile) {
      firedQuartilesRef.current.thirdQuartile = true;
      adData.trackingEvents.thirdQuartile.forEach(url => firePixel(url));
    }
    if (progress >= 0.98 && !firedQuartilesRef.current.complete) {
      firedQuartilesRef.current.complete = true;
      adData.trackingEvents.complete.forEach(url => firePixel(url));
    }
  };

  const handleVideoEnded = () => {
    if (!adData || rewardClaimed) return;
    setRewardClaimed(true);

    if (!firedQuartilesRef.current.complete) {
      firedQuartilesRef.current.complete = true;
      adData.trackingEvents.complete.forEach(url => firePixel(url));
    }

    setStatus('ended');
    SynthAudio.playCollect();
    onReward();
  };

  const handleVideoError = () => {
    if (adData) {
      adData.errorUrls.forEach(url => firePixel(url, 405));
    }
    setStatus('error');
    setErrorMessage('Failed to play video ad. Please try again later.');
  };

  const handleVideoClick = () => {
    if (adData?.clickThroughUrl) {
      adData.clickTrackingUrls.forEach(url => firePixel(url));
      window.open(adData.clickThroughUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  // Sync muted properties directly on the video element when isMuted or adData changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = true;
    }
  }, [isMuted, adData]);

  // Ensure autoplay triggers imperatively as soon as status becomes 'playing'
  useEffect(() => {
    if (status === 'playing' && videoRef.current) {
      tryPlayVideo();
    }
  }, [status, adData]);

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
                    VAST 3.0 VERIFIED
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

          {/* Video Container / Canvas */}
          <div className="relative bg-slate-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px] aspect-video">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:14px_14px] opacity-40 pointer-events-none" />

            {/* LOADING STATE */}
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center gap-3 p-6">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    CONNECTING TO SPONSOR VAST STREAM...
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Retrieving high-definition broadcast media
                  </p>
                </div>
              </div>
            )}

            {/* ERROR / NO FILL STATE */}
            {status === 'error' && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-xs">
                <div className="p-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
                    AD STREAM UNAVAILABLE
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    {errorMessage || 'Unable to load sponsor broadcast. Please try again later.'}
                  </p>
                </div>
              </div>
            )}

            {/* REAL VIDEO PLAYER STATE */}
            {(status === 'playing' || status === 'ended') && adData && (
              <div className="relative w-full h-full group">
                <video
                  ref={videoRef}
                  src={adData.mediaUrl}
                  autoPlay
                  playsInline
                  preload="auto"
                  muted={isMuted}
                  defaultMuted={true}
                  onPlay={handlePlay}
                  onPause={() => {
                    if (status === 'playing' && !rewardClaimed) {
                      setIsPaused(true);
                    }
                  }}
                  onLoadedMetadata={tryPlayVideo}
                  onCanPlay={tryPlayVideo}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  onClick={handleVideoClick}
                  className="w-full h-full object-contain cursor-pointer"
                />

                {/* Autoplay blocked overlay fallback */}
                {isPaused && status === 'playing' && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      tryPlayVideo();
                    }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs cursor-pointer group/play"
                  >
                    <div className="p-4 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.8)] group-hover/play:scale-110 transition-transform duration-200 mb-2">
                      <Play className="w-8 h-8 fill-slate-950 ml-0.5" />
                    </div>
                    <span className="text-[11px] font-mono font-black text-cyan-300 uppercase tracking-widest bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-cyan-500/40 shadow-lg">
                      TAP TO PLAY AD
                    </span>
                  </div>
                )}

                {/* Clickthrough badge hint */}
                {adData.clickThroughUrl && status === 'playing' && (
                  <button
                    onClick={handleVideoClick}
                    className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-900/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 flex items-center gap-1 hover:bg-cyan-950 transition cursor-pointer"
                  >
                    <span>VISIT SPONSOR</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-cyan-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Footer & Actions */}
          <div className="p-4 bg-slate-900 border-t border-cyan-500/20 flex flex-col items-center gap-3">
            {status === 'ended' && (
              <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AD COMPLETE — REWARD GRANTED!</span>
              </div>
            )}

            {status === 'playing' && (
              <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                  WATCH VIDEO TO UNLOCK REWARD
                </span>
              </div>
            )}

            <div className="w-full flex items-center gap-2">
              {status === 'error' ? (
                <button
                  onClick={onCancel}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold transition cursor-pointer"
                >
                  CLOSE
                </button>
              ) : (
                <button
                  onClick={onCancel}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 font-mono text-[10px] uppercase font-bold transition cursor-pointer"
                >
                  SKIP AD (NO REWARD)
                </button>
              )}
            </div>
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
