import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
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

function resumeHref(match: any) {
  return match.status === "toss_pending"
    ? `/match/${match._id}/toss`
    : `/match/${match._id}/score`;
}

function resumeStatusLabel(status: string) {
  const map: Record<string, string> = {
    toss_pending: "Toss pending",
    in_progress: "In progress",
    innings_break: "Innings break",
  };
  return map[status] || status;
}

export default async function DashboardPage() {
  const session = await auth();

  await connectDB();
  const inProgressMatches = await Match.find({
    createdBy: session?.user?.id,
    status: { $in: ["toss_pending", "in_progress", "innings_break"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Cricket Scorer</h1>
            <p className="text-sm text-slate-400 mt-0.5">Welcome back, {session?.user?.name}</p>
          </div>
          <SignOutButton />
        </div>

        {inProgressMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Continue Match
              </h2>
              {inProgressMatches.length > 3 && (
                <Link
                  href="/matches/active"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  View All ({inProgressMatches.length})
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {inProgressMatches.slice(0, 3).map((match: any) => (
                <Link
                  key={match._id.toString()}
                  href={resumeHref(match)}
                  className="flex items-center justify-between bg-slate-900 border border-amber-700/50 rounded-xl p-4 hover:border-amber-500 transition active:scale-[0.99]"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {match.team1Name} vs {match.team2Name}
                    </p>
                    <p className="text-amber-400 text-xs mt-0.5">
                      {resumeStatusLabel(match.status)}
                    </p>
                  </div>
                  <span className="text-emerald-400 text-sm font-medium">Resume →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
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
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{tile.description}</p>
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
                  <h2 className="text-base sm:text-lg font-semibold text-slate-300">{tile.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{tile.description}</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
