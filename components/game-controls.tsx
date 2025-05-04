"use client"

import type { GameState, Vector3 } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Zap,
  Wrench,
  Target,
  Rocket,
  Cpu,
  Sparkles,
  Crosshair,
  ZapOff,
  Settings,
  Scan,
  Database,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"

interface GameControlsProps {
  gameState: GameState
  onStartGame: () => void
  onFireAtEnemy: (enemyId: string) => void
  onRepairSystem: () => void
  onUpgradeTech: (tech: string) => void
  onMineAsteroid: (asteroidId: number) => void
  onPlaceTurret: (position: { x: number; y: number; z: number }) => void
  onActivateShield: () => void
  onUseSpecialAbility: () => void
  onToggleLaserAim: () => void
  onFireLaser: (target: Vector3) => void
  onUpgradeLaser: () => void
  onToggleLaserUpgradeUI: () => void
  onSetGameSpeed: (speed: number) => void
  optimalTargets: string[]
  onToggleScanner: () => void
  onUpgradeScanner: () => void
  onViewScannerResults: () => void
  scannerCooldownRemaining: number
}

export default function GameControls({
  gameState,
  onStartGame,
  onFireAtEnemy,
  onRepairSystem,
  onUpgradeTech,
  onMineAsteroid,
  onPlaceTurret,
  onActivateShield,
  onUseSpecialAbility,
  onToggleLaserAim,
  onFireLaser,
  onUpgradeLaser,
  onToggleLaserUpgradeUI,
  onSetGameSpeed,
  optimalTargets,
  onToggleScanner,
  onUpgradeScanner,
  onViewScannerResults,
  scannerCooldownRemaining,
}: GameControlsProps) {
  const [activeTab, setActiveTab] = useState<"actions" | "upgrades" | "resources" | "settings">("actions")
  const [controlsVisible, setControlsVisible] = useState(true)
  const isMobile = useMobile()
  const [scannerCooldown, setScannerCooldown] = useState(0)

  // Extract needed properties from gameState
  const { enemies, planetHealth, resources, asteroids, techTree, laserWeapon, gameSpeed, paused, gameOver, scanner } = gameState

  // Update scanner cooldown
  useEffect(() => {
    if (scannerCooldownRemaining > 0) {
      const interval = setInterval(() => {
        setScannerCooldown(Math.max(0, scannerCooldownRemaining - 100))
      }, 100)
      return () => clearInterval(interval)
    } else {
      setScannerCooldown(0)
    }
  }, [scannerCooldownRemaining])

  // Determine game status
  const gameStatus = gameOver ? "gameOver" : paused ? "paused" : "playing"
  const gameStarted = gameState.wave > 0

  // Define costs
  const fireCost = 10
  const repairCost = 20
  const upgradeCost = 50
  const shieldCost = 30
  const turretCost = 40
  const laserCost = laserWeapon.energyCost
  const laserUpgradeCost = 60
  const scannerCost = scanner.energyCost
  const scannerUpgradeCost = 50

  // Format cooldown time
  const formatCooldown = (ms: number) => {
    if (ms <= 0) return "Ready"
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (isMobile && !controlsVisible) {
    return (
      <Button
        className="absolute bottom-4 right-4 z-30 rounded-full w-12 h-12 bg-blue-700/80 hover:bg-blue-600"
        onClick={() => setControlsVisible(true)}
      >
        <Rocket className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className="w-full md:w-72 bg-gray-800/90 p-2 md:p-4 space-y-2 md:space-y-6 overflow-y-auto absolute bottom-0 left-0 right-0 md:relative z-20 max-h-[40vh] md:max-h-full">
      {isMobile && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => setControlsVisible(false)}
          >
            ✕
          </Button>
        </div>
      )}

      {!gameStarted && gameStatus !== "gameOver" && (
        <div className="space-y-2 md:space-y-4">
          <h2 className="text-base md:text-lg font-bold text-center">INTERSTELLAR DEFENSE</h2>
          <p className="text-xs md:text-sm text-gray-300 hidden md:block">
            Protect your planet from waves of enemy ships. Use resources wisely.
          </p>
          <Button onClick={onStartGame} className="w-full bg-blue-700 hover:bg-blue-600 text-sm py-1 h-auto">
            <Rocket className="mr-1 h-3 w-3 md:h-4 md:w-4" />
            Launch Defense
          </Button>
        </div>
      )}

      {gameStarted && (
        <>
          <div className="flex justify-between border-b border-gray-700 pb-1">
            <Button
              variant={activeTab === "actions" ? "default" : "ghost"}
              onClick={() => setActiveTab("actions")}
              className="text-xs h-7 px-2"
            >
              Actions
            </Button>
            <Button
              variant={activeTab === "upgrades" ? "default" : "ghost"}
              onClick={() => setActiveTab("upgrades")}
              className="text-xs h-7 px-2"
            >
              Upgrades
            </Button>
            <Button
              variant={activeTab === "resources" ? "default" : "ghost"}
              onClick={() => setActiveTab("resources")}
              className="text-xs h-7 px-2"
            >
              Resources
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className="text-xs h-7 px-2"
            >
              Settings
            </Button>
          </div>

          {activeTab === "actions" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => optimalTargets.length > 0 && onFireAtEnemy(optimalTargets[0])}
                  className="bg-red-700 hover:bg-red-600 text-xs py-1 h-auto"
                  disabled={resources < fireCost || enemies.length === 0 || gameStatus !== "playing"}
                >
                  <Target className="mr-1 h-3 w-3" />
                  Fire ({fireCost})
                </Button>
                <Button
                  onClick={onActivateShield}
                  className="bg-blue-700 hover:bg-blue-600 text-xs py-1 h-auto"
                  disabled={resources < shieldCost || gameStatus !== "playing"}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  Shield ({shieldCost})
                </Button>
                <Button
                  onClick={onRepairSystem}
                  className="bg-green-700 hover:bg-green-600 text-xs py-1 h-auto"
                  disabled={resources < repairCost || planetHealth >= 100 || gameStatus !== "playing"}
                >
                  <Wrench className="mr-1 h-3 w-3" />
                  Repair ({repairCost})
                </Button>
                <Button
                  onClick={() => onPlaceTurret({ x: Math.random() * 6 - 3, y: 0, z: Math.random() * 6 - 3 })}
                  className="bg-purple-700 hover:bg-purple-600 text-xs py-1 h-auto"
                  disabled={resources < turretCost || gameStatus !== "playing"}
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Turret ({turretCost})
                </Button>
              </div>

              {/* Laser Controls */}
              <div className="bg-gray-700/50 p-2 rounded border border-red-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-red-300">Space Laser Mk.{laserWeapon.level}</span>
                  <span className="text-xs text-red-300">Power: {techTree.laserPower}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={onToggleLaserAim}
                    className={`${
                      laserWeapon.isAiming ? "bg-red-900" : "bg-red-700"
                    } hover:bg-red-600 text-xs py-1 h-auto`}
                    disabled={gameStatus !== "playing"}
                  >
                    {laserWeapon.isAiming ? (
                      <>
                        <ZapOff className="mr-1 h-3 w-3" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Crosshair className="mr-1 h-3 w-3" />
                        Aim
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onUpgradeLaser}
                    className="bg-pink-700 hover:bg-pink-600 text-xs py-1 h-auto"
                    disabled={resources < laserUpgradeCost || gameStatus !== "playing"}
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Quick Upgrade
                  </Button>
                  <Button
                    onClick={onToggleLaserUpgradeUI}
                    className="bg-purple-700 hover:bg-purple-600 text-xs py-1 h-auto"
                    disabled={gameStatus !== "playing"}
                  >
                    <Settings className="mr-1 h-3 w-3" />
                    Advanced
                  </Button>
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  {laserWeapon.isAiming
                    ? "Click on an enemy to fire the laser beam"
                    : `Damage: ${laserWeapon.damage.toFixed(0)} | Cost: ${laserCost}`}
                </div>
              </div>

              {/* Scanner Controls */}
              <div className="bg-gray-700/50 p-2 rounded border border-cyan-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-cyan-300">Scanner Mk.{scanner.level}</span>
                  <span className="text-xs text-cyan-300">
                    {scanner.active ? "Active" : formatCooldown(scannerCooldownRemaining)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={onToggleScanner}
                    className={`${
                      scanner.active ? "bg-cyan-900" : "bg-cyan-700"
                    } hover:bg-cyan-600 text-xs py-1 h-auto`}
                    disabled={
                      (scanner.active ? false : resources < scannerCost || scannerCooldownRemaining > 0) ||
                      gameStatus !== "playing"
                    }
                  >
                    {scanner.active ? (
                      <>
                        <ZapOff className="mr-1 h-3 w-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Scan className="mr-1 h-3 w-3" />
                        Scan
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onUpgradeScanner}
                    className="bg-cyan-700 hover:bg-cyan-600 text-xs py-1 h-auto"
                    disabled={resources < scannerUpgradeCost || gameStatus !== "playing"}
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Upgrade
                  </Button>
                  <Button
                    onClick={onViewScannerResults}
                    className="bg-cyan-700 hover:bg-cyan-600 text-xs py-1 h-auto"
                    disabled={scanner.scannedEnemies.length === 0 || gameStatus !== "playing"}
                  >
                    <Database className="mr-1 h-3 w-3" />
                    Results
                  </Button>
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  {scanner.active
                    ? "Scanning enemies in range..."
                    : `Range: ${scanner.range.toFixed(1)}m | Cost: ${scannerCost}`}
                </div>
              </div>

              <Button
                onClick={onUseSpecialAbility}
                className="w-full bg-pink-700 hover:bg-pink-600 text-xs py-1 h-auto"
                disabled={gameStatus !== "playing"}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Special Attack
              </Button>

              {optimalTargets.length > 0 && (
                <div className="p-2 bg-gray-900 rounded border border-blue-800">
                  <div className="flex items-center">
                    <Cpu className="h-3 w-3 text-blue-400 mr-1" />
                    <span className="text-[10px] text-blue-400">Defense AI</span>
                  </div>
                  <p className="text-[10px]">Target: Enemy #{optimalTargets[0].split("-")[1]}</p>
                \
