"use client";

import { useEffect, useState } from "react";
import SquadForm from "./SquadForm";

export default function SquadPicker({
  label,
  selectedSquad,
  onSelect,
}: {
  label: string;
  selectedSquad: any | null;
  onSelect: (squad: any) => void;
}) {
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "manage" | null>(null);

  const loadSquads = async () => {
    setLoading(true);
    const res = await fetch("/api/squads");
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSquads(data.squads);
  };

  useEffect(() => {
    loadSquads();
  }, []);

  const handleSaved = (squad: any) => {
    setFormMode(null);
    loadSquads();
    onSelect(squad);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-sm text-slate-400 mb-3">{label}</p>

      {selectedSquad ? (
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {selectedSquad.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedSquad.logoUrl} alt={selectedSquad.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500 text-[10px]">No Logo</span>
              )}
            </div>
            <div>
              <p className="text-white font-medium">{selectedSquad.name}</p>
              <p className="text-slate-500 text-xs">{selectedSquad.players.length} players</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFormMode("manage")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Manage Squad
            </button>
            <button
              onClick={() => { onSelect(null); setShowList(true); }}
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowList(true)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium py-2.5 rounded-lg hover:border-emerald-600 transition"
          >
            Select Squad
          </button>
        </div>
      )}

      {showList && !selectedSquad && (
        <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
          {loading && <p className="text-slate-500 text-xs">Loading squads...</p>}
          {!loading && squads.length === 0 && (
            <p className="text-slate-500 text-xs">No squads yet — create one below.</p>
          )}
          {squads.map((s) => (
            <button
              key={s._id}
              onClick={() => { onSelect(s); setShowList(false); }}
              className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-lg p-2.5 transition text-left"
            >
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 text-[9px]">Logo</span>
                )}
              </div>
              <div>
                <p className="text-white text-sm">{s.name}</p>
                <p className="text-slate-500 text-xs">{s.players.length} players</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => setFormMode("create")}
            className="w-full text-emerald-400 hover:text-emerald-300 text-sm font-medium py-2"
          >
            + Create New Squad
          </button>
        </div>
      )}

      {formMode && (
        <SquadForm
          existingSquad={formMode === "manage" ? selectedSquad : undefined}
          onSaved={handleSaved}
          onCancel={() => setFormMode(null)}
        />
      )}
    </div>
  );
}
