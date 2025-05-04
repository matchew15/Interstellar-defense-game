"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Enemy } from "@/lib/types"
import * as THREE from "three"

interface EnemyShipProps {
  enemy: Enemy
  predictedPath?: THREE.Vector3[]
  isOptimalTarget: boolean
}

// Make enemy ships more visible on mobile
export default function EnemyShip({ enemy, predictedPath, isOptimalTarget }: EnemyShipProps) {
  const shipRef = useRef<THREE.Group>(null)

  // Create a ship mesh based on enemy type
  const shipGeometry = useMemo(() => {
    switch (enemy.type) {
      case "scout":
        return new THREE.ConeGeometry(0.3, 0.6, 8)
      case "fighter":
        return new THREE.ConeGeometry(0.4, 0.8, 8)
      case "cruiser":
        return new THREE.ConeGeometry(0.5, 1.2, 8)
      default:
        return new THREE.ConeGeometry(0.3, 0.6, 8)
    }
  }, [enemy.type])

  // Color based on enemy type
  const shipColor = useMemo(() => {
    switch (enemy.type) {
      case "scout":
        return "#ff4444"
      case "fighter":
        return "#ff8800"
      case "cruiser":
        return "#ff0000"
      default:
        return "#ff4444"
    }
  }, [enemy.type])

  // Update position based on enemy data
  useFrame(() => {
    if (shipRef.current) {
      shipRef.current.position.set(enemy.position.x, enemy.position.y, enemy.position.z)

      // Rotate to face the direction of movement
      if (enemy.velocity) {
        const direction = new THREE.Vector3(enemy.velocity.x, enemy.velocity.y, enemy.velocity.z).normalize()

        if (direction.length() > 0) {
          const lookAt = new THREE.Vector3().copy(shipRef.current.position).add(direction)
          shipRef.current.lookAt(lookAt)
          // Adjust rotation to point the cone tip forward
          shipRef.current.rotateX(Math.PI / 2)
        }
      }
    }
  })

  // Determine if enemy has significant laser resistance
  const hasLaserResistance = enemy.laserResistance && enemy.laserResistance > 0.3

  return (
    <group ref={shipRef} position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      {/* Enemy ship */}
      <mesh geometry={shipGeometry} castShadow>
        <meshStandardMaterial
          color={shipColor}
          emissive={isOptimalTarget ? "#ffffff" : shipColor}
          emissiveIntensity={isOptimalTarget ? 0.8 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Engine glow */}
      <pointLight color="#ff8844" intensity={0.8} distance={3} />

      {/* Health indicator */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshBasicMaterial color={enemy.health > 70 ? "#00ff00" : enemy.health > 30 ? "#ffff00" : "#ff0000"} />
      </mesh>

      {/* Laser resistance shield indicator */}
      {hasLaserResistance && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial
            color={enemy.laserResistance >= 0.7 ? "#ff00ff" : "#aa00ff"}
            transparent
            opacity={0.2 + (enemy.laserResistance || 0) * 0.3}
          />
        </mesh>
      )}

      {/* Scanning progress indicator */}
      {enemy.scanProgress !== undefined && enemy.scanProgress > 0 && enemy.scanProgress < 1 && (
        <>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} wireframe />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.08]} />
            <meshBasicMaterial color="#00ffff" />
            <mesh position={[0.25 - 0.5 * enemy.scanProgress, 0, 0]} scale={[enemy.scanProgress, 1, 1]}>
              <boxGeometry args={[0.5, 0.08, 0.08]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </mesh>
        </>
      )}

      {/* Scanned indicator */}
      {enemy.scanned && (
        <>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.1} wireframe />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.08]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
        </>
      )}

      {/* Highlight for optimal targets */}
      {isOptimalTarget && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Simplified predicted path visualization for mobile */}
      {predictedPath && predictedPath.length > 0 && (
        <line>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              count={Math.min(5, predictedPath.length)}
              array={
                new Float32Array(
                  Array.from({ length: Math.min(5, predictedPath.length) }, (_, i) => [
                    predictedPath[i].x,
                    predictedPath[i].y,
                    predictedPath[i].z,
                  ]).flat(),
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color="#00ffff" opacity={0.5} transparent />
        </line>
      )}
    </group>
  )
}
