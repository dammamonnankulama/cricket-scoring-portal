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

  const inningsIndex = match.currentInningsNumber - 1;
  match.innings[inningsIndex].isCompleted = true;

  if (match.currentInningsNumber === 1) {
    match.status = "innings_break";
  } else {
    match.status = "completed";
    const first = match.innings[0];
    const second = match.innings[1];
    if (second.totalRuns > first.totalRuns) {
      match.result = `${second.battingTeam} won by ${10 - second.wickets} wickets`;
    } else if (second.totalRuns < first.totalRuns) {
      match.result = `${first.battingTeam} won by ${first.totalRuns - second.totalRuns} runs`;
    } else {
      match.result = "Match tied";
    }
  }

  await match.save();

  return NextResponse.json({ success: true, matchStatus: match.status });
}
