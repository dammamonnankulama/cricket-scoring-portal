"use client";

import { useState } from "react";
import { PlayerRole } from "@/models/Squad";

type Player = { name: string; role: PlayerRole };

const ROLES: { value: PlayerRole; label: string }[] = [
  { value: "batsman", label: "Batsman" },
  { value: "bowler", label: "Bowler" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
  { value: "allrounder", label: "All-rounder" },
];

export default function SquadForm({
  existingSquad,
  onSaved,
  onCancel,
}: {
  existingSquad?: any;
  onSaved: (squad: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existingSquad?.name || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(existingSquad?.logoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [players, setPlayers] = useState<Player[]>(existingSquad?.players || []);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>("batsman");
  const [captain, setCaptain] = useState(existingSquad?.defaultCaptainName || "");
  const [keeper, setKeeper] = useState(existingSquad?.defaultWicketkeeperName || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setLogoUrl(data.url);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    if (players.length >= 15) {
      setError("A squad can have at most 15 players");
      return;
    }
    setPlayers([...players, { name: newPlayerName.trim(), role: newPlayerRole }]);
    setNewPlayerName("");
    setError("");
  };

  const removePlayer = (index: number) => {
    const removed = players[index];
    setPlayers(players.filter((_, i) => i !== index));
    if (captain === removed.name) setCaptain("");
    if (keeper === removed.name) setKeeper("");
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Squad name is required");
    if (players.length === 0) return setError("Add at least one player");

    setSaving(true);
    const payload = {
      name,
      logoUrl,
      players,
      defaultCaptainName: captain || null,
      defaultWicketkeeperName: keeper || null,
    };

    const res = existingSquad
      ? await fetch(`/api/squads/${existingSquad._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/squads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    onSaved(data.squad);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4 py-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 p-5 max-h-[90vh] flex flex-col">
        <h3 className="text-white font-semibold mb-4">
          {existingSquad ? "Manage Squad" : "Create New Squad"}
        </h3>

        <div className="overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Squad logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500 text-xs">Logo</span>
              )}
            </div>
            <label className="text-sm text-emerald-400 hover:text-emerald-300 cursor-pointer">
              {uploading ? "Uploading..." : "Upload logo"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Squad Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Players ({players.length}/15)
            </label>
            <div className="space-y-1.5 mb-3">
              {players.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-white text-sm">
                    {p.name} <span className="text-slate-500 text-xs">· {p.role}</span>
                  </span>
                  <button onClick={() => removePlayer(i)} className="text-red-400 hover:text-red-300 text-xs">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {players.length < 15 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value as PlayerRole)}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-2 text-white text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  onClick={addPlayer}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 rounded-lg transition"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {players.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Captain</label>
                <select
                  value={captain}
                  onChange={(e) => setCaptain(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-2 text-white text-sm"
                >
                  <option value="">Not set</option>
                  {players.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Wicketkeeper</label>
                <select
                  value={keeper}
                  onChange={(e) => setKeeper(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-2 text-white text-sm"
                >
                  <option value="">Not set</option>
                  {players.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Squad"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
