import React, { useState } from 'react';
import { Upgrades, SHIP_SKINS, PlayerShipConfig } from '../types';
import { Shield, Zap, Sparkles, ShoppingBag, Check, Lock, ChevronRight, RefreshCw, Bot, Crosshair, Flame } from 'lucide-react';
import { SynthAudio } from '../utils/audio';

interface UpgradesStoreProps {
  upgrades: Upgrades;
  totalScrap: number;
  onPurchaseUpgrade: (key: keyof Omit<Upgrades, 'selectedSkin' | 'unlockedSkins'>, cost: number) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onSelectSkin: (skinId: string) => void;
  onSelectWeapon: (weaponId: string) => void;
  onClose: () => void;
}

const WEAPONS_CONFIG = [
  {
    id: 'plasma',
    name: 'Plasma Laser',
    color: '#00f0ff',
    icon: Zap,
    description: 'Searing focused plasma bolts with high projectile speed and rapid precision firing.',
    upgradeKey: 'weaponPlasmaLevel' as const,
  },
  {
    id: 'ion',
    name: 'Ion Pulse',
    color: '#10b981',
    icon: Crosshair,
    description: 'Heavy hyper-dense ionic spheres with wider blast radius, dealing extra base damage.',
    upgradeKey: 'weaponIonLevel' as const,
  },
  {
    id: 'wave',
    name: 'Wave Beam',
    color: '#a855f7',
    icon: Sparkles,
    description: 'Oscillating wide frequency fields that snake forward, sweeping wide sectors of enemies.',
    upgradeKey: 'weaponWaveLevel' as const,
  },
  {
    id: 'neutron',
    name: 'Neutron Flare',
    color: '#f59e0b',
    icon: Flame,
    description: 'Heavy thermonuclear rounds that split on impact, creating burning sparks for area damage.',
    upgradeKey: 'weaponNeutronLevel' as const,
  },
  {
    id: 'tesla',
    name: 'Tesla Volt',
    color: '#ec4899',
    icon: Zap,
    description: 'High-frequency chain lightning discharge that splits and arcs to multiple targets.',
    upgradeKey: 'weaponTeslaLevel' as const,
  },
];

