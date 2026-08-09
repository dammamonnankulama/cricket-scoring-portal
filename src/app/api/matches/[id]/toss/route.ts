import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { tossWinner, tossDecision } = await request.json();

    if (!tossWinner || !["bat", "bowl"].includes(tossDecision)) {
      return NextResponse.json({ error: "Invalid toss data" }, { status: 400 });
    }

    await connectDB();

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (match.status !== "toss_pending") {
      return NextResponse.json({ error: "Toss already completed for this match" }, { status: 409 });
    }
    if (![match.team1Name, match.team2Name].includes(tossWinner)) {
      return NextResponse.json({ error: "Toss winner must be one of the two teams" }, { status: 400 });
    }

    const otherTeam =
      tossWinner === match.team1Name ? match.team2Name : match.team1Name;

    const battingTeam = tossDecision === "bat" ? tossWinner : otherTeam;
    const bowlingTeam = tossDecision === "bat" ? otherTeam : tossWinner;

    match.tossWinner = tossWinner;
    match.tossDecision = tossDecision;
    match.status = "in_progress";
    match.currentInningsNumber = 1;
    match.innings.push({
      inningsNumber: 1,
      battingTeam,
      bowlingTeam,
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

    await match.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Toss error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
