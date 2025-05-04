"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { LaserWeapon as LaserWeaponType, Enemy } from "@/lib/types"

interface LaserWeaponProps {
  laserWeapon: LaserWeaponType
  onLaserHit: (enemyId: string) => void
  enemies: Enemy[]
}

export default function LaserWeapon({ laserWeapon, onLaserHit, enemies }: LaserWeaponProps) {
  const { scene, camera } = useThree()
  const laserRef = useRef<THREE.Group>(null)
  const aimLineRef = useRef<THREE.Line>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const lastFireTime = useRef(laserWeapon.lastFired)
  const [hitResistantEnemy, setHitResistantEnemy] = useState(false)
  const [resistanceLevel, setResistanceLevel] = useState(0)

  // Create aim line geometry
  useEffect(() => {
    if (aimLineRef.current) {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -100),
      ])
      aimLineRef.current.geometry = lineGeometry
    }
  }, [])

  // Reset resistance hit effect after a short time
  useEffect(() => {
    if (hitResistantEnemy) {
      const timer = setTimeout(() => {
        setHitResistantEnemy(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [hitResistantEnemy])

  // Handle aiming and firing
  useFrame(({ camera, mouse: threeMouse, raycaster: threeRaycaster }) => {
    if (!laserWeapon.isAiming) return

    // Update raycaster with current mouse position
    raycaster.current.setFromCamera(threeMouse, camera)

    // Calculate intersection with a plane at y=0 (for ground targeting)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const targetPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(plane, targetPoint)

    // Limit to range
    const direction = new THREE.Vector3().subVectors(targetPoint, camera.position).normalize()
    const limitedPoint = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(laserWeapon.range))

    // Check for intersections with enemies
    const enemyMeshes = enemies.map((enemy) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
      mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z)
      mesh.userData = { id: enemy.id, type: "enemy", resistance: enemy.laserResistance || 0 }
      return mesh
    })

    // Add invisible meshes to scene temporarily for raycasting
    enemyMeshes.forEach((mesh) => scene.add(mesh))

    const intersects = raycaster.current.intersectObjects(enemyMeshes)

    // Remove temporary meshes
    enemyMeshes.forEach((mesh) => scene.remove(mesh))

    // Update aim line
    if (aimLineRef.current) {
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const endPoint = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(100))

      if (intersects.length > 0) {
        endPoint.copy(intersects[0].point)

        // Check if the enemy has laser resistance
        const hitEnemy = intersects[0].object
        if (hitEnemy.userData.resistance > 0.3) {
          // Update the aim line color to indicate resistance
          const lineMaterial = aimLineRef.current.material as THREE.LineBasicMaterial
          lineMaterial.color.set(hitEnemy.userData.resistance > 0.7 ? "#ff00ff" : "#aa00ff")
        } else {
          // Regular aim line color
          const lineMaterial = aimLineRef.current.material as THREE.LineBasicMaterial
          lineMaterial.color.set("#ff0000")
        }
      } else if (targetPoint.length() > 0) {
        endPoint.copy(targetPoint)
        // Reset aim line color
        const lineMaterial = aimLineRef.current.material as THREE.LineBasicMaterial
        lineMaterial.color.set("#ff0000")
      }

      const points = [camera.position.clone(), endPoint]
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      aimLineRef.current.geometry = lineGeometry
    }

    // Check if laser was just fired and hit a resistant enemy
    if (laserWeapon.lastFired > Date.now() - 200 && laserWeapon.aimTarget) {
      // Find if we hit a resistant enemy
      const hitEnemy = enemies.find((enemy) => {
        const distanceToLaser = Math.sqrt(
          Math.pow(enemy.position.x - laserWeapon.aimTarget!.x, 2) +
            Math.pow(enemy.position.y - laserWeapon.aimTarget!.y, 2) +
            Math.pow(enemy.position.z - laserWeapon.aimTarget!.z, 2),
        )
        return distanceToLaser < 1 && enemy.laserResistance && enemy.laserResistance > 0.3
      })

      if (hitEnemy && !hitResistantEnemy) {
        setHitResistantEnemy(true)
        setResistanceLevel(hitEnemy.laserResistance || 0)
      }
    }
  })

  return (
    <group ref={laserRef}>
      {/* Aim line - only visible when aiming */}
      {laserWeapon.isAiming && (
        <line ref={aimLineRef}>
          <bufferGeometry />
          <lineBasicMaterial color="#ff0000" opacity={0.7} transparent linewidth={2} />
        </line>
      )}

      {/* Laser beam - only visible when firing */}
      {laserWeapon.lastFired > Date.now() - 200 && laserWeapon.aimTarget && (
        <>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[laserWeapon.beamWidth, laserWeapon.beamWidth, 100, 8]} />
            <meshBasicMaterial color="#ff0000" opacity={0.8} transparent />
          </mesh>
          <pointLight color="#ff0000" intensity={5} distance={10} />
        </>
      )}

      {/* Resistance impact effect */}
      {hitResistantEnemy && laserWeapon.aimTarget && (
        <>
          <mesh position={[laserWeapon.aimTarget.x, laserWeapon.aimTarget.y, laserWeapon.aimTarget.z]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color={resistanceLevel > 0.7 ? "#ff00ff" : "#aa00ff"} transparent opacity={0.6} />
          </mesh>
          <pointLight
            position={[laserWeapon.aimTarget.x, laserWeapon.aimTarget.y, laserWeapon.aimTarget.z]}
            color={resistanceLevel > 0.7 ? "#ff00ff" : "#aa00ff"}
            intensity={3}
            distance={5}
          />
        </>
      )}
    </group>
  )
}
