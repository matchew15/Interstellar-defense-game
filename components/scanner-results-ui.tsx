"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Scan, X, Shield, Zap, Activity, AlertTriangle } from "lucide-react"
import type { Enemy, Scanner } from "@/lib/types"

interface ScannerResultsUIProps {
  scanner: Scanner
  enemies: Enemy[]
  onClose: () => void
}

export default function ScannerResultsUI({ scanner, enemies, onClose }: ScannerResultsUIProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"distance" | "resistance" | "threat">("resistance")

  // Get scanned enemies
  const scannedEnemies = enemies.filter((enemy) => scanner.scannedEnemies.includes(enemy.id))

  // Sort enemies based on selected criteria
  const sortedEnemies = [...scannedEnemies].sort((a, b) => {
    if (sortBy === "distance") {
      const distA = Math.sqrt(a.position.x ** 2 + a.position.y ** 2 + a.position.z ** 2)
      const distB = Math.sqrt(b.position.x ** 2 + b.position.y ** 2 + b.position.z ** 2)
      return distA - distB
    } else if (sortBy === "resistance") {
      return (b.laserResistance || 0) - (a.laserResistance || 0)
    } else {
      // Threat level (combination of type, health, and distance)
      const threatA =
        (a.type === "dreadnought"
          ? 5
          : a.type === "cruiser"
            ? 4
            : a.type === "bomber"
              ? 3
              : a.type === "fighter"
                ? 2
                : 1) *
        (a.health / a.maxHealth) *
        (10 / Math.sqrt(a.position.x ** 2 + a.position.y ** 2 + a.position.z ** 2))
      const threatB =
        (b.type === "dreadnought"
          ? 5
          : b.type === "cruiser"
            ? 4
            : b.type === "bomber"
              ? 3
              : b.type === "fighter"
                ? 2
                : 1) *
        (b.health / b.maxHealth) *
        (10 / Math.sqrt(b.position.x ** 2 + b.position.y ** 2 + b.position.z ** 2))
      return threatB - threatA
    }
  })

  // Auto-select first enemy if none selected
  useEffect(() => {
    if (sortedEnemies.length > 0 && !selectedEnemy) {
      setSelectedEnemy(sortedEnemies[0].id)
    }
  }, [sortedEnemies, selectedEnemy])

  // Get selected enemy details
  const selectedEnemyData = selectedEnemy ? enemies.find((e) => e.id === selectedEnemy) : null

  // Format resistance value for display
  const formatResistance = (value: number | undefined) => {
    if (value === undefined) return "0%"
    return `${Math.round(value * 100)}%`
  }

  // Get resistance color
  const getResistanceColor = (value: number | undefined) => {
    if (!value) return "text-green-400"
    if (value < 0.3) return "text-green-400"
    if (value < 0.7) return "text-yellow-400"
    return "text-red-400"
  }

  // Get resistance level text
  const getResistanceLevel = (value: number | undefined) => {
    if (!value) return "None"
    if (value < 0.3) return "Low"
    if (value < 0.7) return "Medium"
    return "High"
  }

  // Calculate distance to planet
  const getDistance = (enemy: Enemy) => {
    return Math.sqrt(enemy.position.x ** 2 + enemy.position.y ** 2 + enemy.position.z ** 2).toFixed(1)
  }

  // Calculate effective damage multiplier
  const getEffectiveDamage = (resistance: number | undefined) => {
    if (!resistance) return "100%"
    return `${Math.round((1 - resistance) * 100)}%`
  }

  return (
    <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-cyan-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-cyan-900">
          <h2 className="text-xl font-bold text-cyan-500 flex items-center">
            <Scan className="mr-2 h-5 w-5" />
            Enemy Scanner Mk.{scanner.level}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {scannedEnemies.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p className="text-gray-300">No enemies have been scanned yet.</p>
              <p className="text-gray-400 text-sm mt-2">Activate the scanner to analyze enemy resistance.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-300">Sort by:</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={sortBy === "resistance" ? "default" : "outline"}
                      className={`py-1 h-7 text-xs ${sortBy === "resistance" ? "bg-cyan-700" : ""}`}
                      onClick={() => setSortBy("resistance")}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Resistance
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === "threat" ? "default" : "outline"}
                      className={`py-1 h-7 text-xs ${sortBy === "threat" ? "bg-cyan-700" : ""}`}
                      onClick={() => setSortBy("threat")}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Threat
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === "distance" ? "default" : "outline"}
                      className={`py-1 h-7 text-xs ${sortBy === "distance" ? "bg-cyan-700" : ""}`}
                      onClick={() => setSortBy("distance")}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Distance
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {sortedEnemies.map((enemy) => (
                    <Button
                      key={enemy.id}
                      variant={selectedEnemy === enemy.id ? "default" : "outline"}
                      className={`justify-start text-xs py-1 h-auto ${
                        selectedEnemy === enemy.id ? "bg-cyan-900 border-cyan-700" : ""
                      }`}
                      onClick={() => setSelectedEnemy(enemy.id)}
                    >
                      <div className="flex items-center w-full justify-between">
                        <span className="capitalize">{enemy.type}</span>
                        <Badge
                          variant="outline"
                          className={`ml-1 ${
                            enemy.laserResistance && enemy.laserResistance >= 0.7
                              ? "bg-red-900/30 text-red-300 border-red-700"
                              : enemy.laserResistance && enemy.laserResistance >= 0.3
                                ? "bg-yellow-900/30 text-yellow-300 border-yellow-700"
                                : "bg-green-900/30 text-green-300 border-green-700"
                          }`}
                        >
                          {formatResistance(enemy.laserResistance)}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedEnemyData && (
                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-cyan-400 capitalize">{selectedEnemyData.type} Analysis</h3>
                    <Badge variant="outline" className="bg-gray-900/50 border-gray-600">
                      ID: {selectedEnemyData.id.split("-")[1]}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Laser Resistance:</span>
                        <span className={getResistanceColor(selectedEnemyData.laserResistance)}>
                          {getResistanceLevel(selectedEnemyData.laserResistance)} (
                          {formatResistance(selectedEnemyData.laserResistance)})
                        </span>
                      </div>
                      <Progress
                        value={(selectedEnemyData.laserResistance || 0) * 100}
                        className="h-2 bg-gray-700"
                        indicatorClassName={
                          selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.7
                            ? "bg-red-600"
                            : selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.3
                              ? "bg-yellow-600"
                              : "bg-green-600"
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Health</div>
                        <Progress
                          value={(selectedEnemyData.health / selectedEnemyData.maxHealth) * 100}
                          className="h-2 bg-gray-700"
                          indicatorClassName="bg-green-600"
                        />
                        <div className="text-xs mt-1 text-right">
                          {Math.round(selectedEnemyData.health)}/{selectedEnemyData.maxHealth}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Distance</div>
                        <div className="text-lg font-bold">{getDistance(selectedEnemyData)}m</div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1 text-cyan-400" />
                        Weapon Effectiveness
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Laser Damage:</span>{" "}
                          <span
                            className={
                              selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.7
                                ? "text-red-400"
                                : selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.3
                                  ? "text-yellow-400"
                                  : "text-green-400"
                            }
                          >
                            {getEffectiveDamage(selectedEnemyData.laserResistance)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Turret Damage:</span>{" "}
                          <span className="text-green-400">100%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-300">
                      <h4 className="font-medium mb-1">Tactical Recommendation:</h4>
                      <p>
                        {selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.7
                          ? "Use turrets instead of laser weapons. This enemy has high laser resistance."
                          : selectedEnemyData.laserResistance && selectedEnemyData.laserResistance >= 0.3
                            ? "Consider using wider laser beams or turrets for more effective damage."
                            : "Standard laser attacks are highly effective against this target."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-4 bg-cyan-900/20 p-3 rounded-md border border-cyan-900/50">
            <h3 className="text-sm font-medium text-cyan-400 mb-2">Scanner Information</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Range:</span> {scanner.range.toFixed(1)}m
              </div>
              <div>
                <span className="text-gray-400">Energy Cost:</span> {scanner.energyCost}
              </div>
              <div>
                <span className="text-gray-400">Scan Speed:</span> {scanner.level}x
              </div>
              <div>
                <span className="text-gray-400">Enemies Scanned:</span> {scanner.scannedEnemies.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
