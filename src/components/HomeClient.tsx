"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1712] transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <BallIcon className="w-10 h-10 text-[#A5333C] animate-pulse motion-reduce:animate-none" />
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[#F3EEE2]">
          SCORER
        </p>
      </div>
    </div>
  );
}

/* ---------- Icons (custom, in-palette, no external images) ---------- */
function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6 6c2 2 2 10 0 12M18 6c-2 2-2 10 0 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="1.5 2"
      />
    </svg>
  );
}
function StopwatchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v4l3 2M9 2h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20V10M12 20V4M20 20v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function UndoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 10h9a6 6 0 110 12h-2M4 10l4-4M4 10l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function StumpsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 4v16M12 4v16M17 4v16M5 4h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Live mock scoreboard (hero signature element) ---------- */
const TICKS = [
  { score: "94/3", overs: "12.4", crr: "7.42", ball: "4" },
  { score: "98/3", overs: "12.5", crr: "7.62", ball: "4" },
  { score: "98/4", overs: "12.6", crr: "7.53", ball: "W" },
  { score: "99/4", overs: "13.1", crr: "7.51", ball: "1" },
  { score: "105/4", overs: "13.2", crr: "7.87", ball: "6" },
];

function MockScoreboard() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % TICKS.length), 2600);
    return () => clearInterval(id);
  }, []);

  const current = TICKS[tick];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#2A4438] bg-[#0F241C] overflow-hidden shadow-2xl shadow-black/40">
      <div className="bg-gradient-to-br from-[#1C4531] via-[#12301F] to-[#0F241C] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="motion-reduce:hidden animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A5333C] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A5333C]" />
          </span>
          <p className="text-[#C9A24B] text-xs tracking-wide uppercase">Live · SUPER YOUTH XI batting</p>
        </div>
        <div className="flex items-end justify-between mt-2">
          <p className="font-[family-name:var(--font-score)] text-4xl font-bold text-[#F3EEE2] tabular-nums">
            {current.score}
          </p>
          <p className="text-[#C9A24B]/80 text-sm font-[family-name:var(--font-score)]">
            ({current.overs}/20)
          </p>
        </div>
      </div>
      <div className="px-5 py-3 flex items-center justify-between border-t border-[#2A4438]/60">
        <div>
          <p className="text-[10px] text-[#7C9188] uppercase tracking-wide">This ball</p>
          <p
            className={`font-[family-name:var(--font-score)] text-lg font-bold ${
              current.ball === "W" ? "text-[#A5333C]" : "text-[#F3EEE2]"
            }`}
          >
            {current.ball}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#7C9188] uppercase tracking-wide">CRR</p>
          <p className="font-[family-name:var(--font-score)] text-lg font-bold text-[#F3EEE2]">
            {current.crr}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#0A1712]/70 border-b border-[#1E3A2C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BallIcon className="w-6 h-6 text-[#A5333C]" />
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[#F3EEE2]">
            SCORER
          </span>
        </Link>
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className="text-sm font-medium bg-[#A5333C] hover:bg-[#8E2C34] text-white px-4 py-2 rounded-lg transition active:scale-95"
        >
          {isLoggedIn ? "Dashboard" : "Login"}
        </Link>
      </div>
    </nav>
  );
}

/* ---------- Main page content ---------- */
export default function HomeClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <LoadingScreen visible={loading} />
      <div className="bg-[#0A1712] min-h-screen">
        <Nav isLoggedIn={isLoggedIn} />

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-wide text-[#F3EEE2]">
                SCORE EVERY BALL.
                <br />
                <span className="text-[#C9A24B]">OWN EVERY OVER.</span>
              </h1>
              <p className="text-[#9FB0A8] text-base sm:text-lg mt-6 max-w-md">
                SCORER turns your phone into a full cricket scorebook — custom overs,
                extras, wickets, and run rate, tracked ball by ball, saved the moment
                it happens.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/signup"}
                  className="bg-[#A5333C] hover:bg-[#8E2C34] text-white font-medium px-6 py-3 rounded-lg transition active:scale-95"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                </Link>
                <Link
                  href={isLoggedIn ? "/quick-scoring/new" : "/login"}
                  className="border border-[#2A4438] hover:border-[#C9A24B] text-[#F3EEE2] font-medium px-6 py-3 rounded-lg transition active:scale-95"
                >
                  {isLoggedIn ? "Start Scoring" : "Login"}
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <MockScoreboard />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 border-t border-[#1E3A2C]">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wide text-[#F3EEE2] mb-10">
              BUILT LIKE A REAL SCOREBOOK
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: StumpsIcon, title: "Custom overs", desc: "Set any overs and balls-per-over — league rules, your rules." },
                { icon: ChartIcon, title: "Live run rate", desc: "CRR and required run rate update after every single ball." },
                { icon: UndoIcon, title: "Reliable undo", desc: "Made a mistake? Undo rebuilds the innings correctly, every time." },
                { icon: ShieldIcon, title: "Nothing lost", desc: "Every ball saves instantly — close the tab, come back anytime." },
              ].map((f) => (
                <div key={f.title} className="bg-[#0F241C] border border-[#1E3A2C] rounded-xl p-5">
                  <f.icon className="w-6 h-6 text-[#C9A24B] mb-3" />
                  <h3 className="text-[#F3EEE2] font-semibold text-sm">{f.title}</h3>
                  <p className="text-[#7C9188] text-xs mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — genuinely sequential, numbering earned */}
        <section className="py-20 px-4 sm:px-6 border-t border-[#1E3A2C]">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wide text-[#F3EEE2] mb-10">
              FROM TOSS TO RESULT
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { n: "01", title: "Set up", desc: "Name the teams, pick overs and balls-per-over." },
                { n: "02", title: "Toss", desc: "Pick the winner, elect to bat or bowl." },
                { n: "03", title: "Score", desc: "Tap through every run, extra, and wicket live." },
                { n: "04", title: "Result", desc: "Full scorecard saved automatically to History." },
              ].map((s) => (
                <div key={s.n}>
                  <p className="font-[family-name:var(--font-score)] text-[#A5333C] text-sm font-bold">{s.n}</p>
                  <h3 className="text-[#F3EEE2] font-semibold mt-1">{s.title}</h3>
                  <p className="text-[#7C9188] text-xs mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 border-t border-[#1E3A2C]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wide text-[#F3EEE2]">
              PICK UP THE BAT. START SCORING.
            </h2>
            <Link
              href={isLoggedIn ? "/dashboard" : "/signup"}
              className="inline-block mt-6 bg-[#A5333C] hover:bg-[#8E2C34] text-white font-medium px-8 py-3 rounded-lg transition active:scale-95"
            >
              {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
            </Link>
          </div>
        </section>

        <footer className="py-8 px-4 sm:px-6 border-t border-[#1E3A2C] text-center">
          <p className="text-[#7C9188] text-xs">SCORER — Cricket scoring, ball by ball.</p>
        </footer>
      </div>
    </>
  );
}