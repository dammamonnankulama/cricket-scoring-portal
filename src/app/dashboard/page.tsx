import { auth } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

const tiles = [
  {
    title: "Quick Scoring",
    description: "Start scoring a match right now — no setup required",
    href: "/quick-scoring/new",
    icon: "🏏",
    active: true,
  },
  {
    title: "Create a Match",
    description: "Full setup with squads, playing XI, and player stats",
    href: "/create-match",
    icon: "⚙️",
    active: false,
  },
  {
    title: "Tournaments",
    description: "Manage multi-team tournaments and points tables",
    href: "/tournaments",
    icon: "🏆",
    active: false,
  },
  {
    title: "History",
    description: "View past matches and full scorecards",
    href: "/history",
    icon: "📜",
    active: true,
  },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Cricket Scorer
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {tiles.map((tile) =>
            tile.active ? (
              <Link
                key={tile.title}
                href={tile.href}
                className="group relative flex flex-col justify-between rounded-xl bg-slate-900 border border-slate-800 p-5 sm:p-6 min-h-[140px] transition hover:border-emerald-600 hover:bg-slate-800 active:scale-[0.98]"
              >
                <span className="text-3xl">{tile.icon}</span>
                <div className="mt-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white group-hover:text-emerald-400">
                    {tile.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {tile.description}
                  </p>
                </div>
              </Link>
            ) : (
              <div
                key={tile.title}
                className="relative flex flex-col justify-between rounded-xl bg-slate-900/50 border border-slate-800 p-5 sm:p-6 min-h-[140px] opacity-60 cursor-not-allowed"
              >
                <span className="absolute top-4 right-4 text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <span className="text-3xl">{tile.icon}</span>
                <div className="mt-4">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-300">
                    {tile.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {tile.description}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
