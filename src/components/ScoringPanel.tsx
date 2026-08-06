"use client";

import { useState } from "react";
import { WicketType } from "@/lib/scoringEngine";
import Link from "next/link";

const WICKET_TYPES: { value: WicketType; label: string }[] = [
  { value: "bowled", label: "Bowled" },
  { value: "caught", label: "Caught" },
  { value: "caughtBehind", label: "Caught Behind" },
  { value: "caughtAndBowled", label: "Caught & Bowled" },
  { value: "runOut", label: "Run Out" },
  { value: "lbw", label: "LBW" },
  { value: "stumped", label: "Stumped" },
  { value: "retiredHurt", label: "Retired Hurt" },
];

type PopupType = "wide" | "noball" | "bye" | "legbye" | "wicket" | null;

function calculateCRR(totalRuns: number, completedOvers: number, ballsInCurrentOver: number, ballsPerOver: number) {
  const oversFaced = completedOvers + ballsInCurrentOver / ballsPerOver;
  if (oversFaced === 0) return "0.00";
  return (totalRuns / oversFaced).toFixed(2);
}

function calculateChaseInfo(
  target: number,
  totalRuns: number,
  completedOvers: number,
  ballsInCurrentOver: number,
  ballsPerOver: number,
  totalOvers: number
) {
  const runsNeeded = target - totalRuns;
  const ballsBowled = completedOvers * ballsPerOver + ballsInCurrentOver;
  const totalBalls = totalOvers * ballsPerOver;
  const ballsRemaining = totalBalls - ballsBowled;

  const oversRemaining = ballsRemaining / ballsPerOver;
  const rrr = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : "0.00";

  return { runsNeeded, ballsRemaining, rrr };
}

function ballLabel(d: any): string {
  if (d.isWicket) return "W";
  if (d.extraType === "wide") return d.extraRuns > 0 ? `Wd+${d.extraRuns}` : "Wd";
  if (d.extraType === "noball") return d.extraRuns > 0 ? `Nb+${d.extraRuns}` : "Nb";
  if (d.extraType === "bye") return `B${d.extraRuns}`;
  if (d.extraType === "legbye") return `Lb${d.extraRuns}`;
  if (d.runs === 0) return "•";
  return String(d.runs);
}

function ballColor(d: any): string {
  if (d.isWicket) return "bg-red-600 text-white";
  if (d.extraType === "wide" || d.extraType === "noball") return "bg-amber-600 text-white";
  if (d.extraType === "bye" || d.extraType === "legbye") return "bg-blue-600 text-white";
  if (d.runs === 4 || d.runs === 6) return "bg-emerald-600 text-white";
  if (d.runs === 0) return "bg-slate-700 text-slate-300";
  return "bg-slate-600 text-white";
}

function groupCompletedOvers(deliveries: any[], completedOvers: number) {
  const overs: { overNumber: number; balls: any[]; runs: number }[] = [];
  for (let i = 0; i < completedOvers; i++) {
    const balls = deliveries.filter((d) => d.overNumber === i);
    const runs = balls.reduce((sum, d) => {
      if (d.extraType === "wide" || d.extraType === "noball") return sum + 1 + d.extraRuns;
      if (d.extraType === "bye" || d.extraType === "legbye") return sum + d.extraRuns;
      return sum + d.runs;
    }, 0);
    overs.push({ overNumber: i, balls, runs });
  }
  return overs;
}

