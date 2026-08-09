"use client";

import { useState } from "react";
import Link from "next/link";
import SquadPicker from "./SquadPicker";

export default function CreateMatchWizard() {
  const [squad1, setSquad1] = useState<any>(null);
  const [squad2, setSquad2] = useState<any>(null);

  const bothSelected = squad1 && squad2;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white inline-block mb-4">
          ← Back to Dashboard
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Create Match</h1>
        <p className="text-sm text-slate-400 mb-6">Select the two squads playing</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SquadPicker label="Team 1" selectedSquad={squad1} onSelect={setSquad1} />
          <SquadPicker label="Team 2" selectedSquad={squad2} onSelect={setSquad2} />
        </div>

        {bothSelected && (
          <div className="mt-6 bg-slate-900 border border-emerald-800 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-4">
              <TeamBadge squad={squad1} />
              <span className="text-slate-500 text-sm">vs</span>
              <TeamBadge squad={squad2} />
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Match parameters (overs, ground, etc.) — coming in Step 26
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamBadge({ squad }: { squad: any }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
        {squad.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={squad.logoUrl} alt={squad.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-500 text-[10px]">No Logo</span>
        )}
      </div>
      <p className="text-white text-sm font-medium mt-2">{squad.name}</p>
    </div>
  );
}
