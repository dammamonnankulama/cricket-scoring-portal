import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();

  await connectDB();
  const matches = await Match.find({
    createdBy: session?.user?.id,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white inline-block mb-4">
          ← Back to Dashboard
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-6">Match History</h1>

        {matches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">No completed matches yet</p>
            <Link
              href="/quick-scoring/new"
              className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Start your first match →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <MatchCard key={match._id.toString()} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const first = match.innings[0];
  const second = match.innings[1];
  const date = new Date(match.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/match/${match._id}/score`}
      className="block bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-emerald-600 transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">{date}</p>
        <p className="text-xs text-slate-500">
          {match.totalOvers} overs · {match.ballsPerOver}/over
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">{first.battingTeam}</span>
          <span className="text-slate-300 text-sm">
            {first.totalRuns}/{first.wickets}{" "}
            <span className="text-slate-500 text-xs">
              ({first.completedOvers}.{first.ballsInCurrentOver})
            </span>
          </span>
        </div>
        {second && (
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">{second.battingTeam}</span>
            <span className="text-slate-300 text-sm">
              {second.totalRuns}/{second.wickets}{" "}
              <span className="text-slate-500 text-xs">
                ({second.completedOvers}.{second.ballsInCurrentOver})
              </span>
            </span>
          </div>
        )}
      </div>

      <p className="text-emerald-400 text-xs font-medium mt-3">{match.result}</p>
    </Link>
  );
}