export default function ScoringPanel({
  matchId,
  match: initialMatch,
}: {
  matchId: string;
  match: any;
}) {
  const [match, setMatch] = useState(initialMatch);
  const [popup, setPopup] = useState<PopupType>(null);
  const [showAllOvers, setShowAllOvers] = useState(false);
  const [pendingWicketFrom, setPendingWicketFrom] = useState<"direct" | "noball" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const innings = match.innings[match.currentInningsNumber - 1];

  const sendDelivery = async (input: any) => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/matches/${matchId}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    setLoading(false);
    setPopup(null);
    setPendingWicketFrom(null);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setMatch((prev: any) => {
      const updated = { ...prev, status: data.matchStatus };
      updated.innings = [...prev.innings];
      updated.innings[prev.currentInningsNumber - 1] = data.innings;
      return updated;
    });
  };

  const handleUndo = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/matches/${matchId}/undo`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setMatch((prev: any) => {
      const updated = { ...prev, status: "in_progress" };
      updated.innings = [...prev.innings];
      updated.innings[prev.currentInningsNumber - 1] = data.innings;
      return updated;
    });
  };

  const handleRun = (runs: number) => {
    sendDelivery({ runs, extraType: "none", extraRuns: 0, isWicket: false });
  };

  const handleWicketType = (wicketType: WicketType) => {
    if (pendingWicketFrom === "noball") {
      sendDelivery({ runs: 0, extraType: "noball", extraRuns: 0, isWicket: true, wicketType });
    } else {
      sendDelivery({ runs: 0, extraType: "none", extraRuns: 0, isWicket: true, wicketType });
    }
  };

  if (match.status === "innings_break") {
    return <InningsBreakScreen matchId={matchId} match={match} onDone={setMatch} />;
  }
  if (match.status === "completed") {
    return <MatchCompleteScreen match={match} />;
  }

  const oversDisplay = `${innings.completedOvers}.${innings.ballsInCurrentOver}`;
  const lastOver = groupCompletedOvers(innings.deliveries, innings.completedOvers).slice(-1)[0];
  const allOvers = groupCompletedOvers(innings.deliveries, innings.completedOvers).reverse();
  const crr = calculateCRR(innings.totalRuns, innings.completedOvers, innings.ballsInCurrentOver, match.ballsPerOver);
  const currentOverBalls = innings.deliveries.filter((d: any) => d.overNumber === innings.completedOvers);

  const runBtn = "rounded-lg bg-slate-800 border border-slate-700 text-white font-bold hover:border-emerald-600 active:scale-95 transition disabled:opacity-40 py-3.5 text-base";

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Score header — bigger, highlighted */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 px-4 py-5 sm:px-6 sm:py-7 shadow-lg">
        <p className="text-emerald-200 text-sm font-medium">{innings.battingTeam} batting</p>
        <div className="flex items-end justify-between mt-1 flex-wrap gap-2">
          <div className="flex items-end gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold text-white leading-none">
              {innings.totalRuns}/{innings.wickets}
            </span>
            <span className="text-slate-200 text-lg sm:text-xl mb-1">
              ({oversDisplay}/{match.totalOvers})
            </span>
          </div>
          <div className="bg-black/25 rounded-lg px-3 py-1.5">
            <p className="text-[10px] text-emerald-200 uppercase tracking-wide">CRR</p>
            <p className="text-white font-bold text-lg leading-none">{crr}</p>
          </div>
        </div>
        {match.currentInningsNumber === 2 && (() => {
          const target = match.innings[0].totalRuns + 1;
          const { runsNeeded, ballsRemaining, rrr } = calculateChaseInfo(
            target,
            innings.totalRuns,
            innings.completedOvers,
            innings.ballsInCurrentOver,
            match.ballsPerOver,
            match.totalOvers
          );

          return (
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-white text-sm font-medium bg-black/25 rounded-lg px-3 py-1.5">
                {runsNeeded > 0
                  ? `${runsNeeded} runs needed in ${ballsRemaining} ball${ballsRemaining === 1 ? "" : "s"}`
                  : "Target reached"}
              </p>
              <div className="bg-black/25 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-emerald-200 uppercase tracking-wide">RRR</p>
                <p className="text-white font-bold text-sm leading-none">{rrr}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* This-over ball sequence */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">This Over</p>
        <div className="flex gap-2 overflow-x-auto">
          {currentOverBalls.length === 0 && (
            <span className="text-slate-600 text-sm">No balls yet</span>
          )}
          {currentOverBalls.map((d: any, i: number) => (
            <span
              key={i}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${ballColor(d)}`}
            >
              {ballLabel(d)}
            </span>
          ))}
        </div>
      </div>

      {lastOver && (
        <div className="px-4 sm:px-6 py-3 bg-slate-900/60 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Last Over</p>
            <button
              onClick={() => setShowAllOvers(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
            >
              View All Overs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-12 flex-shrink-0">
              Ov {lastOver.overNumber + 1}
            </span>
            <div className="flex gap-1.5 overflow-x-auto flex-1">
              {lastOver.balls.map((d: any, i: number) => (
                <span
                  key={i}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${ballColor(d)}`}
                >
                  {ballLabel(d)}
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-300 font-semibold flex-shrink-0 w-6 text-right">
              {lastOver.runs}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center mt-3 px-4">{error}</p>}

      {/* Compact button grid */}
      <div className="px-3 sm:px-6 mt-4">
        <div className="grid grid-cols-4 gap-2">
          <button disabled={loading} onClick={() => handleRun(0)} className={runBtn}>0</button>
          <button disabled={loading} onClick={() => handleRun(1)} className={runBtn}>1</button>
          <button disabled={loading} onClick={() => handleRun(2)} className={runBtn}>2</button>
          <button
            disabled={loading || innings.deliveries.length === 0}
            onClick={handleUndo}
            className="rounded-lg bg-slate-800 border border-slate-700 text-teal-400 font-bold text-sm hover:border-teal-600 active:scale-95 transition disabled:opacity-40"
          >
            UNDO
          </button>

          <button disabled={loading} onClick={() => handleRun(3)} className={runBtn}>3</button>
          <button disabled={loading} onClick={() => handleRun(4)} className={runBtn}>4</button>
          <button disabled={loading} onClick={() => handleRun(6)} className={runBtn}>6</button>
          <div className="grid grid-rows-2 gap-2">
            <button disabled={loading} onClick={() => handleRun(5)} className="rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold active:scale-95 transition disabled:opacity-40">5</button>
            <button disabled={loading} onClick={() => handleRun(7)} className="rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold active:scale-95 transition disabled:opacity-40">7</button>
          </div>
        </div>

        {/* Extras row — slimmer */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <button disabled={loading} onClick={() => setPopup("wide")} className="rounded-lg bg-amber-900/30 border border-amber-800 text-amber-300 text-sm font-semibold py-2.5 hover:border-amber-600 active:scale-95 transition disabled:opacity-40">WD</button>
          <button disabled={loading} onClick={() => setPopup("noball")} className="rounded-lg bg-amber-900/30 border border-amber-800 text-amber-300 text-sm font-semibold py-2.5 hover:border-amber-600 active:scale-95 transition disabled:opacity-40">NB</button>
          <button disabled={loading} onClick={() => setPopup("bye")} className="rounded-lg bg-blue-900/30 border border-blue-800 text-blue-300 text-sm font-semibold py-2.5 hover:border-blue-600 active:scale-95 transition disabled:opacity-40">BYE</button>
          <button disabled={loading} onClick={() => setPopup("legbye")} className="rounded-lg bg-blue-900/30 border border-blue-800 text-blue-300 text-sm font-semibold py-2.5 hover:border-blue-600 active:scale-95 transition disabled:opacity-40">LB</button>
        </div>

        {/* OUT — prominent, full width */}
        <button
          disabled={loading}
          onClick={() => { setPendingWicketFrom("direct"); setPopup("wicket"); }}
          className="w-full mt-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 font-bold py-2.5 hover:border-red-500 active:scale-95 transition disabled:opacity-40"
        >
          OUT
        </button>
      </div>

      {/* Shortcuts */}
      <div className="px-3 sm:px-6 mt-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Shortcuts</p>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={loading}
            onClick={() => sendDelivery({ runs: 0, extraType: "none", extraRuns: 5, isWicket: false })}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:border-slate-600 active:scale-95 transition disabled:opacity-40"
          >
            Give Penalty (+5)
          </button>
          <EndInningsButton matchId={matchId} onDone={setMatch} />
        </div>
      </div>

      {/* Popups */}
      {popup === "wide" && (
        <ExtraPopup title="Wide" options={[0, 1, 2, 3, 4, 6]} optionLabel={(n) => `WD+${n}`}
          onSelect={(n) => sendDelivery({ runs: 0, extraType: "wide", extraRuns: n, isWicket: false })}
          onClose={() => setPopup(null)} />
      )}
      {popup === "bye" && (
        <ExtraPopup title="Bye" options={[1, 2, 3, 4]} optionLabel={(n) => `B+${n}`}
          onSelect={(n) => sendDelivery({ runs: 0, extraType: "bye", extraRuns: n, isWicket: false })}
          onClose={() => setPopup(null)} />
      )}
      {popup === "legbye" && (
        <ExtraPopup title="Leg Bye" options={[1, 2, 3, 4]} optionLabel={(n) => `LB+${n}`}
          onSelect={(n) => sendDelivery({ runs: 0, extraType: "legbye", extraRuns: n, isWicket: false })}
          onClose={() => setPopup(null)} />
      )}
      {popup === "noball" && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4">No Ball</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 6].map((n) => (
                <button key={n} onClick={() => sendDelivery({ runs: 0, extraType: "noball", extraRuns: n, isWicket: false })}
                  className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold hover:border-emerald-600 active:scale-95 transition">
                  NB{n > 0 ? `+${n}` : ""}
                </button>
              ))}
            </div>
            <button onClick={() => { setPendingWicketFrom("noball"); setPopup("wicket"); }}
              className="w-full py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 font-semibold hover:border-red-500 active:scale-95 transition mt-2">
              Wicket (Run Out)
            </button>
            <button onClick={() => setPopup(null)} className="w-full py-2 mt-3 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
      {popup === "wicket" && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4">Dismissal Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {WICKET_TYPES.map((w) => (
                <button key={w.value} onClick={() => handleWicketType(w.value)}
                  className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:border-red-500 active:scale-95 transition">
                  {w.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setPopup(null); setPendingWicketFrom(null); }}
              className="w-full py-2 mt-4 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* View All Overs modal */}
      {showAllOvers && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">All Overs — {innings.battingTeam}</h3>
              <button onClick={() => setShowAllOvers(false)} className="text-slate-400 hover:text-white text-sm">
                Close
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto">
              {allOvers.length === 0 && (
                <p className="text-slate-500 text-sm">No completed overs yet.</p>
              )}
              {allOvers.map((over) => (
                <div key={over.overNumber} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-12 flex-shrink-0">
                    Ov {over.overNumber + 1}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto flex-1">
                    {over.balls.map((d: any, i: number) => (
                      <span
                        key={i}
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${ballColor(d)}`}
                      >
                        {ballLabel(d)}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-300 font-semibold flex-shrink-0 w-6 text-right">
                    {over.runs}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExtraPopup({ title, options, optionLabel, onSelect, onClose }: {
  title: string; options: number[]; optionLabel: (n: number) => string;
  onSelect: (n: number) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
          {options.map((n) => (
            <button key={n} onClick={() => onSelect(n)}
              className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold hover:border-emerald-600 active:scale-95 transition">
              {optionLabel(n)}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 mt-3 text-sm text-slate-400 hover:text-white">Cancel</button>
      </div>
    </div>
  );
}

function EndInningsButton({ matchId, onDone }: { matchId: string; onDone: (m: any) => void }) {
  const [confirming, setConfirming] = useState(false);

  const handleEnd = async () => {
    const res = await fetch(`/api/matches/${matchId}/end-innings`, { method: "POST" });
    const data = await res.json();
    if (res.ok) onDone((prev: any) => ({ ...prev, status: data.matchStatus }));
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={handleEnd} className="text-xs bg-red-700 text-white px-3 py-2 rounded-lg active:scale-95 transition">Confirm End Innings</button>
        <button onClick={() => setConfirming(false)} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg active:scale-95 transition">Cancel</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:border-red-600 active:scale-95 transition">
      End Innings
    </button>
  );
}

function InningsBreakScreen({
  matchId,
  match,
  onDone,
}: {
  matchId: string;
  match: any;
  onDone: (m: any) => void;
}) {
  const innings = match.innings[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartNext = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/matches/${matchId}/next-innings`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    onDone(data.match);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-white mb-1">Innings Complete</h1>
        <p className="text-sm text-slate-400 mb-6">End of 1st Innings</p>

        <InningsSummaryCard innings={innings} totalOvers={match.totalOvers} />

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <button
          onClick={handleStartNext}
          disabled={loading}
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Starting..." : "Start Next Innings"}
        </button>
      </div>
    </div>
  );
}


function MatchCompleteScreen({ match }: { match: any }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-4xl">🏆</span>
          <h1 className="text-xl font-bold text-white mt-2">{match.result}</h1>
        </div>

        <div className="space-y-4">
          <InningsSummaryCard innings={match.innings[0]} totalOvers={match.totalOvers} />
          <InningsSummaryCard innings={match.innings[1]} totalOvers={match.totalOvers} />
        </div>

        <Link
          href="/dashboard"
          className="block text-center w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition active:scale-[0.98]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function InningsSummaryCard({ innings, totalOvers }: { innings: any; totalOvers: number }) {
  const oversDisplay = `${innings.completedOvers}.${innings.ballsInCurrentOver}`;
  const totalExtras =
    innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <p className="text-slate-400 text-sm">{innings.battingTeam}</p>
      <p className="text-3xl font-extrabold text-white mt-1">
        {innings.totalRuns}/{innings.wickets}
        <span className="text-base font-normal text-slate-400 ml-2">
          ({oversDisplay}/{totalOvers} ov)
        </span>
      </p>

      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
        <div className="bg-slate-800 rounded-lg py-2">
          <p className="text-[10px] text-slate-500 uppercase">WD</p>
          <p className="text-white text-sm font-semibold">{innings.extras.wides}</p>
        </div>
        <div className="bg-slate-800 rounded-lg py-2">
          <p className="text-[10px] text-slate-500 uppercase">NB</p>
          <p className="text-white text-sm font-semibold">{innings.extras.noBalls}</p>
        </div>
        <div className="bg-slate-800 rounded-lg py-2">
          <p className="text-[10px] text-slate-500 uppercase">B</p>
          <p className="text-white text-sm font-semibold">{innings.extras.byes}</p>
        </div>
        <div className="bg-slate-800 rounded-lg py-2">
          <p className="text-[10px] text-slate-500 uppercase">LB</p>
          <p className="text-white text-sm font-semibold">{innings.extras.legByes}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">Total extras: {totalExtras}</p>

      {innings.fallOfWickets.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Fall of Wickets</p>
          <div className="space-y-1">
            {innings.fallOfWickets.map((fow: any) => (
              <p key={fow.wicketNumber} className="text-xs text-slate-300">
                {fow.wicketNumber}-{fow.teamScore} ({fow.overs} ov, {formatWicketType(fow.wicketType)})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatWicketType(type: string) {
  const map: Record<string, string> = {
    bowled: "Bowled",
    caught: "Caught",
    caughtBehind: "Caught Behind",
    caughtAndBowled: "Caught & Bowled",
    runOut: "Run Out",
    lbw: "LBW",
    stumped: "Stumped",
    retiredHurt: "Retired Hurt",
  };
  return map[type] || type;
}
