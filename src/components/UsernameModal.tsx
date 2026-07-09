import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface UsernameModalProps {
  currentUsername: string;
  onSave: (newUsername: string) => void;
  onClose: () => void;
  canCancel?: boolean;
}

export default function UsernameModal({ currentUsername, onSave, onClose, canCancel = true }: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (!trimmed) {
      setError('Pilot ID cannot be empty');
      return;
    }

    if (trimmed.length < 3) {
      setError('Pilot ID must be at least 3 characters');
      return;
    }

    if (trimmed.length > 15) {
      setError('Pilot ID must not exceed 15 characters');
      return;
    }

    // Only allow letters, numbers, underscores and dashes
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(trimmed)) {
      setError('Alphanumeric and _ - characters only');
      return;
    }

    SynthAudio.playCollect();
    onSave(trimmed);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-[320px] shadow-2xl relative space-y-4">
        
        {/* TOP GLOWING ICON */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic tracking-widest font-sans">
            Pilot Registration
          </h3>
          <p className="text-[10px] text-slate-400 font-mono">ESTABLISH A UNIQUE SYSTEM CALLSIGN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              CALLSIGN ENCODING
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. STAR_LORD_7"
                maxLength={15}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none transition-all placeholder:text-slate-700"
              />
              <span className="absolute right-3.5 top-3.5 text-[8px] font-mono text-slate-600">
                {username.trim().length}/15
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Description of CallSign rules */}
          <div className="text-[9px] font-mono text-slate-500 leading-normal space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
            <p>• Unique ID for the live leaderboard</p>
            <p>• Max 15 alphanumeric characters & underscores</p>
          </div>

          {/* Action Row */}
          <div className={canCancel ? "grid grid-cols-2 gap-2 pt-1" : "flex pt-1 w-full"}>
            {canCancel && (
              <button
                type="button"
                onClick={() => { SynthAudio.playCollect(); onClose(); }}
                className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-sm skew-x-[-10deg] font-bold tracking-widest transition text-[10px] w-full"
              >
                <span className="inline-block skew-x-[10deg]">CANCEL</span>
              </button>
            )}
            <button
              type="submit"
              className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm skew-x-[-10deg] shadow-[0_0_15px_rgba(34,211,238,0.2)] font-black tracking-widest transition text-[10px] w-full"
            >
              <span className="inline-block skew-x-[10deg] flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> CONFIRM
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
