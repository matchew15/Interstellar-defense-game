"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, X, ChevronUp, Gauge, Bolt, Target, Maximize } from "lucide-react"
import type { LaserWeapon, LaserUpgrades } from "@/lib/types"

interface LaserUpgradeUIProps {
  laserWeapon: LaserWeapon
  resources: number
  onUpgradeLaser: (property: keyof LaserUpgrades) => void
  onClose: () => void
}

export default function LaserUpgradeUI({ laserWeapon, resources, onUpgradeLaser, onClose }: LaserUpgradeUIProps) {
  const [selectedTab, setSelectedTab] = useState<keyof LaserUpgrades>("damage")

  // Calculate costs for each upgrade
  const getUpgradeCost = (property: keyof LaserUpgrades) => {
    const baseCost = 40
    const level = laserWeapon.upgrades[property]
    return Math.floor(baseCost * (1 + level * 0.5))
  }

  // Get max level for each property
  const getMaxLevel = (property: keyof LaserUpgrades) => {
    return property === "cooldown" || property === "energyEfficiency" ? 10 : 15
  }

  // Calculate the current value for display
  const getCurrentValue = (property: keyof LaserUpgrades) => {
    switch (property) {
      case "damage":
        return Math.floor(laserWeapon.damage)
      case "cooldown":
        return (laserWeapon.cooldown / 1000).toFixed(1) + "s"
      case "energyEfficiency":
        return laserWeapon.energyCost + " energy"
      case "range":
        return laserWeapon.range.toFixed(1) + "m"
      case "beamWidth":
        return laserWeapon.beamWidth.toFixed(2) + "m"
      default:
        return "0"
    }
  }

  // Get the next value after upgrade
  const getNextValue = (property: keyof LaserUpgrades) => {
    switch (property) {
      case "damage":
        return Math.floor(laserWeapon.damage * 1.2)
      case "cooldown":
        return ((laserWeapon.cooldown * 0.9) / 1000).toFixed(1) + "s"
      case "energyEfficiency":
        return Math.max(5, Math.floor(laserWeapon.energyCost * 0.9)) + " energy"
      case "range":
        return (laserWeapon.range * 1.15).toFixed(1) + "m"
      case "beamWidth":
        return (laserWeapon.beamWidth * 1.25).toFixed(2) + "m"
      default:
        return "0"
    }
  }

  // Get icon for each property
  const getPropertyIcon = (property: keyof LaserUpgrades) => {
    switch (property) {
      case "damage":
        return <Zap className="h-4 w-4" />
      case "cooldown":
        return <Gauge className="h-4 w-4" />
      case "energyEfficiency":
        return <Bolt className="h-4 w-4" />
      case "range":
        return <Target className="h-4 w-4" />
      case "beamWidth":
        return <Maximize className="h-4 w-4" />
    }
  }

  // Get description for each property
  const getPropertyDescription = (property: keyof LaserUpgrades) => {
    switch (property) {
      case "damage":
        return "Increases the damage dealt by the laser beam"
      case "cooldown":
        return "Reduces the time between laser shots"
      case "energyEfficiency":
        return "Reduces the energy cost of firing the laser"
      case "range":
        return "Increases the effective range of the laser"
      case "beamWidth":
        return "Increases the width of the laser beam for easier targeting"
    }
  }

  return (
    <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-red-900">
          <h2 className="text-xl font-bold text-red-500 flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Space Laser Mk.{laserWeapon.level} Upgrades
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Available Resources</p>
              <p className="text-xl font-bold text-yellow-400">{Math.floor(resources)}</p>
            </div>
            <Badge variant="outline" className="bg-red-900/30 text-red-300 border-red-700">
              Laser Level {laserWeapon.level}
            </Badge>
          </div>

          <div className="grid grid-cols-5 gap-1 mb-6">
            {(Object.keys(laserWeapon.upgrades) as Array<keyof LaserUpgrades>).map((property) => (
              <Button
                key={property}
                variant={selectedTab === property ? "default" : "outline"}
                className={`px-2 py-1 h-auto ${
                  selectedTab === property ? "bg-red-700 hover:bg-red-600" : "hover:bg-gray-800"
                }`}
                onClick={() => setSelectedTab(property)}
              >
                {getPropertyIcon(property)}
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium flex items-center">
                  {getPropertyIcon(selectedTab)}
                  <span className="ml-2 capitalize">{selectedTab}</span>
                </h3>
                <span className="text-sm text-gray-400">
                  Level {laserWeapon.upgrades[selectedTab]} / {getMaxLevel(selectedTab)}
                </span>
              </div>
              <Progress
                value={(laserWeapon.upgrades[selectedTab] / getMaxLevel(selectedTab)) * 100}
                className="h-2 bg-gray-700"
                indicatorClassName="bg-red-600"
              />
              <p className="mt-2 text-sm text-gray-300">{getPropertyDescription(selectedTab)}</p>
            </div>

            <div className="bg-gray-800/50 p-3 rounded-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Current</span>
                <span className="text-white">{getCurrentValue(selectedTab)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Next Level</span>
                <span className="text-green-400">{getNextValue(selectedTab)}</span>
              </div>
            </div>

            <Button
              onClick={() => onUpgradeLaser(selectedTab)}
              disabled={
                resources < getUpgradeCost(selectedTab) || laserWeapon.upgrades[selectedTab] >= getMaxLevel(selectedTab)
              }
              className="w-full bg-red-700 hover:bg-red-600 flex items-center justify-between"
            >
              <span className="flex items-center">
                <ChevronUp className="mr-1 h-4 w-4" />
                Upgrade {selectedTab}
              </span>
              <span>{getUpgradeCost(selectedTab)} resources</span>
            </Button>

            <div className="mt-6 p-3 bg-gray-800/50 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium mb-2 text-red-400">Enemy Resistance Info</h3>
              <div className="space-y-2 text-xs">
                <p className="text-gray-300">Some enemies have laser resistance shields that reduce damage:</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500 opacity-50"></div>
                  <span>Medium resistance (30-50% damage reduction)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-fuchsia-500 opacity-50"></div>
                  <span>High resistance (50-90% damage reduction)</span>
                </div>
                <p className="text-gray-400 mt-1">
                  Tip: Upgrade beam width to better penetrate shields, or use turrets against highly resistant enemies.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {(Object.keys(laserWeapon.upgrades) as Array<keyof LaserUpgrades>).map((property) => (
              <div key={property} className="bg-gray-800/30 p-2 rounded border border-gray-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center text-gray-300">
                    {getPropertyIcon(property)}
                    <span className="ml-1 capitalize">{property}</span>
                  </span>
                  <span className="text-gray-400">Lv.{laserWeapon.upgrades[property]}</span>
                </div>
                <Progress
                  value={(laserWeapon.upgrades[property] / getMaxLevel(property)) * 100}
                  className="h-1 bg-gray-700"
                  indicatorClassName={selectedTab === property ? "bg-red-600" : "bg-red-900"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
