import React, { useState, useEffect } from 'react';
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
  Compass, 
  HelpCircle,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export type ComplianceTab = 'about' | 'privacy' | 'terms' | 'guide' | 'contact';

interface CompliancePagesProps {
  onClose: () => void;
  initialTab?: ComplianceTab;
}

export default function CompliancePages({ onClose, initialTab = 'about' }: CompliancePagesProps) {
  const [activeTab, setActiveTab] = useState<ComplianceTab>(initialTab);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const switchTab = (tab: ComplianceTab) => {
    SynthAudio.playCollect();
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

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

  const tabs: { id: ComplianceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'about', label: 'ABOUT', icon: Info },
    { id: 'guide', label: 'HOW TO PLAY', icon: BookOpen },
    { id: 'privacy', label: 'PRIVACY POLICY', icon: ShieldCheck },
    { id: 'terms', label: 'TERMS OF SERVICE', icon: FileText },
    { id: 'contact', label: 'CONTACT HUB', icon: Mail },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-md flex flex-col z-[100] text-slate-100 p-3 sm:p-5 select-none font-sans overflow-hidden">
      {/* Holographic scanning grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(0,255,255,0.02),rgba(255,0,255,0.01),rgba(0,255,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <div>
            <h2 className="text-sm font-black font-mono tracking-wider text-slate-100 uppercase">SYS_CONTROL_PANEL</h2>
            <p className="text-[8px] font-mono text-cyan-400 uppercase">OFFICIAL LEGAL, POLICY & TELEMETRY HUB</p>
          </div>
        </div>
        <button
          onClick={() => { SynthAudio.playCollect(); onClose(); }}
          className="p-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 bg-slate-900/60 transition-all cursor-pointer"
          aria-label="Close legal and system panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-5 gap-1 mb-3 z-10 font-mono shrink-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`py-2 px-1 rounded-lg border text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-tight transition duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                active 
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents Container */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 z-10 shadow-inner relative">
        
        {/* ==================== 1. ABOUT TAB ==================== */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">ABOUT NEON RAIDER ARCADE</h3>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Welcome to <span className="text-cyan-400 font-bold">NEON RAIDER ARCADE</span> (<a href="https://www.neon-raider.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline hover:text-cyan-200">www.neon-raider.com</a>). Neon Raider is a high-octane, browser-based sci-fi arcade space shooter engineered for players who crave responsive retro combat, deep progression systems, and vibrant synthwave aesthetics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CORE GAMEPLAY FEATURES</span>
                </h4>
                <ul className="space-y-1 list-disc list-inside text-[10px] text-slate-400">
                  <li><strong className="text-slate-200">Pulse-Pounding Combat:</strong> Weave through dense cosmic asteroid fields and destroy hostile alien fighters.</li>
                  <li><strong className="text-slate-200">Epic Boss Encounters:</strong> Face off against massive dreadnought motherships and cunning celestial hazards.</li>
                  <li><strong className="text-slate-200">Modular Weapon Armory:</strong> Customize your starfighter with Plasma Cores, Ion Cannons, Sonic Waves, Neutron Blasters, and Tesla Coils.</li>
                  <li><strong className="text-slate-200">Real-Time Cloud Leaderboard:</strong> Compete with pilots worldwide with verified live score telemetry.</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>TECHNICAL ARCHITECTURE</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Neon Raider is built with modern Web Standards: TypeScript, React, HTML5 60FPS Canvas Rendering, Web Audio API procedural sound synthesizers, and Google Cloud Firestore for secure high-score replication.
                </p>
                <p className="text-[9px] text-slate-500 pt-1">
                  Engineered with zero third-party tracking bloat, optimized for instant mobile touchscreen gestures and desktop keyboard controls alike.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">CREATOR & MISSION</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Our mission is to deliver pure, frictionless arcade enjoyment directly in the browser—no mandatory account creation, zero pay-to-win mechanics, and genuine respect for player privacy and transparent advertising practices.
              </p>
            </div>

            <div className="text-[9px] text-slate-500 border-t border-slate-800/60 pt-3 flex flex-wrap justify-between items-center gap-2">
              <span>FIRMWARE MODEL: NR-ARCADE-v2.4</span>
              <span>DOMAIN: WWW.NEON-RAIDER.COM</span>
              <span>STATUS: PRODUCTION ONLINE</span>
            </div>
          </motion.div>
        )}

        {/* ==================== 2. HOW TO PLAY TAB ==================== */}
        {activeTab === 'guide' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">PILOT FLIGHT MANUAL & GAME GUIDE</h3>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Review flight protocols before engaging hostile sectors. Mastering movement vectors and weapon loadouts is vital for survival.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>FLIGHT CONTROLS</span>
                </h4>
                <ul className="space-y-1.5 text-[10px] text-slate-400">
                  <li><strong className="text-slate-200">Touch & Drag (Mobile):</strong> Touch and drag anywhere on your display to steer your ship with sub-millimeter precision.</li>
                  <li><strong className="text-slate-200">Mouse Control (Desktop):</strong> Click and glide your cursor to command ship position.</li>
                  <li><strong className="text-slate-200">Keyboard Controls:</strong> Use <span className="text-slate-200 font-bold bg-slate-800 px-1 py-0.5 rounded">W A S D</span> or <span className="text-slate-200 font-bold bg-slate-800 px-1 py-0.5 rounded">Arrow Keys</span> for digital steering.</li>
                  <li><strong className="text-slate-200">Autofire:</strong> Ship primary turrets fire automatically on cycle.</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ENERGY & SHIELDS</span>
                </h4>
                <ul className="space-y-1.5 text-[10px] text-slate-400">
                  <li><strong className="text-slate-200">Hull Integrity:</strong> Colliding with space debris, asteroids, or enemy projectiles depletes your kinetic shield.</li>
                  <li><strong className="text-slate-200">Shield Regrowth:</strong> Upgrade your Max Shield in the Armory Shop to sustain multiple direct hits.</li>
                  <li><strong className="text-slate-200">Scrap Magnet:</strong> Upgrade the attractor field to pull valuable Amethyst Scrap without dangerous maneuvers.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">TACTICAL SCORING & WEAPONS</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Destroying consecutive waves increases your Score Multiplier. Collect Amethyst crystals dropped by shattered asteroids to finance ship hull upgrades, higher firing velocities, and specialized photon weaponry.
              </p>
            </div>
          </motion.div>
        )}

        {/* ==================== 3. PRIVACY POLICY TAB ==================== */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">PRIVACY POLICY</h3>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Effective Date:</strong> October 2, 2026</p>
              <p><strong className="text-slate-200">Official Website:</strong> <a href="https://www.neon-raider.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">https://www.neon-raider.com/</a></p>
              <p>At Neon Raider Arcade, protecting the privacy and personal data of our visitors and pilots is a paramount commitment. This Privacy Policy details the types of information we collect, how it is used, and the choices available to you regarding your data.</p>
            </div>

            <div className="space-y-3 text-[10px] text-slate-400">
              {/* 1. Google AdSense & Third-Party Advertising */}
              <div className="bg-slate-950/40 border border-cyan-950/60 rounded-xl p-3 space-y-1.5 border-l-2 border-l-cyan-400">
                <h4 className="text-[11px] font-bold text-cyan-300 uppercase">1. GOOGLE ADSENSE & THIRD-PARTY ADVERTISING DISCLOSURE</h4>
                <p className="leading-relaxed">
                  We display advertisements served by <strong className="text-slate-200">Google AdSense</strong> and authorized Google ad network partners to support the free operation and continuous development of Neon Raider Arcade.
                </p>
                <ul className="space-y-1.5 list-disc list-inside pl-1 text-[9.5px]">
                  <li><strong className="text-slate-200">Third-Party Cookies:</strong> Third-party vendors, including Google, use cookies and web beacons to serve ads based on a user's prior visits to our website (<a href="https://www.neon-raider.com/" className="text-cyan-400 underline">www.neon-raider.com</a>) or other websites across the Internet.</li>
                  <li><strong className="text-slate-200">Advertising Cookies:</strong> Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.</li>
                  <li><strong className="text-slate-200">Opting Out of Personalized Advertising:</strong> Users may opt out of personalized advertising at any time by visiting Google's official Ad Settings page: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline font-bold">https://adssettings.google.com</a>.</li>
                  <li><strong className="text-slate-200">Third-Party Opt-Out Portals:</strong> Alternatively, you can opt out of a participating third-party vendor's use of cookies for personalized advertising by visiting the Network Advertising Initiative (NAI) at <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">www.networkadvertising.org/choices/</a> or the Digital Advertising Alliance (DAA) at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">www.aboutads.info</a>.</li>
                </ul>
              </div>

              {/* 2. Information We Collect */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">2. INFORMATION WE COLLECT</h4>
                <p className="leading-relaxed">
                  We strive to collect the minimum necessary data to provide a seamless gaming experience:
                </p>
                <ul className="space-y-1 list-disc list-inside pl-1 text-[9.5px]">
                  <li><strong className="text-slate-200">Voluntarily Provided Data:</strong> When submitting high scores to our global leaderboard, you provide a chosen pilot callsign/username. When using our Contact Hub, you provide your name, email address, subject, and message.</li>
                  <li><strong className="text-slate-200">Device & Telemetry Data:</strong> Standard server logs record anonymous technical parameters such as browser user agent, operating system, and viewport aspect ratio strictly to optimize canvas rendering performance.</li>
                  <li><strong className="text-slate-200">Local Browser Storage:</strong> We use HTML5 LocalStorage to save your unlocked ship hulls, high scores, weapon upgrade ranks, and sound preferences locally on your device. LocalStorage data remains strictly on your device and is never uploaded without explicit action.</li>
                </ul>
              </div>

              {/* 3. Data Retention & Firestore */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">3. DATA RETENTION & SECURITY</h4>
                <p className="leading-relaxed">
                  Public leaderboards and user inquiries are processed securely through Google Cloud Firestore infrastructure with TLS 1.3 encryption in transit. We do not sell, rent, or trade your personal information or contact details to third parties for commercial marketing purposes.
                </p>
              </div>

              {/* 4. Children's Privacy (COPPA) */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">4. CHILDREN'S PRIVACY (COPPA COMPLIANCE)</h4>
                <p className="leading-relaxed">
                  Neon Raider Arcade is designed for general audiences and does not knowingly collect personally identifiable information from children under the age of 13. If you believe that a child under 13 has provided personal details via our contact form, please contact us immediately through our Contact Hub and we will promptly purge such records.
                </p>
              </div>

              {/* 5. GDPR & CCPA Rights */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">5. EUROPEAN (GDPR) & CALIFORNIA (CCPA/CPRA) PRIVACY RIGHTS</h4>
                <p className="leading-relaxed">
                  Depending on your jurisdiction, you have the right to request access to, rectification of, or deletion of any personal data you have transmitted to us. You may also object to the processing of your personal data or exercise your right to data portability. To exercise these rights, submit a request via our Contact Hub.
                </p>
              </div>

              {/* 6. Contact for Privacy Inquiries */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">6. PRIVACY CONTACT</h4>
                <p className="leading-relaxed">
                  If you have questions or concerns regarding this Privacy Policy or our data practices, please contact us via our Contact Hub or email our privacy administration at <span className="text-cyan-300">dottigermmahdi@gmail.com</span>.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 4. TERMS OF SERVICE TAB ==================== */}
        {activeTab === 'terms' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">TERMS OF SERVICE</h3>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Last Updated:</strong> October 2, 2026</p>
              <p><strong className="text-slate-200">Domain:</strong> <a href="https://www.neon-raider.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">https://www.neon-raider.com/</a></p>
              <p>Please read these Terms of Service ("Terms") carefully before accessing or playing Neon Raider Arcade. By accessing or playing the game, you agree to be bound by these Terms.</p>
            </div>

            <div className="space-y-3 text-[10px] text-slate-400">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">1. GRANT OF LICENSE</h4>
                <p className="leading-relaxed">
                  Neon Raider Arcade grants you a personal, non-exclusive, non-transferable, revocable license to access and play the game for personal, non-commercial entertainment purposes through compatible web browsers.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">2. VIRTUAL ITEMS & IN-GAME CURRENCY</h4>
                <p className="leading-relaxed">
                  In-game currencies (such as Amethyst Scrap), pilot upgrades, ship skins, and weapons are virtual items designed strictly for entertainment within the game. They possess <strong className="text-slate-200">no real-world monetary value</strong>, cannot be redeemed for fiat currency, and may not be purchased, sold, or transferred outside of the game environment.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">3. ACCEPTABLE USE & FAIR PLAY</h4>
                <p className="leading-relaxed">
                  You agree to use Neon Raider Arcade only for lawful purposes. You agree not to:
                </p>
                <ul className="space-y-1 list-disc list-inside pl-1 text-[9.5px]">
                  <li>Inject malicious code, exploit memory anomalies, or use automated bots to artificially manipulate leaderboard rankings.</li>
                  <li>Transmit offensive, abusive, unlawful, or infringing content via the pilot username or contact form systems.</li>
                  <li>Attempt to decompile, reverse-engineer, or disassemble any part of the game client or network protocols.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">4. INTELLECTUAL PROPERTY</h4>
                <p className="leading-relaxed">
                  All game graphics, synthetic audio assets, codebases, lore, and visual designs are the intellectual property of Neon Raider Arcade. All rights not expressly granted herein are reserved.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">5. DISCLAIMER OF WARRANTIES</h4>
                <p className="leading-relaxed">
                  Neon Raider Arcade is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not warrant that gameplay will be uninterrupted, error-free, or free of bugs.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">6. LIMITATION OF LIABILITY</h4>
                <p className="leading-relaxed">
                  In no event shall Neon Raider Arcade or its creators be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or inability to access the game.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase">7. MODIFICATIONS TO TERMS</h4>
                <p className="leading-relaxed">
                  We reserve the right to revise or replace these Terms at our discretion. Any revisions will be posted directly to this page with an updated effective date. Continued access following changes constitutes acceptance of modified terms.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 5. CONTACT HUB TAB ==================== */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 mb-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">DEVELOPER & SUPPORT CONTACT</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Direct all gameplay inquiries, bug reports, feature suggestions, and business or ad inquiries to our support command. Submissions are synced to Firestore.
              </p>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-[9px] text-slate-400 flex items-center justify-between">
                <span>OFFICIAL EMAIL: <strong className="text-cyan-300">dottigermmahdi@gmail.com</strong></span>
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> VERIFIED SUPPORT</span>
              </div>

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
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">TRANSMISSION RECEIVED</p>
                    <p className="text-[9px] text-slate-300 leading-relaxed">
                      Your transmission has been logged. Our development crew will review your message shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => { SynthAudio.playCollect(); setSubmitStatus('idle'); }}
                    className="py-1.5 px-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer"
                  >
                    SEND ANOTHER TRANSMISSION
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
                      placeholder="e.g. Ad inquiry, Bug report, or Gameplay feedback"
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

            <div className="text-[8px] text-slate-600 font-mono text-center mt-3 pt-2.5 border-t border-slate-800 uppercase tracking-widest">
              <span>SECURE END-TO-END ENCRYPTED TRANSMISSION</span>
            </div>
          </motion.div>
        )}
        
      </div>
    </div>
  );
}
