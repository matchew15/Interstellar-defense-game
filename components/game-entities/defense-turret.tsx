"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import type { Enemy, Turret } from "@/lib/types"
import * as THREE from "three"

interface DefenseTurretProps {
  turret: Turret
  damageLevel: number
  enemies: Enemy[]
}

// Make turrets more visible on mobile
export default function DefenseTurret({ turret, damageLevel, enemies }: DefenseTurretProps) {
  const turretRef = useRef<THREE.Group>(null)
  const barrelRef = useRef<THREE.Mesh>(null)
  const [target, setTarget] = useState<Enemy | null>(null)
  const [isFiring, setIsFiring] = useState(false)
  const [lastFired, setLastFired] = useState(0)

  // Find the closest enemy to target
  useEffect(() => {
    if (enemies.length === 0) {
      setTarget(null)
      return
    }

    // Find closest enemy
    let closest = enemies[0]
    let closestDist = Number.POSITIVE_INFINITY

    enemies.forEach((enemy) => {
      const dist = Math.sqrt(
        Math.pow(enemy.position.x - turret.position.x, 2) + Math.pow(enemy.position.z - turret.position.z, 2),
      )

      if (dist < closestDist && dist < turret.range) {
        closest = enemy
        closestDist = dist
      }
    })

    if (closestDist < turret.range) {
      setTarget(closest)
    } else {
      setTarget(null)
    }
  }, [enemies, turret])

  // Rotate turret to face target and fire
  useFrame((state) => {
    if (turretRef.current && target) {
      // Calculate direction to target
      const direction = new THREE.Vector3(
        target.position.x - turret.position.x,
        0, // Keep y-rotation level
        target.position.z - turret.position.z,
      ).normalize()

      // Rotate turret base to face target
      if (direction.length() > 0) {
        const lookAt = new THREE.Vector3().copy(turretRef.current.position).add(direction)
        turretRef.current.lookAt(lookAt)
      }

      // Aim barrel up/down at target if we have a barrel reference
      if (barrelRef.current) {
        const heightDiff = target.position.y - turret.position.y
        const horizontalDist = Math.sqrt(
          Math.pow(target.position.x - turret.position.x, 2) + Math.pow(target.position.z - turret.position.z, 2),
        )

        // Calculate elevation angle
        const elevationAngle = Math.atan2(heightDiff, horizontalDist)
        barrelRef.current.rotation.x = -elevationAngle // Negative because of model orientation
      }

      // Fire at intervals
      if (state.clock.getElapsedTime() - lastFired > 1.5 / damageLevel) {
        setIsFiring(true)
        setLastFired(state.clock.getElapsedTime())

        // Reset firing state after a short delay
        setTimeout(() => {
          setIsFiring(false)
        }, 200)
      }
    }
  })

  return (
    <group ref={turretRef} position={[turret.position.x, turret.position.y, turret.position.z]}>
      {/* Turret base */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.4, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Turret rotation platform */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Turret barrel */}
      <mesh ref={barrelRef} position={[0, 0.35, 0]} castShadow>
        <group position={[0, 0, 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.7, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </mesh>

      {/* Firing effect - make more visible on mobile */}
      {isFiring && target && (
        <>
          <pointLight color="#ffaa00" intensity={5} distance={8} />
          <mesh position={[0, 0.35, 0.7]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>

          {/* Laser beam */}
          <line>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={
                  new Float32Array([
                    0,
                    0.35,
                    0.7,
                    target.position.x - turret.position.x,
                    target.position.y - turret.position.y,
                    target.position.z - turret.position.z,
                  ])
                }
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#ffaa00" opacity={0.9} transparent linewidth={2} />
          </line>
        </>
      )}

      {/* Range indicator (only shown when debugging) */}
      {false && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[turret.range - 0.05, turret.range, 32]} />
          <meshBasicMaterial color="#00ffff" opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
