"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectOpeners({
  matchId,
  battingTeam,
  bowlingTeam,
  battingSquad,
  bowlingSquad,
}: {
  matchId: string;
  battingTeam: string;
  bowlingTeam: string;
  battingSquad: any;
  bowlingSquad: any;
}) {
  const router = useRouter();
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!striker || !nonStriker || !bowler) {
      setError("Select both openers and the opening bowler");
      return;
    }
    if (striker === nonStriker) {
      setError("Striker and non-striker must be different players");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/matches/${matchId}/set-openers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ striker, nonStriker, bowler }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(`/match/${matchId}/score`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Opening Players</h1>
        <p className="text-sm text-slate-400 mb-6">
          {battingTeam} batting first, {bowlingTeam} bowling
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <PlayerSelect
            label={`Striker (${battingTeam})`}
            players={battingSquad?.players || []}
            value={striker}
            onChange={setStriker}
            excludeName={nonStriker}
          />
          <PlayerSelect
            label={`Non-striker (${battingTeam})`}
            players={battingSquad?.players || []}
            value={nonStriker}
            onChange={setNonStriker}
            excludeName={striker}
          />
          <PlayerSelect
            label={`Opening Bowler (${bowlingTeam})`}
            players={bowlingSquad?.players || []}
            value={bowler}
            onChange={setBowler}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Starting..." : "Start Innings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerSelect({
  label,
  players,
  value,
  onChange,
  excludeName,
}: {
  label: string;
  players: { name: string; role: string }[];
  value: string;
  onChange: (v: string) => void;
  excludeName?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">Select player</option>
        {players
          .filter((p) => p.name !== excludeName)
          .map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.role})
            </option>
          ))}
      </select>
    </div>
  );
}
