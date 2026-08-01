"use client";

import { useState } from "react";
import { WicketType } from "@/lib/scoringEngine";

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

export default function ScoringPanel({
  matchId,
  match: initialMatch,
}: {
  matchId: string;
  match: any;
}) {
  const [match, setMatch] = useState(initialMatch);
  const [popup, setPopup] = useState<PopupType>(null);
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
      sendDelivery({
        runs: 0,
        extraType: "noball",
        extraRuns: 0,
        isWicket: true,
        wicketType,
      });
    } else {
      sendDelivery({ runs: 0, extraType: "none", extraRuns: 0, isWicket: true, wicketType });
    }
  };

  if (match.status === "innings_break") {
    return <InningsBreakScreen matchId={matchId} match={match} />;
  }

  if (match.status === "completed") {
    return <MatchCompleteScreen match={match} />;
  }

  const oversDisplay = `${innings.completedOvers}.${innings.ballsInCurrentOver}`;

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Score header */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 px-4 py-6 sm:px-6">
        <p className="text-slate-300 text-sm">{innings.battingTeam} batting</p>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-3xl sm:text-4xl font-bold text-white">
            {innings.totalRuns}/{innings.wickets}
          </span>
          <span className="text-slate-300 text-base sm:text-lg mb-1">
            ({oversDisplay}/{match.totalOvers})
          </span>
        </div>
        {match.currentInningsNumber === 2 && (
          <p className="text-slate-400 text-xs mt-1">
            Target: {match.innings[0].totalRuns + 1}
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mt-3 px-4">{error}</p>
      )}

      {/* Button grid */}
      <div className="px-3 sm:px-6 mt-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[0, 1, 2, 3, 4, 6, 5, 7].map((run) => (
            <button
              key={run}
              disabled={loading}
              onClick={() => handleRun(run)}
              className="aspect-square rounded-xl bg-slate-800 border border-slate-700 text-white text-lg sm:text-xl font-bold hover:border-emerald-600 active:scale-95 transition disabled:opacity-40"
            >
              {run}
            </button>
          ))}

          <button
            disabled={loading}
            onClick={() => setPopup("wide")}
            className="aspect-square rounded-xl bg-amber-900/40 border border-amber-700 text-amber-300 text-sm sm:text-base font-bold hover:border-amber-500 active:scale-95 transition disabled:opacity-40"
          >
            WD
          </button>
          <button
            disabled={loading}
            onClick={() => setPopup("noball")}
            className="aspect-square rounded-xl bg-amber-900/40 border border-amber-700 text-amber-300 text-sm sm:text-base font-bold hover:border-amber-500 active:scale-95 transition disabled:opacity-40"
          >
            NB
          </button>
          <button
            disabled={loading}
            onClick={() => setPopup("bye")}
            className="aspect-square rounded-xl bg-blue-900/40 border border-blue-700 text-blue-300 text-sm sm:text-base font-bold hover:border-blue-500 active:scale-95 transition disabled:opacity-40"
          >
            BYE
          </button>
          <button
            disabled={loading}
            onClick={() => setPopup("legbye")}
            className="aspect-square rounded-xl bg-blue-900/40 border border-blue-700 text-blue-300 text-sm sm:text-base font-bold hover:border-blue-500 active:scale-95 transition disabled:opacity-40"
          >
            LB
          </button>

          <button
            disabled={loading}
            onClick={() => {
              setPendingWicketFrom("direct");
              setPopup("wicket");
            }}
            className="aspect-square rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm sm:text-base font-bold hover:border-red-500 active:scale-95 transition disabled:opacity-40"
          >
            OUT
          </button>
          <button
            disabled={loading || innings.deliveries.length === 0}
            onClick={handleUndo}
            className="aspect-square rounded-xl bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm font-bold hover:border-slate-500 active:scale-95 transition disabled:opacity-40"
          >
            UNDO
          </button>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="px-3 sm:px-6 mt-6">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Shortcuts</p>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={loading}
            onClick={() => sendDelivery({ runs: 0, extraType: "none", extraRuns: 5, isWicket: false })}
            className="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:border-slate-600 active:scale-95 transition disabled:opacity-40"
          >
            Give Penalty (+5)
          </button>
          <EndInningsButton matchId={matchId} onDone={setMatch} />
        </div>
      </div>

      {/* Popups */}
      {popup === "wide" && (
        <ExtraPopup
          title="Wide"
          options={[0, 1, 2, 3, 4, 6]}
          optionLabel={(n) => `WD+${n}`}
          onSelect={(n) =>
            sendDelivery({ runs: 0, extraType: "wide", extraRuns: n, isWicket: false })
          }
          onClose={() => setPopup(null)}
        />
      )}
      {popup === "bye" && (
        <ExtraPopup
          title="Bye"
          options={[1, 2, 3, 4]}
          optionLabel={(n) => `B+${n}`}
          onSelect={(n) =>
            sendDelivery({ runs: 0, extraType: "bye", extraRuns: n, isWicket: false })
          }
          onClose={() => setPopup(null)}
        />
      )}
      {popup === "legbye" && (
        <ExtraPopup
          title="Leg Bye"
          options={[1, 2, 3, 4]}
          optionLabel={(n) => `LB+${n}`}
          onSelect={(n) =>
            sendDelivery({ runs: 0, extraType: "legbye", extraRuns: n, isWicket: false })
          }
          onClose={() => setPopup(null)}
        />
      )}
      {popup === "noball" && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4">No Ball</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    sendDelivery({ runs: 0, extraType: "noball", extraRuns: n, isWicket: false })
                  }
                  className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold hover:border-emerald-600 active:scale-95 transition"
                >
                  NB{n > 0 ? `+${n}` : ""}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPendingWicketFrom("noball");
                setPopup("wicket");
              }}
              className="w-full py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 font-semibold hover:border-red-500 active:scale-95 transition mt-2"
            >
              Wicket (Run Out)
            </button>
            <button
              onClick={() => setPopup(null)}
              className="w-full py-2 mt-3 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {popup === "wicket" && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4">Dismissal Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {WICKET_TYPES.map((w) => (
                <button
                  key={w.value}
                  onClick={() => handleWicketType(w.value)}
                  className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:border-red-500 active:scale-95 transition"
                >
                  {w.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPopup(null);
                setPendingWicketFrom(null);
              }}
              className="w-full py-2 mt-4 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExtraPopup({
  title,
  options,
  optionLabel,
  onSelect,
  onClose,
}: {
  title: string;
  options: number[];
  optionLabel: (n: number) => string;
  onSelect: (n: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-5">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
          {options.map((n) => (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className="py-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold hover:border-emerald-600 active:scale-95 transition"
            >
              {optionLabel(n)}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 mt-3 text-sm text-slate-400 hover:text-white">
          Cancel
        </button>
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
        <button
          onClick={handleEnd}
          className="text-sm bg-red-700 text-white px-3 py-2 rounded-lg active:scale-95 transition"
        >
          Confirm End Innings
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg active:scale-95 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:border-red-600 active:scale-95 transition"
    >
      End Innings
    </button>
  );
}

function InningsBreakScreen({ matchId, match }: { matchId: string; match: any }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <p className="text-white">Innings break — summary screen coming in Step 22</p>
    </div>
  );
}

function MatchCompleteScreen({ match }: { match: any }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <p className="text-white">{match.result}</p>
    </div>
  );
}
