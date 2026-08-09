"use client";

import { useState } from "react";
import Link from "next/link";
import SquadPicker from "./SquadPicker";
import MatchParamsForm from "./MatchParamsForm";

export default function CreateMatchWizard() {
  const [squad1, setSquad1] = useState<any>(null);
  const [squad2, setSquad2] = useState<any>(null);
  const [step, setStep] = useState<"squads" | "params">("squads");

  const bothSelected = squad1 && squad2;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white inline-block mb-4">
          ← Back to Dashboard
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Create Match</h1>
        <p className="text-sm text-slate-400 mb-6">
          {step === "squads" ? "Select the two squads playing" : "Set up match details"}
        </p>

        {step === "squads" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SquadPicker label="Team 1" selectedSquad={squad1} onSelect={setSquad1} />
              <SquadPicker label="Team 2" selectedSquad={squad2} onSelect={setSquad2} />
            </div>

            {bothSelected && (
              <button
                onClick={() => setStep("params")}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition active:scale-[0.98]"
              >
                Continue
              </button>
            )}
          </>
        )}

        {step === "params" && bothSelected && (
          <MatchParamsForm squad1={squad1} squad2={squad2} onBack={() => setStep("squads")} />
        )}
      </div>
    </div>
  );
}
