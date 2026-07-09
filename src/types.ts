export interface Upgrades {
  maxShield: number;      // Level 1-8
  fireRate: number;       // Level 1-8
  scrapMagnet: number;    // Level 1-8
  weaponType: number;     // Level 1-4 (Single, Double, Triple, Quad)
  companionDrone: number;  // Level 0-4 (0: None, 1: Basic, 2: Tracking, 3: Dual, 4: Triple Fusion)
  plasmaArmor: number;    // Level 0-5 (0: None, 1-5: 8% reduction per level)
  criticalChance: number; // Level 0-5 (0: None, 1-5: 7% crit chance per level)
  selectedSkin: string;   // 'cyan' | 'pink' | 'gold' | 'emerald'
  unlockedSkins: string[]; // List of unlocked skins
  selectedWeapon: string; // 'plasma' | 'ion' | 'wave' | 'neutron' | 'tesla'
  weaponPlasmaLevel: number; // Level 1-4 (Plasma Laser)
  weaponIonLevel: number;    // Level 1-4 (Ion Pulse)
  weaponWaveLevel: number;   // Level 1-4 (Wave Beam)
  weaponNeutronLevel: number; // Level 1-4 (Neutron Flare)
  weaponTeslaLevel: number;   // Level 1-4 (Tesla Volt)
}

export interface GameStats {
  highScore: number;
  totalScrap: number;
  accumulatedScrap: number; // For achievements
  runsPlayed: number;
  enemiesDestroyed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  progressMax: number;
  progressCurrent: number;
}

export interface PlayerShipConfig {
  id: string;
  name: string;
  color: string;
  trailColor: string;
  cost: number;
  description: string;
  passiveTitle: string;
  passiveDesc: string;
}

export const SHIP_SKINS: PlayerShipConfig[] = [
  {
    id: 'cyan',
    name: 'Neon Swift',
    color: '#00f0ff',
    trailColor: 'rgba(0, 240, 255, 0.4)',
    cost: 0,
    description: 'Standard reconnaissance model. Fast and agile.',
    passiveTitle: 'Agility Drive',
    passiveDesc: '+15% Thruster maneuverability speed.'
  },
  {
    id: 'pink',
    name: 'Viper Strike',
    color: '#ff007f',
    trailColor: 'rgba(255, 0, 127, 0.4)',
    cost: 400,
    description: 'Sleek interceptor built for high-tempo skirmishes.',
    passiveTitle: 'Hyper-Heaters',
    passiveDesc: '+15% Faster laser firing frequency.'
  },
  {
    id: 'emerald',
    name: 'Jade Enforcer',
    color: '#10b981',
    trailColor: 'rgba(16, 185, 129, 0.4)',
    cost: 800,
    description: 'Reinforced hull plates with heavy energy emitters.',
    passiveTitle: 'Nanite Shielding',
    passiveDesc: 'Shield regenerates 1% health every 1.5 seconds.'
  },
  {
    id: 'gold',
    name: 'Sol Sovereign',
    color: '#f59e0b',
    trailColor: 'rgba(245, 158, 11, 0.4)',
    cost: 1600,
    description: 'Prototype flagship reserved for high-ranking elite pilots.',
    passiveTitle: 'Quantum Harvester',
    passiveDesc: 'Item magnet range +100px & double scrap rewards.'
  }
];
