import React, { useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../lib/firebase';
import { Trophy, RefreshCw, Star, Flame, Award, ArrowLeft } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface LeaderboardPanelProps {
  onClose: () => void;
  currentUsername?: string;
}

export default function LeaderboardPanel({ onClose, currentUsername }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'daily'>('all');

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard();
      // Store all raw entries to allow accurate time filtering and de-duplication
      setEntries(data);
    } catch (e) {
      console.error(e);
      setError("Unable to sync with deep-space score server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleRefresh = () => {
    SynthAudio.playCollect();
    fetchScores();
  };

  // Filter and de-duplicate based on selected tab
  const filteredEntries = React.useMemo(() => {
    // 1. Filter by time window
    const timeFiltered = entries.filter((entry) => {
      if (activeTab === 'all') return true;
      if (!entry.timestamp) return false;

      let entryMs = 0;
      if (entry.timestamp && typeof entry.timestamp.toMillis === 'function') {
        entryMs = entry.timestamp.toMillis();
      } else if (entry.timestamp && entry.timestamp.seconds) {
        entryMs = entry.timestamp.seconds * 1000;
      } else {
        entryMs = new Date(entry.timestamp).getTime();
      }

      if (isNaN(entryMs) || entryMs <= 0) return false;

      const diff = Date.now() - entryMs;
      if (activeTab === 'daily') {
        // Daily: Top high score of today (calendar day starting at local midnight)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return entryMs >= startOfToday.getTime();
      } else if (activeTab === 'weekly') {
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    // 2. De-duplicate: Keep only the top high score per unique user
    // Since the original entries (and thus timeFiltered) are already sorted by score descending,
    // the first entry we encounter for any username is guaranteed to be their highest score in this timeframe.
    const uniqueMap = new Map<string, LeaderboardEntry>();
    for (const entry of timeFiltered) {
      const normalizedUser = entry.username.trim().toLowerCase();
      if (!uniqueMap.has(normalizedUser)) {
        uniqueMap.set(normalizedUser, entry);
      }
    }

    return Array.from(uniqueMap.values());
  }, [entries, activeTab]);

  // Calculate rank for the active user within the selected filter tab
  let tabUserRank: number | null = null;
  let tabUserEntry: LeaderboardEntry | null = null;
  if (currentUsername) {
    const normalizedCurrentUser = currentUsername.trim().toLowerCase();
    const idx = filteredEntries.findIndex(
      (entry) => entry.username.trim().toLowerCase() === normalizedCurrentUser
    );
    if (idx !== -1) {
      tabUserEntry = filteredEntries[idx];
      tabUserRank = idx + 1;
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/90 backdrop-blur-md text-slate-100 font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
          <h2 className="text-lg font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 italic">
            Sector Standings (Top 100)
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 rounded-lg transition-all border border-slate-700/50 flex items-center justify-center"
          title="Refresh Scores"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800/80 grid grid-cols-3 gap-2 shrink-0 font-mono text-[10px]">
        <button
          onClick={() => { SynthAudio.playCollect(); setActiveTab('all'); }}
          className={`py-1.5 rounded-lg border font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
              : 'bg-slate-950/30 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-400'
          }`}
        >
          ALL-TIME
        </button>
        <button
          onClick={() => { SynthAudio.playCollect(); setActiveTab('weekly'); }}
          className={`py-1.5 rounded-lg border font-bold transition-all ${
            activeTab === 'weekly'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
              : 'bg-slate-950/30 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-400'
          }`}
        >
          WEEKLY
        </button>
        <button
          onClick={() => { SynthAudio.playCollect(); setActiveTab('daily'); }}
          className={`py-1.5 rounded-lg border font-bold transition-all ${
            activeTab === 'daily'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.1)]'
              : 'bg-slate-950/30 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-400'
          }`}
        >
          DAILY
        </button>
      </div>

      {/* LEADERS LIST */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-t-cyan-400 border-r-cyan-400/20 border-b-cyan-400/20 border-l-cyan-400/20 rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Accessing Holo-Net Matrix...</span>
          </div>
        ) : error ? (
          <div className="h-48 flex flex-col items-center justify-center text-center space-y-2 p-6 border border-dashed border-rose-950/40 bg-rose-950/10 rounded-2xl">
            <Award className="w-8 h-8 text-rose-500 animate-pulse" />
            <p className="text-xs text-rose-400 font-bold font-mono">CONNECTION FAULTED</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{error}</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center space-y-2 p-6 border border-dashed border-slate-800 rounded-2xl">
            <Award className="w-8 h-8 text-slate-600" />
            <p className="text-xs text-slate-400 font-bold font-mono">NO DATA RECORDED</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              No raiders have registered scores in this sector during this time window. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 px-3 text-[9px] font-mono uppercase text-slate-500 tracking-wider font-bold">
              <span className="col-span-2">RANK</span>
              <span className="col-span-6">PILOT ID</span>
              <span className="col-span-4 text-right">NEON SCORE</span>
            </div>

            {filteredEntries.slice(0, 100).map((entry, index) => {
              const isCurrentUser = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
              const rank = index + 1;
              
              // Custom rank styling
              let badgeColor = "bg-slate-900 border-slate-800 text-slate-400";
              let rowStyle = "bg-slate-900/40 border-slate-900/60 hover:bg-slate-900/60";
              if (rank === 1) {
                badgeColor = "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-sm shadow-yellow-500/10";
                rowStyle = "bg-yellow-950/20 border-yellow-500/20 hover:bg-yellow-950/30 shadow-sm shadow-yellow-500/5";
              } else if (rank === 2) {
                badgeColor = "bg-slate-300/10 border-slate-300/30 text-slate-300";
                rowStyle = "bg-slate-900/80 border-slate-700/20 hover:bg-slate-800/80";
              } else if (rank === 3) {
                badgeColor = "bg-amber-700/10 border-amber-700/30 text-amber-500";
                rowStyle = "bg-amber-950/10 border-amber-800/10 hover:bg-amber-950/20";
              }

              if (isCurrentUser) {
                rowStyle += " border-cyan-500/40 bg-cyan-950/10 shadow-md shadow-cyan-500/5";
              }

              return (
                <div
                  key={entry.id || index}
                  className={`grid grid-cols-12 items-center px-3 py-3 border rounded-xl transition-all ${rowStyle}`}
                >
                  {/* Rank badge */}
                  <div className="col-span-2 flex items-center">
                    <span className={`w-6 h-6 rounded-lg border text-xs font-mono font-black flex items-center justify-center ${badgeColor}`}>
                      {rank}
                    </span>
                  </div>

                  {/* Username */}
                  <div className="col-span-6 flex items-center gap-1.5 min-w-0">
                    <span className={`text-xs font-bold font-mono tracking-tight truncate ${isCurrentUser ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {entry.username}
                    </span>
                    {rank === 1 && <Flame className="w-3.5 h-3.5 text-yellow-500 shrink-0 animate-bounce" />}
                    {isCurrentUser && (
                      <span className="text-[7px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded shrink-0">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="col-span-4 text-right flex items-center justify-end gap-1 font-mono">
                    <span className={`text-xs font-black tracking-tight ${rank === 1 ? 'text-yellow-400' : (isCurrentUser ? 'text-cyan-400' : 'text-slate-300')}`}>
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STICKY USER STANDING IF RANK > 100 */}
      {!loading && !error && tabUserRank && tabUserRank > 100 && tabUserEntry && (
        <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-sm shrink-0 flex flex-col gap-1.5 shadow-inner">
          <div className="text-[9px] font-mono uppercase text-cyan-400 tracking-wider font-bold px-1">
            Your Sector Standing (Out of Top 100)
          </div>
          <div className="grid grid-cols-12 items-center px-3 py-2.5 border border-cyan-500/40 bg-cyan-950/25 rounded-xl shadow-md shadow-cyan-500/5">
            {/* Rank badge */}
            <div className="col-span-2 flex items-center">
              <span className="w-6 h-6 rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 text-xs font-mono font-black flex items-center justify-center">
                #{tabUserRank}
              </span>
            </div>

            {/* Username */}
            <div className="col-span-6 flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold font-mono tracking-tight truncate text-cyan-300">
                {tabUserEntry.username}
              </span>
              <span className="text-[7px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded shrink-0">
                YOU
              </span>
            </div>

            {/* Score */}
            <div className="col-span-4 text-right flex items-center justify-end gap-1 font-mono">
              <span className="text-xs font-black tracking-tight text-cyan-300">
                {tabUserEntry.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md shrink-0 flex justify-center">
        <button
          onClick={() => { SynthAudio.playCollect(); onClose(); }}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 rounded-sm skew-x-[-12deg] border border-slate-700/50 shadow-lg font-black tracking-widest transition duration-300 uppercase text-xs transform active:scale-[0.98]"
        >
          <span className="inline-block skew-x-[12deg]">RETURN TO FLIGHT DECK</span>
        </button>
      </div>
    </div>
  );
}
