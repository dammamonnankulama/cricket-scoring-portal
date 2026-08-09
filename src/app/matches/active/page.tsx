import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import Link from "next/link";

function resumeHref(match: any) {
  if (match.status === "scheduled") return `/match/${match._id}/review`;
  return match.status === "toss_pending"
    ? `/match/${match._id}/toss`
    : `/match/${match._id}/score`;
}


function resumeStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: "Scheduled",
    toss_pending: "Toss pending",
    in_progress: "In progress",
    innings_break: "Innings break",
  };
  return map[status] || status;
}

export default async function ActiveMatchesPage() {
  const session = await auth();

  await connectDB();
  const matches = await Match.find({
    createdBy: session?.user?.id,
    status: { $in: ["scheduled", "toss_pending", "in_progress", "innings_break"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white inline-block mb-4">
          ← Back to Dashboard
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-6">
          In-Progress Matches
        </h1>

        {matches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">No matches in progress</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match: any) => (
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
        )}
      </div>
    </div>
  );
}
