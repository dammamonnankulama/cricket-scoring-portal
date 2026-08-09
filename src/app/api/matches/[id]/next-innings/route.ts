import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const match = await Match.findById(id);

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (match.status !== "innings_break") {
    return NextResponse.json({ error: "Match is not at an innings break" }, { status: 409 });
  }
  if (match.innings.length !== 1) {
    return NextResponse.json({ error: "Second innings already exists" }, { status: 409 });
  }

  const firstInnings = match.innings[0];

  // Whoever bowled first now bats, and vice versa
  match.innings.push({
    inningsNumber: 2,
    battingTeam: firstInnings.bowlingTeam,
    bowlingTeam: firstInnings.battingTeam,
    totalRuns: 0,
    wickets: 0,
    completedOvers: 0,
    ballsInCurrentOver: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    fallOfWickets: [],
    deliveries: [],
    isCompleted: false,
    isSquadBased: !!(match.squad1Id && match.squad2Id),
    battingCard: {},
    bowlingCard: {},
  });

  match.currentInningsNumber = 2;
  match.status = "in_progress";

  await match.save();

  return NextResponse.json({ success: true, match: JSON.parse(JSON.stringify(match)) });
}
