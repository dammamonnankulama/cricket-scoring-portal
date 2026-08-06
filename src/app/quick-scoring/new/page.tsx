"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuickScoringSetupPage() {
  const router = useRouter();
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [totalOvers, setTotalOvers] = useState(10);
  const [ballsPerOver, setBallsPerOver] = useState(6);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team1Name, team2Name, totalOvers, ballsPerOver }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(`/match/${data.matchId}/toss`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-white inline-block mb-4"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-slate-900 rounded-xl p-5 sm:p-8 border border-slate-800">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Quick Scoring
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Set up your match — no player details needed
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Team 1 Name
                </label>
                <input
                  type="text"
                  required
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder="e.g. Team A"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Team 2 Name
                </label>
                <input
                  type="text"
                  required
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder="e.g. Team B"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Total Overs
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={totalOvers}
                  onChange={(e) => setTotalOvers(Number(e.target.value))}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Balls / Over
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={12}
                  value={ballsPerOver}
                  onChange={(e) => setBallsPerOver(Number(e.target.value))}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Creating match..." : "Proceed to Toss"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