export default function UpgradesStore({
  upgrades,
  totalScrap,
  onPurchaseUpgrade,
  onUnlockSkin,
  onSelectSkin,
  onSelectWeapon,
  onClose
}: UpgradesStoreProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'skins'>('stats');

  // Progressive, higher costs as requested
  const getUpgradeCost = (key: string, currentLevel: number) => {
    if (key === 'weaponType' || key === 'weaponPlasmaLevel' || key === 'weaponIonLevel' || key === 'weaponWaveLevel') {
      if (currentLevel === 1) return 500;
      if (currentLevel === 2) return 1200;
      if (currentLevel === 3) return 2500;
      return 0; // Max level is 4
    }
    if (key === 'companionDrone') {
      if (currentLevel === 0) return 300;
      if (currentLevel === 1) return 650;
      if (currentLevel === 2) return 1200;
      if (currentLevel === 3) return 2200;
      return 0; // Max level is 4
    }
    if (key === 'plasmaArmor' || key === 'criticalChance') {
      if (currentLevel >= 5) return 0;
      // Level 0: 250, Level 1: 500, Level 2: 900, Level 3: 1400, Level 4: 2000
      const costs = [250, 500, 900, 1400, 2000];
      return costs[currentLevel] || 0;
    }
    // maxShield, fireRate, scrapMagnet (max level 8 now!)
    if (currentLevel >= 8) return 0;
    // Progressive Costs: 1: 150, 2: 350, 3: 700, 4: 1200, 5: 1900, 6: 2800, 7: 4000, 8: 0
    const costs = [0, 150, 350, 700, 1200, 1900, 2800, 4000];
    return costs[currentLevel] || 0;
  };

  const handleStatUpgradeClick = (key: keyof Omit<Upgrades, 'selectedSkin' | 'unlockedSkins'>) => {
    const currentVal = upgrades[key] as number;
    const cost = getUpgradeCost(key, currentVal);
    
    if (cost > 0 && totalScrap >= cost) {
      onPurchaseUpgrade(key, cost);
      SynthAudio.playPowerup();
    } else {
      SynthAudio.playHurt(); // buzzer denial feedback
    }
  };

  const handleSkinClick = (skin: PlayerShipConfig) => {
    const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
    if (isUnlocked) {
      onSelectSkin(skin.id);
      SynthAudio.playCollect();
    } else {
      if (totalScrap >= skin.cost) {
        onUnlockSkin(skin.id, skin.cost);
        SynthAudio.playPowerup();
      } else {
        SynthAudio.playHurt();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-md text-slate-100 font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic">
            Hangar & Upgrades
          </h2>
        </div>
        {/* Scrap Indicator */}
        <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-yellow-400 font-mono text-xs font-black tracking-wider">{totalScrap} SCRAP</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-800/80 bg-slate-950/40 shrink-0 font-mono">
        <button
          id="tab-stats"
          onClick={() => { setActiveTab('stats'); SynthAudio.playCollect(); }}
          className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase border-b-2 transition-all ${
            activeTab === 'stats' 
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/30 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Weapon Systems
        </button>
        <button
          id="tab-skins"
          onClick={() => { setActiveTab('skins'); SynthAudio.playCollect(); }}
          className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase border-b-2 transition-all ${
            activeTab === 'skins' 
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/30 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Ship Blueprints
        </button>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'stats' ? (
          <div className="space-y-4 pb-6">
            {/* 1. MAIN WEAPON MATRIX SELECTION */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4 shadow-md backdrop-blur-sm">
              <div>
                <h3 className="font-bold text-sm text-slate-200 tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Main Weapon Customization
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select and upgrade your active offensive blaster class</p>
              </div>

              {/* Weapon Selector Grid */}
              <div className="grid grid-cols-3 gap-2">
                {WEAPONS_CONFIG.map((wpn) => {
                  const isSelected = (upgrades.selectedWeapon || 'plasma') === wpn.id;
                  const currentLevel = upgrades[wpn.upgradeKey] as number || 1;
                  const IconComponent = wpn.icon;

                  return (
                    <button
                      key={wpn.id}
                      id={`select-weapon-${wpn.id}`}
                      onClick={() => {
                        onSelectWeapon(wpn.id);
                        SynthAudio.playCollect();
                      }}
                      className={`flex flex-col items-center justify-between p-2.5 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-slate-800/85 border-cyan-400 shadow-md shadow-cyan-400/10'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <IconComponent 
                        className="w-4 h-4 mb-1" 
                        style={{ color: isSelected ? wpn.color : '#64748b' }}
                      />
                      <span className={`text-[10px] font-bold tracking-tight ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {wpn.name}
                      </span>
                      <span className="text-[9px] font-mono mt-1 text-slate-500 font-bold uppercase">
                        LV.{currentLevel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Weapon Detail & Upgrade Control */}
              {(() => {
                const currentWpnId = upgrades.selectedWeapon || 'plasma';
                const activeWpn = WEAPONS_CONFIG.find(w => w.id === currentWpnId) || WEAPONS_CONFIG[0];
                const currentLevel = upgrades[activeWpn.upgradeKey] as number || 1;
                const cost = getUpgradeCost(activeWpn.upgradeKey, currentLevel);

                return (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span 
                          className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-black font-mono"
                          style={{ backgroundColor: `${activeWpn.color}15`, color: activeWpn.color, border: `1px solid ${activeWpn.color}25` }}
                        >
                          ACTIVE SYSTEM
                        </span>
                        <h4 className="font-bold text-xs text-slate-200 mt-1.5">{activeWpn.name} (LV.{currentLevel}/4)</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[240px]">
                          {activeWpn.description}
                        </p>
                      </div>

                      {currentLevel < 4 ? (
                        <button
                          id={`upgrade-weapon-${activeWpn.id}`}
                          onClick={() => handleStatUpgradeClick(activeWpn.upgradeKey)}
                          disabled={totalScrap < cost}
                          className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                            totalScrap >= cost
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                            <span>{cost}</span>
                            <span className="text-[10px] opacity-80">S</span>
                          </span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                      )}
                    </div>

                    {/* Laser Level Visual */}
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4].map((lv) => (
                        <div key={lv} className="flex-1 flex flex-col gap-1 text-center">
                          <div 
                            className="h-1.5 rounded-full transition-all"
                            style={{ 
                              backgroundColor: lv <= currentLevel ? activeWpn.color : '#1e293b',
                              boxShadow: lv <= currentLevel ? `0 0 8px ${activeWpn.color}` : 'none'
                            }}
                          />
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                            {lv === 1 ? 'Single' : lv === 2 ? 'Double' : lv === 3 ? 'Triple' : 'Quad'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. MAX SHIELDS HP */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Shield Plates</h3>
                    <p className="text-xs text-slate-400">Increase maximum core integrity</p>
                  </div>
                </div>
                {upgrades.maxShield < 8 ? (
                  <button
                    id="upgrade-shield"
                    onClick={() => handleStatUpgradeClick('maxShield')}
                    disabled={totalScrap < getUpgradeCost('maxShield', upgrades.maxShield)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('maxShield', upgrades.maxShield)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('maxShield', upgrades.maxShield)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Max Shield Visual Level */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.maxShield ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                LEVEL {upgrades.maxShield}/8 • TOTAL SHIELD: <span className="text-cyan-400 font-bold">{100 + (upgrades.maxShield - 1) * 20}</span>
              </p>
            </div>

            {/* 3. FIRE RATE */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Generator Coils</h3>
                    <p className="text-xs text-slate-400">Increase laser firing tempo</p>
                  </div>
                </div>
                {upgrades.fireRate < 8 ? (
                  <button
                    id="upgrade-firerate"
                    onClick={() => handleStatUpgradeClick('fireRate')}
                    disabled={totalScrap < getUpgradeCost('fireRate', upgrades.fireRate)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('fireRate', upgrades.fireRate)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('fireRate', upgrades.fireRate)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Fire Rate Visual Level */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.fireRate ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                LEVEL {upgrades.fireRate}/8 • COOLDOWN DELAY: <span className="text-cyan-400 font-bold">{Math.max(0.06, 0.35 - (upgrades.fireRate - 1) * 0.038).toFixed(3)}s</span>
              </p>
            </div>

            {/* 4. SCRAP MAGNET */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Scrap Attractor</h3>
                    <p className="text-xs text-slate-400">Pull scrap from further distances</p>
                  </div>
                </div>
                {upgrades.scrapMagnet < 8 ? (
                  <button
                    id="upgrade-magnet"
                    onClick={() => handleStatUpgradeClick('scrapMagnet')}
                    disabled={totalScrap < getUpgradeCost('scrapMagnet', upgrades.scrapMagnet)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('scrapMagnet', upgrades.scrapMagnet)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('scrapMagnet', upgrades.scrapMagnet)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Magnet Range Level */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.scrapMagnet ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                LEVEL {upgrades.scrapMagnet}/8 • PULL RADIUS: <span className="text-cyan-400 font-bold">{50 + upgrades.scrapMagnet * 25}px</span>
              </p>
            </div>

            {/* 5. COMPANION SENTRY DRONE */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Bot className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Auxiliary Sentry</h3>
                    <p className="text-xs text-slate-400">Unlock tactical autonomous support drones</p>
                  </div>
                </div>
                {upgrades.companionDrone < 4 ? (
                  <button
                    id="upgrade-companion"
                    onClick={() => handleStatUpgradeClick('companionDrone')}
                    disabled={totalScrap < getUpgradeCost('companionDrone', upgrades.companionDrone)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('companionDrone', upgrades.companionDrone)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('companionDrone', upgrades.companionDrone)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Drone Level indicator */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.companionDrone ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider leading-relaxed">
                STATUS: {upgrades.companionDrone === 0 ? (
                  <span className="text-slate-500 font-bold">OFFLINE</span>
                ) : upgrades.companionDrone === 1 ? (
                  <span className="text-emerald-400 font-bold">LV.1 - Plasma Sentry Active</span>
                ) : upgrades.companionDrone === 2 ? (
                  <span className="text-amber-400 font-bold">LV.2 - Smart Homing Drone</span>
                ) : upgrades.companionDrone === 3 ? (
                  <span className="text-pink-400 font-bold">LV.3 - Dual Piercing Fusion Sentries</span>
                ) : (
                  <span className="text-purple-400 font-black">LV.4 - Tri-Beam Pulse Phalanx Matrix</span>
                )}
              </p>
            </div>

            {/* 6. PLASMA ARMOR */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Plasma Armor</h3>
                    <p className="text-xs text-slate-400">Reduce damage taken from all hazards</p>
                  </div>
                </div>
                {upgrades.plasmaArmor < 5 ? (
                  <button
                    id="upgrade-plasma-armor"
                    onClick={() => handleStatUpgradeClick('plasmaArmor')}
                    disabled={totalScrap < getUpgradeCost('plasmaArmor', upgrades.plasmaArmor)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('plasmaArmor', upgrades.plasmaArmor)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('plasmaArmor', upgrades.plasmaArmor)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Armor level visual */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.plasmaArmor ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                LEVEL {upgrades.plasmaArmor}/5 • DAMAGE REDUCTION: <span className="text-indigo-400 font-bold">{(upgrades.plasmaArmor * 8)}%</span>
              </p>
            </div>

            {/* 7. CRITICAL MATRIX */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Crosshair className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 tracking-tight">Critical Matrix</h3>
                    <p className="text-xs text-slate-400">Add chance for double-damage critical lasers</p>
                  </div>
                </div>
                {upgrades.criticalChance < 5 ? (
                  <button
                    id="upgrade-critical-chance"
                    onClick={() => handleStatUpgradeClick('criticalChance')}
                    disabled={totalScrap < getUpgradeCost('criticalChance', upgrades.criticalChance)}
                    className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1 transition-all ${
                      totalScrap >= getUpgradeCost('criticalChance', upgrades.criticalChance)
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                      <span>{getUpgradeCost('criticalChance', upgrades.criticalChance)}</span>
                      <span className="text-[10px] opacity-80">S</span>
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">MAX</span>
                )}
              </div>

              {/* Crit level visual */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i <= upgrades.criticalChance ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' : 'bg-slate-850'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                LEVEL {upgrades.criticalChance}/5 • CRIT CHANCE: <span className="text-yellow-450 font-bold">{(upgrades.criticalChance * 7)}%</span>
              </p>
            </div>
          </div>
        ) : (
          /* SKINS TAB */
          <div className="grid grid-cols-1 gap-4 pb-6">
            {SHIP_SKINS.map((skin) => {
              const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
              const isEquipped = upgrades.selectedSkin === skin.id;

              return (
                <div 
                  key={skin.id}
                  onClick={() => handleSkinClick(skin)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between ${
                    isEquipped 
                      ? 'bg-slate-900/80 border-cyan-400 shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Retro Ship Preview Symbol */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-950/60 relative overflow-hidden border border-slate-800">
                      <div 
                        className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[18px] border-l-transparent border-r-transparent animate-pulse"
                        style={{ borderBottomColor: skin.color }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-100 tracking-tight">{skin.name}</h4>
                        {isEquipped && (
                          <span className="text-[8px] uppercase tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                        {skin.description}
                      </p>
                      <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-800/80 pt-1.5 max-w-[185px]">
                        <span className="text-[9px] font-mono font-black uppercase text-yellow-400/90 tracking-wide flex items-center gap-1">
                          ⚡ {skin.passiveTitle}
                        </span>
                        <span className="text-[9px] text-slate-500 leading-tight">
                          {skin.passiveDesc}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase/Select actions */}
                  <div>
                    {isEquipped ? (
                      <div className="p-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : isUnlocked ? (
                      <span className="text-[10px] font-mono font-black tracking-wider text-slate-400 hover:text-slate-200 uppercase bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-sm">EQUIP</span>
                    ) : (
                      <button
                        id={`unlock-skin-${skin.id}`}
                        disabled={totalScrap < skin.cost}
                        className={`px-3 py-1.5 rounded-sm skew-x-[-8deg] text-xs font-mono font-black flex items-center gap-1.5 transition-all ${
                          totalScrap >= skin.cost
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="inline-block skew-x-[8deg] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{skin.cost}</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md flex gap-2 shrink-0 justify-center">
        <button
          id="close-store-btn"
          onClick={() => { SynthAudio.playCollect(); onClose(); }}
          className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm skew-x-[-12deg] shadow-[0_0_25px_rgba(34,211,238,0.3)] font-black tracking-widest transition duration-300 uppercase text-xs transform active:scale-[0.98]"
        >
          <span className="inline-block skew-x-[12deg]">CONFIRM & LAUNCH SHIP</span>
        </button>
      </div>
    </div>
  );
}
