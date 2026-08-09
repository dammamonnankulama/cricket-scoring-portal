"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchParamsForm({
  squad1,
  squad2,
  onBack,
}: {
  squad1: any;
  squad2: any;
  onBack: () => void;
}) {
  const router = useRouter();
  const [totalOvers, setTotalOvers] = useState(10);
  const [ballsPerOver, setBallsPerOver] = useState(6);
  const [city, setCity] = useState("");
  const [ground, setGround] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [ballType, setBallType] = useState<"tennis" | "leather" | "other">("leather");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"next" | "schedule" | null>(null);

  const submit = async (schedule: boolean) => {
    setError("");
    setLoading(schedule ? "schedule" : "next");

    const res = await fetch("/api/matches/create-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        squad1Id: squad1._id,
        squad2Id: squad2._id,
        totalOvers,
        ballsPerOver,
        city: city.trim() || null,
        ground: ground.trim() || null,
        matchDate: matchDate || null,
        ballType,
        schedule,
      }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(schedule ? "/dashboard" : `/match/${data.matchId}/toss`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-center gap-4 mb-6 pb-6 border-b border-slate-800">
        <p className="text-white text-sm font-medium">{squad1.name}</p>
        <span className="text-slate-500 text-xs">vs</span>
        <p className="text-white text-sm font-medium">{squad2.name}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Match Type</label>
          <select
            disabled
            value="limitedOvers"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-400 cursor-not-allowed"
          >
            <option value="limitedOvers">Limited Overs</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">More formats coming soon</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Total Overs</label>
            <input
              type="number"
              min={1}
              max={50}
              value={totalOvers}
              onChange={(e) => setTotalOvers(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Balls / Over</label>
            <input
              type="number"
              min={1}
              max={12}
              value={ballsPerOver}
              onChange={(e) => setBallsPerOver(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">City (optional)</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Negombo"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Ground (optional)</label>
            <input
              type="text"
              value={ground}
              onChange={(e) => setGround(e.target.value)}
              placeholder="e.g. Municipal Ground"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Date (optional)</label>
          <input
            type="datetime-local"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Ball Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["tennis", "leather", "other"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBallType(type)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                  ballType === type
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={loading !== null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 active:scale-[0.98]"
          >
            {loading === "next" ? "Starting..." : "Next (Toss)"}
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={loading !== null}
            className="flex-1 bg-slate-800 border border-slate-700 text-white font-medium py-2.5 rounded-lg hover:border-amber-600 transition disabled:opacity-50 active:scale-[0.98]"
          >
            {loading === "schedule" ? "Scheduling..." : "Schedule Match"}
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 pt-1"
        >
          ← Back to squad selection
        </button>
      </div>
    </div>
  );
}
