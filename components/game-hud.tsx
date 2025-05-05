"use client"

import { Button } from "@/components/ui/button"
import { Pause } from "lucide-react"
import type { TechTree } from "@/lib/types"

interface GameHUDProps {
  wave: number
  planetHealth: number
  resources: number
  maxResources: number
  techTree: TechTree
  score: number
  onPause: () => void
}

export default function GameHUD({
  wave,
  planetHealth,
  resources,
  maxResources,
  techTree,
  score,
  onPause,
}: GameHUDProps) {
  return (
    <div className="bg-blue-900/80 p-2 md:p-4 text-white flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center">
        <div className="text-lg md:text-xl font-bold mr-4">IDS</div>
        <div className="text-sm md:text-base">
          Score: <span className="text-yellow-300">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex space-x-4 items-center">
        <div className="text-sm">
          Wave: <span className="text-blue-300">{wave}</span>
        </div>
        <div className="text-sm">
          Health: <span className={`${planetHealth > 50 ? "text-green-300" : "text-red-300"}`}>{planetHealth}%</span>
        </div>
        <div className="text-sm">
          Resources: <span className="text-yellow-300">{Math.floor(resources)}</span>
        </div>
        <Button onClick={onPause} size="sm" className="bg-blue-700 hover:bg-blue-600">
          <Pause className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
