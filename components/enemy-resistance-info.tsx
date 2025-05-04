"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, ChevronDown, ChevronUp } from "lucide-react"

export default function EnemyResistanceInfo() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-gray-800/50 p-2 rounded border border-purple-900">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-xs py-1 h-auto"
      >
        <div className="flex items-center">
          <Shield className="h-3 w-3 mr-1 text-purple-400" />
          <span>Enemy Resistance Info</span>
        </div>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500 opacity-50"></div>
            <span className="text-gray-300">Medium resistance (30-50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 opacity-50"></div>
            <span className="text-gray-300">High resistance (50-90%)</span>
          </div>
          <p className="text-gray-400 mt-1 text-[10px]">
            Tip: Upgrade beam width or use turrets against resistant enemies.
          </p>
        </div>
      )}
    </div>
  )
}
