"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { Scanner, Enemy } from "@/lib/types"

interface EnemyScannerProps {
  scanner: Scanner
  enemies: Enemy[]
  onScanProgress: (enemyId: string, progress: number) => void
  onScanComplete: (enemyId: string) => void
}

export default function EnemyScanner({ scanner, enemies, onScanProgress, onScanComplete }: EnemyScannerProps) {
  const scannerRef = useRef<THREE.Group>(null)
  const scanRingRef = useRef<THREE.Mesh>(null)
  const scanLinesRef = useRef<THREE.LineSegments>(null)
  const scanningEnemiesRef = useRef<{ [id: string]: number }>({})

  // Create scanner visuals
  useEffect(() => {
    if (scanRingRef.current) {
      // Animate the scan ring
      const animate = () => {
        if (scanRingRef.current && scanner.active) {
          scanRingRef.current.rotation.y += 0.02
          scanRingRef.current.rotation.z += 0.01
        }
        requestAnimationFrame(animate)
      }
      animate()
    }
  }, [scanner.active])

  // Handle scanning logic
  useFrame((_, delta) => {
    if (!scanner.active) return

    // Reset scanning enemies if not active
    if (!scanner.active) {
      scanningEnemiesRef.current = {}
      return
    }

    // Process each enemy for scanning
    enemies.forEach((enemy) => {
      // Skip already fully scanned enemies
      if (scanner.scannedEnemies.includes(enemy.id)) return

      // Calculate distance to enemy
      const distance = Math.sqrt(
        enemy.position.x * enemy.position.x + enemy.position.y * enemy.position.y + enemy.position.z * enemy.position.z,
      )

      // Only scan enemies within range
      if (distance <= scanner.range) {
        // Initialize or increment scan progress
        if (!scanningEnemiesRef.current[enemy.id]) {
          scanningEnemiesRef.current[enemy.id] = 0
        }

        // Progress is faster for closer enemies and higher scanner levels
        const scanSpeed = (1 - distance / scanner.range) * scanner.level * delta
        scanningEnemiesRef.current[enemy.id] += scanSpeed

        // Report scan progress
        onScanProgress(enemy.id, scanningEnemiesRef.current[enemy.id])

        // Check if scan is complete
        if (scanningEnemiesRef.current[enemy.id] >= 1) {
          onScanComplete(enemy.id)
          delete scanningEnemiesRef.current[enemy.id]
        }
      } else {
        // Enemy moved out of range, reset progress
        if (scanningEnemiesRef.current[enemy.id]) {
          delete scanningEnemiesRef.current[enemy.id]
          onScanProgress(enemy.id, 0)
        }
      }
    })
  })

  // Don't render anything if scanner is not active
  if (!scanner.active) return null

  return (
    <group ref={scannerRef}>
      {/* Scanner ring */}
      <mesh ref={scanRingRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scanner.range - 0.2, scanner.range, 64]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Scanner beam lines */}
      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * scanner.range
          const z = Math.sin(angle) * scanner.range
          return (
            <line key={i}>
              <bufferGeometry
                attach="geometry"
                onUpdate={(self) => {
                  self.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)])
                }}
              />
              <lineBasicMaterial attach="material" color="#00ffff" opacity={0.5} transparent />
            </line>
          )
        })}
      </group>

      {/* Scanner pulse effect */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, scanner.range, 32]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          onUpdate={(self) => {
            self.opacity = 0.2 + Math.sin(Date.now() / 500) * 0.1
          }}
        />
      </mesh>

      {/* Scanner center */}
      <pointLight color="#00ffff" intensity={1} distance={scanner.range * 0.5} />
    </group>
  )
}
