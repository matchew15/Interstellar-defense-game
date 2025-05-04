"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { useGameState } from "@/hooks/use-game-state"
import { useGameEngine } from "@/hooks/use-game-engine"
import Planet from "@/components/game-entities/planet"
import EnemyShip from "@/components/game-entities/enemy-ship"
import DefenseTurret from "@/components/game-entities/defense-turret"
import AsteroidField from "@/components/game-entities/asteroid-field"
import PowerUp from "@/components/game-entities/power-up"
import Explosion from "@/components/game-entities/explosion"
import LaserWeapon from "@/components/game-entities/laser-weapon"
import EnemyScanner from "@/components/game-entities/enemy-scanner"
import GameControls from "@/components/game-controls"
import StartScreen from "@/components/start-screen"
import PauseScreen from "@/components/pause-screen"
import GameOverScreen from "@/components/game-over-screen"
import TouchControlsProvider from "@/components/touch-controls-provider"
import ScannerResultsUI from "@/components/scanner-results-ui"
import { useEffect } from "react"
import type { Vector3 } from "@/lib/types"
import LaserUpgradeUI from "@/components/laser-upgrade-ui"

export default function InterstellarDefenseGame() {
  const {
    gameState,
    startGame,
    fireAtEnemy,
    repairSystem,
    upgradeTech,
    mineAsteroid,
    placeTurret,
    activateShield,
    togglePause,
    resetGame,
    setDifficulty,
    toggleLaserAim,
    fireLaser,
    upgradeLaser,
    upgradeLaserProperty,
    toggleLaserUpgradeUI,
    setGameSpeed,
    toggleScanner,
    updateEnemyScanProgress,
    completeEnemyScan,
    upgradeScanner,
    toggleScannerResults,
    showScannerResults,
  } = useGameState()

  const { predictedPaths, optimalTargets } = useGameEngine(gameState)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState<Vector3 | null>(null)

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p") {
        togglePause()
      } else if (e.key === "l") {
        toggleLaserAim()
      } else if (e.key === "s") {
        toggleScanner()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePause, toggleLaserAim, toggleScanner])

  // Handle mouse click for laser targeting
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (gameState.laserWeapon.isAiming && mousePosition) {
      fireLaser(mousePosition)
    }
  }

  // Special ability placeholder
  const useSpecialAbility = () => {
    // Add implementation for special ability
    console.log("Special ability used")
  }

  // Determine if the game has started (wave > 0)
  const gameStarted = gameState.wave > 0

  return (
    <div className="w-full h-screen flex" ref={containerRef}>
      {/* Game Canvas */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }} onClick={handleCanvasClick}>
          {/* Environment */}
          <color attach="background" args={["#000010"]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Game Entities */}
          <Planet
            position={[0, 0, 0]}
            health={gameState.planetHealth}
            shieldActive={gameState.shieldActive}
            shieldStrength={gameState.techTree.shieldStrength}
          />

          {gameState.enemies.map((enemy) => (
            <EnemyShip
              key={enemy.id}
              enemy={enemy}
              predictedPath={predictedPaths[enemy.id]}
              isOptimalTarget={optimalTargets.includes(enemy.id)}
            />
          ))}

          {gameState.turrets.map((turret) => (
            <DefenseTurret
              key={turret.id}
              turret={turret}
              damageLevel={gameState.techTree.turretDamage}
              enemies={gameState.enemies}
            />
          ))}

          <AsteroidField asteroids={gameState.asteroids} onMineAsteroid={mineAsteroid} />

          {gameState.powerUps.map((powerUp) => (
            <PowerUp key={powerUp.id} powerUp={powerUp} />
          ))}

          {gameState.explosions.map((explosion) => (
            <Explosion key={explosion.id} explosion={explosion} />
          ))}

          {/* Laser Weapon */}
          <LaserWeapon
            laserWeapon={gameState.laserWeapon}
            onLaserHit={(enemyId) => fireAtEnemy(enemyId)}
            enemies={gameState.enemies}
          />

          {/* Enemy Scanner */}
          <EnemyScanner
            scanner={gameState.scanner}
            enemies={gameState.enemies}
            onScanProgress={updateEnemyScanProgress}
            onScanComplete={completeEnemyScan}
          />

          {/* Touch Controls Provider - moved inside Canvas */}
          <TouchControlsProvider domElement={containerRef} />

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={20}
            target={[0, 0, 0]}
            enabled={!gameState.laserWeapon.isAiming}
          />

          {/* Raycaster for laser targeting */}
          {gameState.laserWeapon.isAiming && (
            <group
              onPointerMove={(e) => {
                e.stopPropagation()
                setMousePosition(e.point)
              }}
            >
              <mesh visible={false} position={[0, 0, 0]} scale={100}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>
          )}
        </Canvas>

        {/* Laser Upgrade UI */}
        {gameState.showLaserUpgradeUI && (
          <LaserUpgradeUI
            laserWeapon={gameState.laserWeapon}
            resources={gameState.resources}
            onUpgradeLaser={upgradeLaserProperty}
            onClose={toggleLaserUpgradeUI}
          />
        )}

        {/* Scanner Results UI */}
        {showScannerResults && (
          <ScannerResultsUI scanner={gameState.scanner} enemies={gameState.enemies} onClose={toggleScannerResults} />
        )}

        {/* Game HUD - Only show when game has started */}
        {gameStarted && (
          <div className="absolute top-0 left-0 right-0 bg-blue-900/80 p-2 md:p-4 text-white flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <div className="text-lg md:text-xl font-bold mr-4">IDS</div>
              <div className="text-sm md:text-base">
                Score: <span className="text-yellow-300">{gameState.score.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-sm">
                Wave: <span className="text-blue-300">{gameState.wave}</span>
              </div>
              <div className="text-sm">
                Health:{" "}
                <span className={`${gameState.planetHealth > 50 ? "text-green-300" : "text-red-300"}`}>
                  {gameState.planetHealth}%
                </span>
              </div>
              <div className="text-sm">
                Resources: <span className="text-yellow-300">{Math.floor(gameState.resources)}</span>
              </div>
              <button onClick={togglePause} className="text-sm bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded">
                {gameState.paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        )}

        {/* Laser Targeting Mode Indicator */}
        {gameState.laserWeapon.isAiming && (
          <div className="absolute top-16 left-0 right-0 text-center">
            <div className="inline-block bg-red-900/80 text-white px-4 py-1 rounded-full text-sm">
              LASER TARGETING MODE - Click to Fire
            </div>
          </div>
        )}

        {/* Scanner Active Indicator */}
        {gameState.scanner.active && (
          <div className="absolute top-16 left-0 right-0 text-center">
            <div className="inline-block bg-cyan-900/80 text-white px-4 py-1 rounded-full text-sm">
              SCANNER ACTIVE - Analyzing Enemy Defenses
            </div>
          </div>
        )}

        {/* Game Screens */}
        {!gameStarted && !gameState.gameOver && (
          <StartScreen onStart={startGame} difficulty={gameState.difficulty} onSetDifficulty={setDifficulty} />
        )}

        {gameState.paused && !gameState.showLaserUpgradeUI && !showScannerResults && (
          <PauseScreen onResume={togglePause} />
        )}

        {gameState.gameOver && <GameOverScreen score={gameState.score} wave={gameState.wave} onRestart={resetGame} />}
      </div>

      {/* Game Controls Panel */}
      <GameControls
        gameState={gameState}
        onStartGame={startGame}
        onFireAtEnemy={fireAtEnemy}
        onRepairSystem={repairSystem}
        onUpgradeTech={upgradeTech}
        onMineAsteroid={mineAsteroid}
        onPlaceTurret={placeTurret}
        onActivateShield={activateShield}
        onUseSpecialAbility={useSpecialAbility}
        onToggleLaserAim={toggleLaserAim}
        onFireLaser={fireLaser}
        onUpgradeLaser={upgradeLaser}
        onToggleLaserUpgradeUI={toggleLaserUpgradeUI}
        onSetGameSpeed={setGameSpeed}
        optimalTargets={optimalTargets}
        onToggleScanner={toggleScanner}
        onUpgradeScanner={upgradeScanner}
        onViewScannerResults={toggleScannerResults}
        scannerCooldownRemaining={Math.max(0, gameState.scanner.cooldown - (Date.now() - gameState.scanner.lastUsed))}
      />
    </div>
  )
}
