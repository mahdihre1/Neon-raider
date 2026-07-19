import React, { useState } from 'react';
import { motion } from 'motion/react';
import { submitContactMessage } from '../lib/firebase';
import { SynthAudio } from '../utils/audio';
import { 
  X, 
  ShieldCheck, 
  Info, 
  Mail, 
  Send, 
  Loader, 
  AlertCircle, 
  ArrowLeft, 
  Compass, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface CompliancePagesProps {
  onClose: () => void;
  initialTab?: 'about' | 'privacy' | 'contact';
}

export default function CompliancePages({ onClose, initialTab = 'about' }: CompliancePagesProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'contact'>(initialTab);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setSubmitStatus('error');
      setErrorMessage('ALL SYSTEMS REQUIRE DATA: Please fill out all input fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    SynthAudio.playPowerup();

    try {
      const success = await submitContactMessage(form);
      if (success) {
        setSubmitStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
        SynthAudio.playCollect();
      } else {
        setSubmitStatus('error');
        setErrorMessage('COMMUNICATION OUTAGE: Failed to beam message to cloud. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setSubmitStatus('error');
      setErrorMessage('TRANSMISSION FAILURE: Schema validation rejected or permissions blocked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'about' as const, label: 'ABOUT PROJECT', icon: Info },
    { id: 'privacy' as const, label: 'PRIVACY POLICY', icon: ShieldCheck },
    { id: 'contact' as const, label: 'CONTACT HUB', icon: Mail },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-md flex flex-col z-[100] text-slate-100 p-4 sm:p-5 select-none font-sans overflow-y-auto scrollbar-none">
      {/* Holographic scanning grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(0,255,255,0.02),rgba(255,0,255,0.01),rgba(0,255,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <div>
            <h2 className="text-sm font-black font-mono tracking-wider text-slate-100 uppercase">SYS_CONTROL_PANEL</h2>
            <p className="text-[8px] font-mono text-cyan-400 uppercase">TRANSMISSION & LEGAL TELEMETRY</p>
          </div>
        </div>
        <button
          onClick={() => { SynthAudio.playCollect(); onClose(); }}
          className="p-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 bg-slate-900/60 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 mb-4 z-10 font-mono">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { SynthAudio.playCollect(); setActiveTab(t.id); }}
              className={`py-2 px-1 rounded-lg border text-[9px] sm:text-[10px] font-bold tracking-tight transition duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                active 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.label}</span>
              <span className="xs:hidden">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 overflow-y-auto scrollbar-none z-10 flex flex-col shadow-inner relative">
        
        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">PROJECT DECK OVERVIEW</h3>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Welcome to <span className="text-cyan-400 font-bold">NEON RAIDER ARCADE</span>, a premium space shooter and deep combat simulator. Designed with responsive, touch-drag dynamics, a robust weapon tuning grid, and interactive real-time telemetry.
            </p>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest border-l-2 border-yellow-500 pl-2">GAMEPLAY LOOPS & SYSTEMS</h4>
              <ul className="space-y-1.5 list-disc list-inside text-[10px] text-slate-400 pl-1">
                <li><strong className="text-slate-200">Arcade Mission:</strong> Fight relentless asteroids, mine rare minerals, and dispatch glowing neon bosses with custom projectile sweeps.</li>
                <li><strong className="text-slate-200">Cluck Campaign:</strong> Experience the funny story campaign featuring cosmic space hens bent on intergalactic egg dominance!</li>
                <li><strong className="text-slate-200">Hangar Tuning:</strong> Trade harvested Amethyst Scrap for shields, rate of fire multipliers, and holographic ship hulls.</li>
                <li><strong className="text-slate-200">Live Global Rankings:</strong> Synced instantly to Google Firestore, challenging other pilots for sector supremacy.</li>
              </ul>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FLIGHT MANUAL & CONTROLS</span>
              </h4>
              <p className="text-[9px] text-slate-400 leading-normal">
                Guide your starfighter by clicking and dragging directly on the active combat screen, or use standard <span className="text-slate-200 font-bold">W-A-S-D / ARROW keys</span>. Fire sweeps are fully automated based on your weapon's cycle rate. Keep an eye on your energy cores; running into space debris compromises hull plating.
              </p>
            </div>

            <div className="text-[9px] text-slate-500 border-t border-slate-800/60 pt-3 flex justify-between">
              <span>FIRMWARE MODEL: NR-95-A</span>
              <span>COMPILATION STATUS: SECURE</span>
            </div>
          </motion.div>
        )}

        {/* PRIVACY POLICY TAB */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">PRIVACY POLICY</h3>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Last Updated: <span className="text-slate-200">July 19, 2026</span>. At Neon Raider Arcade, we are committed to providing a secure and transparent gaming environment. This Privacy Policy details how we compile, store, and utilize data.
            </p>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase">1. DATA RETENTION & FIREBASE</h4>
                <p className="text-[9px] text-slate-400 leading-normal">
                  We use secure Google Cloud Firestore persistence to process our public Highscore Leaderboard. We only record your self-designated username and game performance scores. For user inquiries, contact form details are stored safely and strictly never shared.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase">2. THIRD-PARTY ADVERTISING & COOKIES</h4>
                <p className="text-[9px] text-slate-400 leading-normal">
                  To provide free gameplay modules, this site integrates third-party services including <span className="text-slate-200">Google AdSense H5 Games Ads</span>. These service providers may place and access cookies or device identifiers on your browser to show relevant contextual advertising, analyze page traffic, and prevent ad-fraud.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase">3. COOKIE OPT-OUTS & CONTROL</h4>
                <p className="text-[9px] text-slate-400 leading-normal">
                  You can configure your browser to decline third-party cookies or alert you when cookies are sent. Clearing your browser cookies or storage cache will instantly reset your offline hangar upgrades, high score records, and user configuration keys.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase">4. CHILD PROTECTION (COPPA)</h4>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Our service does not knowingly collect personally identifiable info from children under the age of 13. If you believe your child has submitted sensitive email or form details, please notify us immediately in our Contact Hub to purge those records.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-[9px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-400 mb-0.5">ADSENSE H5 GAMES AD PLACEMENT COMPLIANCE:</p>
              This app conforms fully to the official Google H5 Games Ad placement criteria, utilizing safe event callbacks, non-invasive frequency caps, and graceful fallbacks during offline gameplay modules.
            </div>
          </motion.div>
        )}

        {/* CONTACT HUB TAB */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">COMMUNICATION CONTROLS</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Beam feedback, bug telemetry, or business inquiries directly to the development command. Submissions are synced to Firestore.
              </p>

              {submitStatus === 'success' ? (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3 my-auto"
                >
                  <div className="mx-auto w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">TRANSMISSION EN ROUTE</p>
                    <p className="text-[9px] text-slate-300 leading-relaxed">
                      Your pilot coordinates and inquiry have been received securely.
                    </p>
                  </div>
                  <button
                    onClick={() => { SynthAudio.playCollect(); setSubmitStatus('idle'); }}
                    className="py-1.5 px-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer"
                  >
                    SEND NEW BEAM
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-2.5 text-[10px]">
                  {submitStatus === 'error' && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl flex items-start gap-2 text-rose-300 text-[9px] leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">PILOT NAME</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        maxLength={100}
                        placeholder="e.g. Commander Luke"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-lg p-2 text-slate-200 outline-none transition-all placeholder:text-slate-700"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">PILOT EMAIL</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        maxLength={150}
                        placeholder="luke@hyperdrive.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-lg p-2 text-slate-200 outline-none transition-all placeholder:text-slate-700"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">SUBJECT TELEMETRY</label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleInputChange}
                      maxLength={150}
                      placeholder="e.g. Laser balancing feedback / partnership request"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-lg p-2 text-slate-200 outline-none transition-all placeholder:text-slate-700"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">TRANSMISSION BODY</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleInputChange}
                      maxLength={1000}
                      rows={3}
                      placeholder="Enter detailed message parameters..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-lg p-2 text-slate-200 outline-none transition-all placeholder:text-slate-700 resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg transition duration-200 flex items-center justify-center gap-2 tracking-widest uppercase text-[10px] cursor-pointer disabled:opacity-50 select-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-3.5 h-3.5 text-slate-950 animate-spin" />
                        <span>TRANSMITTING CORES...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>BEAM MESSAGE TO CLOUD</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="text-[8px] text-slate-600 font-mono text-center mt-3 pt-2.5 border-t border-slate-850 uppercase tracking-widest">
              <span>SECURE END-TO-END TLS HANDSHAKE SYNC</span>
            </div>
          </motion.div>
        )}
        
      </div>
    </div>
  );
}
