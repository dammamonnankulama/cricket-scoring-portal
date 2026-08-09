"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReviewScheduledMatch({
  matchId,
  match,
  squad1,
  squad2,
}: {
  matchId: string;
  match: any;
  squad1: any;
  squad2: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/matches/${matchId}/start`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.push(`/match/${matchId}/toss`);
  };

  const dateLabel = match.matchDate
    ? new Date(match.matchDate).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white inline-block mb-4">
          ← Back to Dashboard
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
          <p className="text-amber-400 text-xs uppercase tracking-wide font-medium mb-4">
            Scheduled Match
          </p>

          <div className="flex items-center justify-center gap-4 mb-5">
            <p className="text-white text-sm font-medium">{squad1?.name || match.team1Name}</p>
            <span className="text-slate-500 text-xs">vs</span>
            <p className="text-white text-sm font-medium">{squad2?.name || match.team2Name}</p>
          </div>

          <div className="space-y-1.5 text-sm text-slate-400">
            <p>Overs: {match.totalOvers} ({match.ballsPerOver}/over)</p>
            <p className="capitalize">Ball: {match.ballType}</p>
            {match.ground && <p>Ground: {match.ground}</p>}
            {match.city && <p>City: {match.city}</p>}
            {dateLabel && <p>When: {dateLabel}</p>}
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Starting..." : "Start Toss Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
