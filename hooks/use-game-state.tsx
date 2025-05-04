"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { GameState, Enemy, Asteroid, Vector3 } from "@/lib/types"

// Define the LaserUpgrades type
interface LaserUpgrades {
  damage: number
  cooldown: number
  energyEfficiency: number
  range: number
  beamWidth: number
}

// Initial game state
const initialGameState: GameState = {
  wave: 0,
  enemies: [],
  planetHealth: 100,
  resources: 100,
  maxResources: 200,
  resourceRegenRate: 0.5,
  techTree: {
    turretDamage: 1,
    shieldStrength: 1,
    resourceGathering: 1,
    laserPower: 1,
  },
  asteroids: [],
  turrets: [],
  shieldActive: false,
  shieldDuration: 0,
  score: 0,
  powerUps: [],
  explosions: [],
  difficulty: "normal",
  gameOver: false,
  paused: false,
  laserWeapon: {
    damage: 50,
    cooldown: 1000,
    lastFired: 0,
    isAiming: false,
    aimTarget: null,
    level: 1,
    energyCost: 20,
    range: 15,
    beamWidth: 0.1,
    accuracy: 0.9,
    upgrades: {
      damage: 1,
      cooldown: 1,
      energyEfficiency: 1,
      range: 1,
      beamWidth: 1,
    },
  },
  gameSpeed: 1.0,
  showLaserUpgradeUI: false,
  scanner: {
    active: false,
    cooldown: 5000,
    lastUsed: 0,
    range: 10,
    energyCost: 15,
    scannedEnemies: [],
    level: 1,
  },
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimeRef = useRef(Date.now())
  const isGameRunningRef = useRef(false)
  const gameSpeedRef = useRef(1.0)

  // Update the gameSpeedRef when gameState.gameSpeed changes
  useEffect(() => {
    gameSpeedRef.current = gameState.gameSpeed
  }, [gameState.gameSpeed])

  // Set difficulty
  const setDifficulty = useCallback((difficulty: "easy" | "normal" | "hard") => {
    setGameState((prev) => ({
      ...prev,
      difficulty,
    }))
  }, [])

  // Initialize asteroids - only run once
  useEffect(() => {
    const newAsteroids: Asteroid[] = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const distance = 5 + Math.random() * 3
      newAsteroids.push({
        id: i + 1,
        position: {
          x: Math.cos(angle) * distance,
          y: Math.random() * 2 - 1,
          z: Math.sin(angle) * distance,
        },
        resources: 50 + Math.floor(Math.random() * 50),
        size: 0.5 + Math.random() * 0.5,
      })
    }

    setGameState((prev) => ({
      ...prev,
      asteroids: newAsteroids,
    }))
  }, []) // Empty dependency array ensures this runs only once

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      paused: !prev.paused,
    }))
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    // Stop the game loop
    isGameRunningRef.current = false

    // Clear the interval
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
      gameIntervalRef.current = null
    }

    setGameState((prev) => ({
      ...initialGameState,
      difficulty: prev.difficulty,
      asteroids: prev.asteroids,
    }))
  }, [])

  // Game loop function - separated from startGame to avoid re-creation
  const runGameLoop = useCallback(() => {
    const now = Date.now()
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000 // Convert to seconds
    lastUpdateTimeRef.current = now

    // Apply game speed to deltaTime
    const adjustedDeltaTime = deltaTime * gameSpeedRef.current

    setGameState((prev) => {
      // Skip update if game is paused or over
      if (prev.paused || prev.gameOver) return prev

      // Update game state
      const newState = { ...prev }

      // Apply difficulty modifiers
      const difficultyModifier = prev.difficulty === "easy" ? 0.7 : prev.difficulty === "hard" ? 1.3 : 1

      // Regenerate resources
      newState.resources = Math.min(
        newState.maxResources,
        newState.resources + newState.resourceRegenRate * newState.techTree.resourceGathering * adjustedDeltaTime * 10,
      )

      // Update shield duration
      if (newState.shieldActive) {
        newState.shieldDuration -= adjustedDeltaTime * 10
        if (newState.shieldDuration <= 0) {
          newState.shieldActive = false
        }
      }

      // Update explosions
      newState.explosions = newState.explosions.filter((explosion) => {
        return now - explosion.createdAt < explosion.duration * 1000
      })

      // Update power-ups and check for collection
      newState.powerUps = newState.powerUps.filter((powerUp) => {
        // Check if power-up is collected (close to planet)
        const distanceToCenter = Math.sqrt(
          powerUp.position.x * powerUp.position.x +
            powerUp.position.y * powerUp.position.y +
            powerUp.position.z * powerUp.position.z,
        )

        if (distanceToCenter < 2) {
          // Apply power-up effect
          switch (powerUp.type) {
            case "health":
              newState.planetHealth = Math.min(100, newState.planetHealth + powerUp.value)
              break
            case "resources":
              newState.resources = Math.min(newState.maxResources, newState.resources + powerUp.value)
              break
            case "shield":
              newState.shieldActive = true
              newState.shieldDuration = Math.max(newState.shieldDuration, powerUp.value)
              break
            case "damage":
              // Temporary damage boost to all turrets
              newState.turrets = newState.turrets.map((turret) => ({
                ...turret,
                damage: turret.damage * 1.5,
                fireRate: turret.fireRate * 1.5,
              }))
              break
          }

          // Add explosion for power-up collection
          newState.explosions.push({
            id: `explosion-powerup-${Date.now()}`,
            position: powerUp.position,
            scale: 0.5,
            duration: 0.5,
            color:
              powerUp.type === "health"
                ? "#00ff00"
                : powerUp.type === "resources"
                  ? "#ffff00"
                  : powerUp.type === "shield"
                    ? "#4080ff"
                    : "#ff00ff",
            createdAt: now,
          })

          // Remove the power-up
          return false
        }

        // Move power-up toward planet
        const direction = {
          x: 0 - powerUp.position.x,
          y: 0 - powerUp.position.y,
          z: 0 - powerUp.position.z,
        }

        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)

        if (length > 0) {
          direction.x /= length
          direction.y /= length
          direction.z /= length
        }

        // Update position - apply game speed
        powerUp.position.x += direction.x * 0.03 * gameSpeedRef.current
        powerUp.position.y += direction.y * 0.03 * gameSpeedRef.current
        powerUp.position.z += direction.z * 0.03 * gameSpeedRef.current

        return true
      })

      // Move enemies and handle attacks
      newState.enemies = newState.enemies
        .map((enemy) => {
          const newPosition = { ...enemy.position }
          const direction = {
            x: 0 - newPosition.x,
            y: 0 - newPosition.y,
            z: 0 - newPosition.z,
          }

          // Normalize direction
          const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)

          if (length > 0) {
            direction.x /= length
            direction.y /= length
            direction.z /= length
          }

          // Apply behavior modifications
          if (enemy.behavior === "evasive") {
            // Zigzag pattern
            direction.x += Math.sin(Date.now() / 1000 + Number.parseInt(enemy.id)) * 0.3
            direction.z += Math.cos(Date.now() / 1000 + Number.parseInt(enemy.id)) * 0.3
          } else if (enemy.behavior === "flanking") {
            // Circle around
            const perpX = -direction.z
            const perpZ = direction.x
            direction.x += perpX * 0.5
            direction.z += perpZ * 0.5
          } else if (enemy.behavior === "swarming") {
            // Group behavior - move toward other enemies
            const nearbyEnemies = newState.enemies.filter(
              (e) =>
                e.id !== enemy.id &&
                Math.sqrt(
                  Math.pow(e.position.x - enemy.position.x, 2) +
                    Math.pow(e.position.y - enemy.position.y, 2) +
                    Math.pow(e.position.z - enemy.position.z, 2),
                ) < 3,
            )

            if (nearbyEnemies.length > 0) {
              // Calculate average position of nearby enemies
              const avgPos = nearbyEnemies.reduce(
                (acc, e) => ({
                  x: acc.x + e.position.x,
                  y: acc.y + e.position.y,
                  z: acc.z + e.position.z,
                }),
                { x: 0, y: 0, z: 0 },
              )

              avgPos.x /= nearbyEnemies.length
              avgPos.y /= nearbyEnemies.length
              avgPos.z /= nearbyEnemies.length

              // Adjust direction slightly toward group
              direction.x = direction.x * 0.8 + (avgPos.x - enemy.position.x) * 0.2
              direction.y = direction.y * 0.8 + (avgPos.y - enemy.position.y) * 0.2
              direction.z = direction.z * 0.8 + (avgPos.z - enemy.position.z) * 0.2
            }
          } else if (enemy.behavior === "kamikaze") {
            // Accelerate toward planet
            direction.x *= 1.5
            direction.y *= 1.5
            direction.z *= 1.5
          }

          // Normalize again
          const newLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)

          if (newLength > 0) {
            direction.x /= newLength
            direction.y /= newLength
            direction.z /= newLength
          }

          // Calculate speed based on enemy type and difficulty
          let speed = 0.05 * difficultyModifier
          if (enemy.type === "scout") speed = 0.08 * difficultyModifier
          else if (enemy.type === "cruiser") speed = 0.03 * difficultyModifier
          else if (enemy.type === "bomber") speed = 0.04 * difficultyModifier
          else if (enemy.type === "dreadnought") speed = 0.02 * difficultyModifier

          // Apply delta time to make movement frame-rate independent
          // Apply game speed to movement
          speed *= adjustedDeltaTime * 10

          // Update position
          newPosition.x += direction.x * speed
          newPosition.y += direction.y * speed
          newPosition.z += direction.z * speed

          // Check if enemy reached the planet
          const distanceToCenter = Math.sqrt(
            newPosition.x * newPosition.x + newPosition.y * newPosition.y + newPosition.z * newPosition.z,
          )

          if (distanceToCenter < 1.2) {
            // Enemy hit the planet
            if (newState.shieldActive) {
              // Shield absorbs some damage
              const damage =
                (enemy.type === "dreadnought"
                  ? 20
                  : enemy.type === "cruiser"
                    ? 15
                    : enemy.type === "bomber"
                      ? 12
                      : enemy.type === "fighter"
                        ? 10
                        : 5) / newState.techTree.shieldStrength

              newState.planetHealth -= damage
            } else {
              // Full damage to planet
              const damage =
                enemy.type === "dreadnought"
                  ? 25
                  : enemy.type === "cruiser"
                    ? 15
                    : enemy.type === "bomber"
                      ? 18
                      : enemy.type === "fighter"
                        ? 10
                        : 5

              newState.planetHealth -= damage
            }

            // Add explosion
            newState.explosions.push({
              id: `explosion-impact-${Date.now()}`,
              position: newPosition,
              scale:
                enemy.type === "dreadnought"
                  ? 1.5
                  : enemy.type === "cruiser"
                    ? 1.2
                    : enemy.type === "bomber"
                      ? 1.0
                      : enemy.type === "fighter"
                        ? 0.8
                        : 0.6,
              duration: 1.0,
              color: "#ff4400",
              createdAt: now,
            })

            // Remove enemy
            return null
          }

          // Handle ranged attacks for certain enemy types
          if (
            (enemy.type === "bomber" || enemy.type === "dreadnought") &&
            (!enemy.lastAttackTime ||
              now - enemy.lastAttackTime > (enemy.attackCooldown || 3000) / gameSpeedRef.current)
          ) {
            // Check if in attack range
            if (distanceToCenter < 8) {
              // Attack the planet
              const attackDamage = enemy.type === "dreadnought" ? 10 : 5

              if (newState.shieldActive) {
                newState.planetHealth -= attackDamage / newState.techTree.shieldStrength
              } else {
                newState.planetHealth -= attackDamage
              }

              // Add explosion for attack
              newState.explosions.push({
                id: `explosion-attack-${Date.now()}`,
                position: {
                  x: newPosition.x * 0.5,
                  y: newPosition.y * 0.5,
                  z: newPosition.z * 0.5,
                },
                scale: enemy.type === "dreadnought" ? 1.0 : 0.7,
                duration: 0.8,
                color: "#ff0000",
                createdAt: now,
              })

              // Set attack cooldown
              return {
                ...enemy,
                position: newPosition,
                velocity: direction,
                lastAttackTime: now,
                attackCooldown: enemy.type === "dreadnought" ? 5000 : 3000,
              }
            }
          }

          return {
            ...enemy,
            position: newPosition,
            velocity: direction,
          }
        })
        .filter(Boolean) as Enemy[]

      // Check if all enemies are defeated
      if (newState.enemies.length === 0 && newState.wave > 0) {
        // Spawn next wave
        newState.wave += 1

        // Award bonus resources and score for completing wave
        newState.resources = Math.min(newState.maxResources, newState.resources + 50 + newState.wave * 10)
        newState.score += newState.wave * 100

        // Spawn power-up with 30% chance
        if (Math.random() < 0.3) {
          const powerUpTypes: ("health" | "resources" | "shield" | "damage")[] = [
            "health",
            "resources",
            "shield",
            "damage",
          ]

          const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
          const angle = Math.random() * Math.PI * 2
          const distance = 10

          newState.powerUps.push({
            id: `powerup-${Date.now()}`,
            type: randomType,
            position: {
              x: Math.cos(angle) * distance,
              y: (Math.random() - 0.5) * 4,
              z: Math.sin(angle) * distance,
            },
            duration: 10,
            value: randomType === "health" ? 25 : randomType === "resources" ? 50 : randomType === "shield" ? 15 : 10,
          })
        }

        // Generate new enemies
        const enemyCount = Math.min(30, Math.floor(newState.wave * 1.5 * difficultyModifier))
        const newEnemies: Enemy[] = []

        for (let i = 0; i < enemyCount; i++) {
          // Random spawn position on a sphere around the planet
          const phi = Math.random() * Math.PI * 2
          const theta = Math.random() * Math.PI
          const distance = 15

          // Determine enemy type based on wave and difficulty
          let type: "scout" | "fighter" | "cruiser" | "bomber" | "dreadnought" = "scout"
          const typeRoll = Math.random

          if (newState.wave >= 10) {
            if (typeRoll < 0.1 * difficultyModifier) type = "dreadnought"
            else if (typeRoll < 0.3 * difficultyModifier) type = "cruiser"
            else if (typeRoll < 0.5 * difficultyModifier) type = "bomber"
            else if (typeRoll < 0.8 * difficultyModifier) type = "fighter"
          } else if (newState.wave >= 7) {
            if (typeRoll < 0.2 * difficultyModifier) type = "cruiser"
            else if (typeRoll < 0.4 * difficultyModifier) type = "bomber"
            else if (typeRoll < 0.7 * difficultyModifier) type = "fighter"
          } else if (newState.wave >= 4) {
            if (typeRoll < 0.1 * difficultyModifier) type = "cruiser"
            else if (typeRoll < 0.3 * difficultyModifier) type = "bomber"
            else if (typeRoll < 0.6 * difficultyModifier) type = "fighter"
          } else if (newState.wave >= 2) {
            if (typeRoll < 0.4 * difficultyModifier) type = "fighter"
          }

          // Determine health based on type
          const health =
            type === "dreadnought"
              ? 200
              : type === "cruiser"
                ? 100
                : type === "bomber"
                  ? 80
                  : type === "fighter"
                    ? 60
                    : 30

          // Determine behavior
          let behavior: "direct" | "evasive" | "flanking" | "swarming" | "kamikaze" = "direct"
          const behaviorRoll = Math.random()

          if (behaviorRoll < 0.2) behavior = "evasive"
          else if (behaviorRoll < 0.4) behavior = "flanking"
          else if (behaviorRoll < 0.6 && newState.wave > 3) behavior = "swarming"
          else if (behaviorRoll < 0.7 && newState.wave > 5) behavior = "kamikaze"

          // Determine laser resistance based on type and wave
          let laserResistance = 0

          // Base resistance by type
          if (type === "dreadnought") laserResistance = 0.5
          else if (type === "cruiser") laserResistance = 0.3
          else if (type === "bomber") laserResistance = 0.2

          // Add wave-based resistance increase
          if (newState.wave >= 5) {
            laserResistance += 0.1
          }
          if (newState.wave >= 10) {
            laserResistance += 0.2
          }

          // Add some randomness (±10%)
          laserResistance += Math.random() * 0.2 - 0.1

          // Clamp between 0 and 0.9
          laserResistance = Math.max(0, Math.min(0.9, laserResistance))

          // Special case: some scouts in later waves get high resistance
          if (type === "scout" && newState.wave > 8 && Math.random() < 0.2) {
            laserResistance = 0.7 // Scout with special shielding
          }

          newEnemies.push({
            id: `enemy-${i}-${Date.now()}`,
            type,
            health,
            maxHealth: health,
            position: {
              x: Math.sin(theta) * Math.cos(phi) * distance,
              y: Math.cos(theta) * distance * 0.5, // Flatten the spawn sphere
              z: Math.sin(theta) * Math.sin(phi) * distance,
            },
            behavior,
            laserResistance,
          })
        }

        newState.enemies = newEnemies
      }

      // Check game over
      if (newState.planetHealth <= 0) {
        newState.planetHealth = 0
        newState.gameOver = true

        // Add final explosion
        newState.explosions.push({
          id: `explosion-gameover-${Date.now()}`,
          position: { x: 0, y: 0, z: 0 },
          scale: 3,
          duration: 2.0,
          color: "#ff0000",
          createdAt: now,
        })

        // Stop the game loop
        isGameRunningRef.current = false
      }

      return newState
    })
  }, [])

  // Start the game
  const startGame = useCallback(() => {
    // Reset game state but keep difficulty and asteroids
    setGameState((prev) => ({
      ...initialGameState,
      difficulty: prev.difficulty,
      asteroids: prev.asteroids,
      wave: 1,
      gameOver: false,
    }))

    // Reset time tracking
    lastUpdateTimeRef.current = Date.now()

    // Set flag to indicate game is running
    isGameRunningRef.current = true
  }, [])

  // Set up and clean up game loop
  useEffect(() => {
    // Only start the interval if the game is running
    if (isGameRunningRef.current && !gameIntervalRef.current) {
      // Clear any existing interval just to be safe
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }

      // Start a new interval
      gameIntervalRef.current = setInterval(runGameLoop, 16) // ~60 FPS
    }

    // If game is over or not running, clear the interval
    if (!isGameRunningRef.current && gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
      gameIntervalRef.current = null
    }

    // Clean up on unmount
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
        gameIntervalRef.current = null
      }
    }
  }, [runGameLoop, gameState.gameOver, gameState.wave])

  // Fire at enemy
  const fireAtEnemy = useCallback((enemyId: string) => {
    setGameState((prev) => {
      if (prev.resources < 10 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 10

      // Find and damage enemy
      newState.enemies = newState.enemies
        .map((enemy) => {
          if (enemy.id === enemyId) {
            // Apply damage based on tech level
            const damage = 20 * newState.techTree.turretDamage
            const newHealth = enemy.health - damage

            if (newHealth <= 0) {
              // Enemy destroyed, gain resources and score
              const resourceGain =
                enemy.type === "dreadnought"
                  ? 50
                  : enemy.type === "cruiser"
                    ? 30
                    : enemy.type === "bomber"
                      ? 25
                      : enemy.type === "fighter"
                        ? 20
                        : 10

              const scoreGain =
                enemy.type === "dreadnought"
                  ? 200
                  : enemy.type === "cruiser"
                    ? 100
                    : enemy.type === "bomber"
                      ? 80
                      : enemy.type === "fighter"
                        ? 50
                        : 20

              newState.resources += resourceGain
              newState.score += scoreGain

              // Add explosion
              newState.explosions.push({
                id: `explosion-enemy-${Date.now()}`,
                position: enemy.position,
                scale:
                  enemy.type === "dreadnought"
                    ? 1.5
                    : enemy.type === "cruiser"
                      ? 1.2
                      : enemy.type === "bomber"
                        ? 1.0
                        : enemy.type === "fighter"
                          ? 0.8
                          : 0.6,
                duration: 1.0,
                color: "#ff8800",
                createdAt: Date.now(),
              })

              // Chance to drop power-up
              const powerUpChance =
                enemy.type === "dreadnought"
                  ? 0.5
                  : enemy.type === "cruiser"
                    ? 0.3
                    : enemy.type === "bomber"
                      ? 0.2
                      : enemy.type === "fighter"
                        ? 0.1
                        : 0.05

              if (Math.random() < powerUpChance) {
                const powerUpTypes: ("health" | "resources" | "shield" | "damage")[] = [
                  "health",
                  "resources",
                  "shield",
                  "damage",
                ]

                const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]

                newState.powerUps.push({
                  id: `powerup-${Date.now()}`,
                  type: randomType,
                  position: {
                    x: enemy.position.x,
                    y: enemy.position.y,
                    z: enemy.position.z,
                  },
                  duration: 10,
                  value:
                    randomType === "health" ? 15 : randomType === "resources" ? 30 : randomType === "shield" ? 10 : 5,
                })
              }

              return null
            }

            return {
              ...enemy,
              health: newHealth,
            }
          }
          return enemy
        })
        .filter(Boolean) as Enemy[]

      return newState
    })
  }, [])

  // Repair system
  const repairSystem = useCallback(() => {
    setGameState((prev) => {
      if (prev.resources < 20 || prev.planetHealth >= 100 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 20
      newState.planetHealth = Math.min(100, newState.planetHealth + 15)

      // Add repair effect
      newState.explosions.push({
        id: `explosion-repair-${Date.now()}`,
        position: { x: 0, y: 0, z: 0 },
        scale: 1.2,
        duration: 0.8,
        color: "#00ff00",
        createdAt: Date.now(),
      })

      return newState
    })
  }, [])

  // Upgrade tech
  const upgradeTech = useCallback((tech: string) => {
    setGameState((prev) => {
      if (prev.resources < 50 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 50

      if (tech in newState.techTree) {
        newState.techTree = {
          ...newState.techTree,
          [tech]: newState.techTree[tech as keyof typeof newState.techTree] + 1,
        }

        // Add upgrade effect
        newState.explosions.push({
          id: `explosion-upgrade-${Date.now()}`,
          position: { x: 0, y: 0, z: 0 },
          scale: 0.8,
          duration: 0.6,
          color: "#ffff00",
          createdAt: Date.now(),
        })

        // Add score for upgrades
        newState.score += 50
      }

      return newState
    })
  }, [])

  // Mine asteroid
  const mineAsteroid = useCallback((asteroidId: number) => {
    setGameState((prev) => {
      if (prev.paused || prev.gameOver) return prev

      const newState = { ...prev }

      // Find asteroid
      const asteroidIndex = newState.asteroids.findIndex((a) => a.id === asteroidId)
      if (asteroidIndex === -1 || newState.asteroids[asteroidIndex].resources <= 0) {
        return prev
      }

      // Mine resources
      const miningEfficiency = newState.techTree.resourceGathering
      const minedAmount = Math.min(10 * miningEfficiency, newState.asteroids[asteroidIndex].resources)

      newState.asteroids[asteroidIndex].resources -= minedAmount
      newState.resources = Math.min(newState.maxResources, newState.resources + minedAmount)

      // Add small score for mining
      newState.score += Math.floor(minedAmount / 2)

      // Add mining effect
      newState.explosions.push({
        id: `explosion-mining-${Date.now()}`,
        position: newState.asteroids[asteroidIndex].position,
        scale: 0.4,
        duration: 0.4,
        color: "#88aaff",
        createdAt: Date.now(),
      })

      return newState
    })
  }, [])

  // Place turret
  const placeTurret = useCallback((position: Vector3) => {
    setGameState((prev) => {
      if (prev.resources < 40 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 40

      // Add new turret
      newState.turrets.push({
        id: `turret-${Date.now()}`,
        position,
        range: 5,
        damage: 10 * newState.techTree.turretDamage,
        fireRate: 1,
      })

      // Add score for building turret
      newState.score += 30

      // Add turret placement effect
      newState.explosions.push({
        id: `explosion-turret-${Date.now()}`,
        position,
        scale: 0.6,
        duration: 0.5,
        color: "#8800ff",
        createdAt: Date.now(),
      })

      return newState
    })
  }, [])

  // Activate shield
  const activateShield = useCallback(() => {
    setGameState((prev) => {
      if (prev.resources < 30 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 30
      newState.shieldActive = true
      newState.shieldDuration = 10 * newState.techTree.shieldStrength

      // Add score for activating shield
      newState.score += 20

      // Add shield activation effect
      newState.explosions.push({
        id: `explosion-shield-${Date.now()}`,
        position: { x: 0, y: 0, z: 0 },
        scale: 1.8,
        duration: 0.7,
        color: "#4080ff",
        createdAt: Date.now(),
      })

      return newState
    })
  }, [])

  // Toggle laser aiming mode
  const toggleLaserAim = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      laserWeapon: {
        ...prev.laserWeapon,
        isAiming: !prev.laserWeapon.isAiming,
      },
    }))
  }, [])

  // Fire laser at target
  const fireLaser = useCallback((targetPosition: Vector3) => {
    setGameState((prev) => {
      if (
        prev.resources < prev.laserWeapon.energyCost ||
        Date.now() - prev.laserWeapon.lastFired < prev.laserWeapon.cooldown ||
        prev.paused ||
        prev.gameOver
      ) {
        return prev
      }

      const newState = { ...prev }
      newState.resources -= newState.laserWeapon.energyCost

      // Set laser properties
      newState.laserWeapon = {
        ...newState.laserWeapon,
        lastFired: Date.now(),
        aimTarget: targetPosition,
      }

      // Create a ray from planet to target
      const direction = {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
      }

      // Normalize direction
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)

      if (length > 0) {
        direction.x /= length
        direction.y /= length
        direction.z /= length
      }

      // Check for enemies in the path
      const hitEnemies: string[] = []

      newState.enemies.forEach((enemy) => {
        // Calculate vector from planet to enemy
        const enemyVector = {
          x: enemy.position.x,
          y: enemy.position.y,
          z: enemy.position.z,
        }

        // Calculate dot product to see if enemy is in the laser path
        const dotProduct = enemyVector.x * direction.x + enemyVector.y * direction.y + enemyVector.z * direction.z

        // Calculate distance from laser path
        const distanceSquared =
          enemyVector.x * enemyVector.x +
          enemyVector.y * enemyVector.y +
          enemyVector.z * enemyVector.z -
          dotProduct * dotProduct

        // If enemy is close to the laser path, it's hit
        if (distanceSquared < 0.5 && dotProduct > 0) {
          hitEnemies.push(enemy.id)
        }
      })

      // Apply damage to hit enemies
      if (hitEnemies.length > 0) {
        newState.enemies = newState.enemies
          .map((enemy) => {
            if (hitEnemies.includes(enemy.id)) {
              // Apply damage based on laser level and enemy resistance
              const baseDamage = newState.laserWeapon.damage * (1 + (newState.techTree.laserPower - 1) * 0.5)

              // Calculate resistance factor (0 = no resistance, 1 = complete immunity)
              const resistanceFactor = enemy.laserResistance || 0

              // Apply resistance - damage is reduced by resistance percentage
              const actualDamage = baseDamage * (1 - resistanceFactor)

              const newHealth = enemy.health - actualDamage

              // Add resistance effect if enemy has significant resistance
              if (resistanceFactor > 0.3) {
                // Add shield impact effect
                newState.explosions.push({
                  id: `explosion-shield-${Date.now()}-${enemy.id}`,
                  position: enemy.position,
                  scale: 0.7,
                  duration: 0.3,
                  color: resistanceFactor > 0.7 ? "#ff00ff" : "#aa00ff",
                  createdAt: Date.now(),
                })
              }

              if (newHealth <= 0) {
                // Enemy destroyed, gain resources and score
                const resourceGain =
                  enemy.type === "dreadnought"
                    ? 50
                    : enemy.type === "cruiser"
                      ? 30
                      : enemy.type === "bomber"
                        ? 25
                        : enemy.type === "fighter"
                          ? 20
                          : 10

                const scoreGain =
                  enemy.type === "dreadnought"
                    ? 200
                    : enemy.type === "cruiser"
                      ? 100
                      : enemy.type === "bomber"
                        ? 80
                        : enemy.type === "fighter"
                          ? 50
                          : 20

                newState.resources += resourceGain
                newState.score += scoreGain

                // Add explosion
                newState.explosions.push({
                  id: `explosion-enemy-${Date.now()}-${enemy.id}`,
                  position: enemy.position,
                  scale:
                    enemy.type === "dreadnought"
                      ? 1.5
                      : enemy.type === "cruiser"
                        ? 1.2
                        : enemy.type === "bomber"
                          ? 1.0
                          : enemy.type === "fighter"
                            ? 0.8
                            : 0.6,
                  duration: 1.0,
                  color: "#ff0000",
                  createdAt: Date.now(),
                })

                return null
              }

              return {
                ...enemy,
                health: newHealth,
              }
            }
            return enemy
          })
          .filter(Boolean) as Enemy[]
      }

      // Add laser beam effect
      newState.explosions.push({
        id: `explosion-laser-${Date.now()}`,
        position: {
          x: targetPosition.x * 0.5,
          y: targetPosition.y * 0.5,
          z: targetPosition.z * 0.5,
        },
        scale: 0.3,
        duration: 0.2,
        color: "#ff0000",
        createdAt: Date.now(),
      })

      return newState
    })
  }, [])

  // Toggle laser upgrade UI
  const toggleLaserUpgradeUI = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showLaserUpgradeUI: !prev.showLaserUpgradeUI,
      // Pause the game when opening the upgrade UI
      paused: !prev.showLaserUpgradeUI ? true : prev.paused,
    }))
  }, [])

  // Upgrade specific laser property
  const upgradeLaserProperty = useCallback((property: keyof LaserUpgrades) => {
    setGameState((prev) => {
      if (prev.paused && !prev.showLaserUpgradeUI) return prev

      // Calculate cost based on current upgrade level
      const baseCost = 40
      const level = prev.laserWeapon.upgrades[property]
      const cost = Math.floor(baseCost * (1 + level * 0.5))

      if (prev.resources < cost) return prev

      const newState = { ...prev }
      newState.resources -= cost

      // Update the specific property
      const newUpgrades = { ...newState.laserWeapon.upgrades }
      newUpgrades[property] = newUpgrades[property] + 1

      // Apply the upgrade effects
      const newLaserWeapon = { ...newState.laserWeapon, upgrades: newUpgrades }

      switch (property) {
        case "damage":
          newLaserWeapon.damage *= 1.2
          break
        case "cooldown":
          newLaserWeapon.cooldown = Math.max(200, newLaserWeapon.cooldown * 0.9)
          break
        case "energyEfficiency":
          newLaserWeapon.energyCost = Math.max(5, Math.floor(newLaserWeapon.energyCost * 0.9))
          break
        case "range":
          newLaserWeapon.range *= 1.15
          break
        case "beamWidth":
          newLaserWeapon.beamWidth *= 1.25
          break
      }

      // Increase overall laser level every 3 upgrades
      const totalUpgrades = Object.values(newUpgrades).reduce((sum, val) => sum + val, 0)
      if (totalUpgrades % 3 === 0) {
        newLaserWeapon.level += 1
      }

      newState.laserWeapon = newLaserWeapon

      // Add upgrade effect
      newState.explosions.push({
        id: `explosion-upgrade-laser-${Date.now()}`,
        position: { x: 0, y: 0, z: 0 },
        scale: 1.0,
        duration: 0.6,
        color: "#ff00ff",
        createdAt: Date.now(),
      })

      // Add score for upgrades
      newState.score += cost

      return newState
    })
  }, [])

  // Upgrade laser
  const upgradeLaser = useCallback(() => {
    setGameState((prev) => {
      if (prev.resources < 60 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 60

      // Upgrade laser level
      newState.techTree = {
        ...newState.techTree,
        laserPower: newState.techTree.laserPower + 1,
      }

      // Improve laser properties
      newState.laserWeapon = {
        ...newState.laserWeapon,
        damage: newState.laserWeapon.damage * 1.2,
        cooldown: Math.max(500, newState.laserWeapon.cooldown * 0.9),
        level: newState.laserWeapon.level + 1,
      }

      // Add upgrade effect
      newState.explosions.push({
        id: `explosion-upgrade-laser-${Date.now()}`,
        position: { x: 0, y: 0, z: 0 },
        scale: 1.0,
        duration: 0.6,
        color: "#ff00ff",
        createdAt: Date.now(),
      })

      // Add score for upgrades
      newState.score += 60

      return newState
    })
  }, [])

  // Adjust game speed
  const setGameSpeed = useCallback((speed: number) => {
    setGameState((prev) => ({
      ...prev,
      gameSpeed: Math.max(0.5, Math.min(2.0, speed)),
    }))
  }, [])

  // Add these functions to the useGameState hook return statement
  // Toggle scanner
  const toggleScanner = useCallback(() => {
    setGameState((prev) => {
      // Check if scanner is on cooldown
      if (Date.now() - prev.scanner.lastUsed < prev.scanner.cooldown) {
        return prev
      }

      // Check if we have enough resources to activate the scanner
      if (!prev.scanner.active && prev.resources < prev.scanner.energyCost) {
        return prev
      }

      // Toggle scanner state
      const newState = { ...prev }

      if (!prev.scanner.active) {
        // Activating scanner
        newState.resources -= prev.scanner.energyCost
        newState.scanner.active = true
        newState.scanner.lastUsed = Date.now()

        // Add scanner activation effect
        newState.explosions.push({
          id: `explosion-scanner-${Date.now()}`,
          position: { x: 0, y: 0, z: 0 },
          scale: 1.5,
          duration: 0.6,
          color: "#00ffff",
          createdAt: Date.now(),
        })
      } else {
        // Deactivating scanner
        newState.scanner.active = false
      }

      return newState
    })
  }, [])

  // Update enemy scan progress
  const updateEnemyScanProgress = useCallback((enemyId: string, progress: number) => {
    setGameState((prev) => {
      const newState = { ...prev }

      // Find the enemy and update scan progress
      newState.enemies = newState.enemies.map((enemy) => {
        if (enemy.id === enemyId) {
          return {
            ...enemy,
            scanProgress: progress,
          }
        }
        return enemy
      })

      return newState
    })
  }, [])

  // Complete enemy scan
  const completeEnemyScan = useCallback((enemyId: string) => {
    setGameState((prev) => {
      const newState = { ...prev }

      // Add enemy to scanned list if not already there
      if (!newState.scanner.scannedEnemies.includes(enemyId)) {
        newState.scanner.scannedEnemies = [...newState.scanner.scannedEnemies, enemyId]

        // Mark enemy as scanned
        newState.enemies = newState.enemies.map((enemy) => {
          if (enemy.id === enemyId) {
            return {
              ...enemy,
              scanned: true,
              scanProgress: 1,
            }
          }
          return enemy
        })

        // Add scan complete effect
        const scannedEnemy = newState.enemies.find((e) => e.id === enemyId)
        if (scannedEnemy) {
          newState.explosions.push({
            id: `explosion-scan-complete-${Date.now()}`,
            position: scannedEnemy.position,
            scale: 0.5,
            duration: 0.4,
            color: "#00ffff",
            createdAt: Date.now(),
          })
        }

        // Add score for scanning
        newState.score += 10
      }

      return newState
    })
  }, [])

  // Upgrade scanner
  const upgradeScanner = useCallback(() => {
    setGameState((prev) => {
      if (prev.resources < 50 || prev.paused || prev.gameOver) return prev

      const newState = { ...prev }
      newState.resources -= 50

      // Improve scanner properties
      newState.scanner = {
        ...newState.scanner,
        level: newState.scanner.level + 1,
        range: newState.scanner.range * 1.2,
        cooldown: Math.max(1000, newState.scanner.cooldown * 0.8),
      }

      // Add upgrade effect
      newState.explosions.push({
        id: `explosion-upgrade-scanner-${Date.now()}`,
        position: { x: 0, y: 0, z: 0 },
        scale: 1.0,
        duration: 0.6,
        color: "#00ffff",
        createdAt: Date.now(),
      })

      // Add score for upgrades
      newState.score += 50

      return newState
    })
  }, [])

  // Toggle scanner results UI
  const [showScannerResults, setShowScannerResults] = useState(false)

  const toggleScannerResults = useCallback(() => {
    setShowScannerResults((prev) => !prev)

    // Pause the game when opening the scanner results
    setGameState((prev) => ({
      ...prev,
      paused: !showScannerResults ? true : prev.paused,
    }))
  }, [showScannerResults])

  // Make sure to include these new functions in the return statement
  return {
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
  }
}
