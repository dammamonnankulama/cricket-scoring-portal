import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { recomputeInnings } from "@/lib/scoringEngine";

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
    await connectDB();
    const match = await Match.findById(id);

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const inningsIndex = match.currentInningsNumber - 1;
    const currentInnings = match.innings[inningsIndex];

    if (currentInnings.deliveries.length === 0) {
      return NextResponse.json({ error: "No deliveries to undo" }, { status: 409 });
    }

    const remainingDeliveries = currentInnings.deliveries.slice(0, -1);
    const rebuilt = recomputeInnings(
      remainingDeliveries,
      match.ballsPerOver,
      currentInnings.battingTeam,
      currentInnings.bowlingTeam,
      currentInnings.inningsNumber
    );

    match.innings[inningsIndex] = rebuilt;
    match.status = "in_progress";

    await match.save();

    return NextResponse.json({ success: true, innings: match.innings[inningsIndex] });
  } catch (error) {
    console.error("Undo error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
