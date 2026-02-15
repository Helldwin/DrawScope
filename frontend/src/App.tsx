import { useEffect, useState } from "react";
import HeatmapAnimated from "./components/HeatmapAnimated";
import Predictions from "./components/Predictions";
import TopNumbers from "./components/TopNumbers";

export default function App() {
  const [draws, setDraws] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<number[]>([]);
  const [gapStats, setGapStats] = useState<any>({});

  useEffect(() => {
    fetch("/data.json").then(r => r.json()).then(setDraws);
    fetch("/gap_stats.json").then(r => r.json()).then(setGapStats);
    fetch("/predictions.json").then(r => r.json()).then(setPredictions);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-6">
        DrawScope V1.0
      </h1>

      <Predictions numbers={predictions} />

      {gapStats && <TopNumbers stats={gapStats} />}

      {draws.length > 0 && <HeatmapAnimated draws={draws} />}
    </div>
  );
}
