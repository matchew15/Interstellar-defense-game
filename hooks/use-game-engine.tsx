"use client"

import { useState, useEffect, useRef } from "react"
import type { GameState, Enemy } from "@/lib/types"
import * as THREE from "three"

// Model Predictive Control for game AI
export function useGameEngine(gameState: GameState) {
  const [predictedPaths, setPredictedPaths] = useState<Record<string, THREE.Vector3[]>>({})
  const [optimalTargets, setOptimalTargets] = useState<string[]>([])

  // Use refs to store the previous state to compare and avoid unnecessary updates
  const prevEnemiesRef = useRef<Enemy[]>([])
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Throttle MPC calculations to prevent excessive updates
  useEffect(() => {
    // Skip if enemies array is the same reference or has the same length and IDs
    const enemiesChanged =
      prevEnemiesRef.current.length !== gameState.enemies.length ||
      !prevEnemiesRef.current.every(
        (prevEnemy, index) => gameState.enemies[index] && prevEnemy.id === gameState.enemies[index].id,
      )

    if (!enemiesChanged) return

    // Store current enemies for next comparison
    prevEnemiesRef.current = [...gameState.enemies]

    // Clear any pending calculation
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current)
    }

    // Throttle calculations to run at most every 500ms
    calculationTimeoutRef.current = setTimeout(() => {
      if (gameState.enemies.length === 0) {
        setPredictedPaths({})
        setOptimalTargets([])
        return
      }

      // Predict enemy paths
      const newPaths: Record<string, THREE.Vector3[]> = {}

      gameState.enemies.forEach((enemy) => {
        newPaths[enemy.id] = predictEnemyPath(enemy, 10)
      })

      setPredictedPaths(newPaths)

      // Determine optimal targets based on threat assessment
      const threats = assessThreats(gameState.enemies, newPaths)
      setOptimalTargets(threats.map((t) => t.id))

      calculationTimeoutRef.current = null
    }, 500)

    // Cleanup on unmount
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current)
      }
    }
  }, [gameState.enemies])

  return {
    predictedPaths,
    optimalTargets,
  }
}

// Predict enemy path over time steps
function predictEnemyPath(enemy: Enemy, steps: number): THREE.Vector3[] {
  const path: THREE.Vector3[] = []
  const currentPos = new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z)

  // Calculate direction to planet (at origin)
  const direction = new THREE.Vector3(0, 0, 0).sub(currentPos).normalize()

  // Apply behavior modifications
  let modifiedDirection = direction.clone()

  for (let i = 0; i < steps; i++) {
    // Clone current position for this step
    const stepPos = currentPos.clone()

    // Apply behavior modifications for this time step
    if (enemy.behavior === "evasive") {
      // Zigzag pattern
      const offset = new THREE.Vector3(
        Math.sin((Date.now() + i * 100) / 1000) * 0.3,
        0,
        Math.cos((Date.now() + i * 100) / 1000) * 0.3,
      )
      modifiedDirection = direction.clone().add(offset).normalize()
    } else if (enemy.behavior === "flanking") {
      // Circle around
      const perp = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(0.5)
      modifiedDirection = direction.clone().add(perp).normalize()
    } else {
      modifiedDirection = direction.clone()
    }

    // Calculate speed based on enemy type
    let speed = 0.05
    if (enemy.type === "scout") speed = 0.08
    if (enemy.type === "cruiser") speed = 0.03

    // Move along direction
    stepPos.add(modifiedDirection.clone().multiplyScalar(speed * (i + 1)))

    path.push(stepPos)
  }

  return path
}

// Assess threats and prioritize targets
function assessThreats(enemies: Enemy[], paths: Record<string, THREE.Vector3[]>): Enemy[] {
  // Calculate threat score for each enemy
  const threats = enemies.map((enemy) => {
    let threatScore = 0

    // Base threat on enemy type
    if (enemy.type === "cruiser") threatScore += 30
    else if (enemy.type === "fighter") threatScore += 20
    else threatScore += 10

    // Add threat based on proximity to planet
    const distanceToCenter = Math.sqrt(
      enemy.position.x * enemy.position.x + enemy.position.y * enemy.position.y + enemy.position.z * enemy.position.z,
    )

    // Closer enemies are more threatening
    threatScore += (20 - distanceToCenter) * 5

    // Add threat based on health (higher health = more threat)
    threatScore += enemy.health / 10

    // Adjust threat based on laser resistance
    // Enemies with high laser resistance are less optimal targets for the laser
    // but more threatening overall
    if (enemy.laserResistance) {
      // For threat assessment, resistant enemies are MORE threatening
      threatScore += enemy.laserResistance * 20

      // But for targeting priority, we might want to target less resistant enemies first
      // This is handled in the targeting logic
    }

    return {
      ...enemy,
      threatScore,
    }
  })

  // Sort by threat score (highest first)
  return threats.sort((a, b) => b.threatScore - a.threatScore)
}
