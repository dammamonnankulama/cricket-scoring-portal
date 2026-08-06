"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TossForm({
  matchId,
  team1Name,
  team2Name,
}: {
  matchId: string;
  team1Name: string;
  team2Name: string;
}) {
  const router = useRouter();
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!tossWinner || !tossDecision) return;
    setError("");
    setLoading(true);

    const res = await fetch(`/api/matches/${matchId}/toss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossWinner, tossDecision }),
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
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 rounded-xl p-5 sm:p-8 border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Match Toss
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {team1Name} vs {team2Name}
        </p>

        <div className="mb-6">
          <p className="text-sm text-slate-300 mb-2">Who won the toss?</p>
          <div className="grid grid-cols-2 gap-3">
            {[team1Name, team2Name].map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setTossWinner(team)}
                className={`rounded-lg border px-3 py-3 text-sm sm:text-base font-medium transition active:scale-[0.98] ${
                  tossWinner === team
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {tossWinner && (
          <div className="mb-6">
            <p className="text-sm text-slate-300 mb-2">
              {tossWinner} elected to
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["bat", "bowl"] as const).map((decision) => (
                <button
                  key={decision}
                  type="button"
                  onClick={() => setTossDecision(decision)}
                  className={`rounded-lg border px-3 py-3 text-sm sm:text-base font-medium capitalize transition active:scale-[0.98] ${
                    tossDecision === decision
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {decision}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="button"
          disabled={!tossWinner || !tossDecision || loading}
          onClick={handleSubmit}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? "Starting match..." : "Start Match"}
        </button>
      </div>
    </div>
  );
}
