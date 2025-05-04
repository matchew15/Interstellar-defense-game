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
  onPause
}: GameHUDProps) {
  return (
    <div className="bg-blue-900/80 p-2 md:p-4 text-white flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center">
        <div className="text-lg md:text-xl font-bold mr-4">IDS</div>
        <div className="text-sm md:text-base">
          Score: &lt;span className="text-yellow-300"&gt;{score.toLocaleString()}&lt;/span&gt;
        </div>
      </div>

\
