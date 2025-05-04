"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Explosion as ExplosionType } from "@/lib/types"
import type * as THREE from "three"

interface ExplosionProps {
  explosion: ExplosionType
}

export default function Explosion({ explosion }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())

  // Create particles for the explosion
  const particles = useMemo(() => {
    const count = Math.floor(explosion.scale * 20)
    const positions = []
    const velocities = []

    for (let i = 0; i < count; i++) {
      // Random position within a sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = Math.random() * 0.2

      positions.push([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)])

      // Random velocity outward
      velocities.push([
        Math.sin(phi) * Math.cos(theta) * (0.5 + Math.random() * 0.5),
        Math.sin(phi) * Math.sin(theta) * (0.5 + Math.random() * 0.5),
        Math.cos(phi) * (0.5 + Math.random() * 0.5),
      ])
    }

    return { positions, velocities, count }
  }, [explosion.scale])

  // Update particles
  useFrame(() => {
    if (groupRef.current) {
      const elapsed = (Date.now() - startTime.current) / 1000
      const progress = Math.min(1, elapsed / explosion.duration)

      // Scale the explosion over time
      const currentScale = explosion.scale * (1 - Math.pow(progress - 1, 2))
      groupRef.current.scale.set(currentScale, currentScale, currentScale)

      // Fade out
      if (groupRef.current.children[0]) {
        const material = (groupRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial
        material.opacity = 1 - progress
      }
    }
  })

  return (
    <group ref={groupRef} position={[explosion.position.x, explosion.position.y, explosion.position.z]}>
      {/* Central flash */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={explosion.color} transparent opacity={0.8} />
      </mesh>

      {/* Particles */}
      {particles.positions.map((pos, i) => (
        <mesh
          key={i}
          position={[
            explosion.position.x + pos[0] + (particles.velocities[i][0] * (Date.now() - startTime.current)) / 500,
            explosion.position.y + pos[1] + (particles.velocities[i][1] * (Date.now() - startTime.current)) / 500,
            explosion.position.z + pos[2] + (particles.velocities[i][2] * (Date.now() - startTime.current)) / 500,
          ]}
        >
          <sphereGeometry args={[0.1 * Math.random() * explosion.scale, 8, 8]} />
          <meshBasicMaterial color={explosion.color} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Light */}
      <pointLight
        color={explosion.color}
        intensity={5 * (1 - (Date.now() - startTime.current) / (explosion.duration * 1000))}
        distance={explosion.scale * 5}
      />
    </group>
  )
}
