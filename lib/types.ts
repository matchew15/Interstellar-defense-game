export interface GameState {
  wave: number
  enemies: Enemy[]
  planetHealth: number
  resources: number
  maxResources: number
  resourceRegenRate: number
  techTree: TechTree
  asteroids: Asteroid[]
  turrets: Turret[]
  shieldActive: boolean
  shieldDuration: number
  score: number
  powerUps: PowerUp[]
  explosions: Explosion[]
  difficulty: "easy" | "normal" | "hard"
  gameOver: boolean
  paused: boolean
  laserWeapon: LaserWeapon
  gameSpeed: number
  showLaserUpgradeUI: boolean
  scanner: Scanner
}

export interface Scanner {
  active: boolean
  cooldown: number
  lastUsed: number
  range: number
  energyCost: number
  scannedEnemies: string[]
  level: number
}

export interface LaserWeapon {
  damage: number
  cooldown: number
  lastFired: number
  isAiming: boolean
  aimTarget: Vector3 | null
  level: number
  energyCost: number
  range: number
  beamWidth: number
  accuracy: number
  upgrades: LaserUpgrades
}

export interface LaserUpgrades {
  damage: number
  cooldown: number
  energyEfficiency: number
  range: number
  beamWidth: number
}

export interface Enemy {
  id: string
  type: "scout" | "fighter" | "cruiser" | "bomber" | "dreadnought"
  health: number
  maxHealth: number
  position: Vector3
  velocity?: Vector3
  behavior: "direct" | "evasive" | "flanking" | "swarming" | "kamikaze"
  lastAttackTime?: number
  attackCooldown?: number
  laserResistance?: number
  scanned?: boolean
  scanProgress?: number
}

export interface Asteroid {
  id: number
  position: Vector3
  resources: number
  size: number
}

export interface Turret {
  id: string
  position: Vector3
  range: number
  damage: number
  fireRate: number
  lastFired?: number
}

export interface TechTree {
  turretDamage: number
  shieldStrength: number
  resourceGathering: number
  laserPower: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface PowerUp {
  id: string
  type: "health" | "resources" | "shield" | "damage"
  position: Vector3
  duration: number
  value: number
}

export interface Explosion {
  id: string
  position: Vector3
  scale: number
  duration: number
  color: string
  createdAt: number
}
