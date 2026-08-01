import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { applyDelivery, checkInningsComplete, DeliveryInput } from "@/lib/scoringEngine";

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
    const input: DeliveryInput = await request.json();

    await connectDB();
    const match = await Match.findById(id);

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (match.status !== "in_progress") {
      return NextResponse.json({ error: "Match is not in progress" }, { status: 409 });
    }

    const inningsIndex = match.currentInningsNumber - 1;
    const currentInnings = match.innings[inningsIndex];

    if (currentInnings.isCompleted) {
      return NextResponse.json({ error: "Current innings is already complete" }, { status: 409 });
    }

    const updated = applyDelivery(currentInnings.toObject(), match.ballsPerOver, input);

    const target =
      match.currentInningsNumber === 2 ? match.innings[0].totalRuns + 1 : null;

    const isComplete = checkInningsComplete(updated, match.totalOvers, target);
    updated.isCompleted = isComplete;

    match.innings[inningsIndex] = updated;

    if (isComplete) {
      if (match.currentInningsNumber === 1) {
        match.status = "innings_break";
      } else {
        match.status = "completed";
        match.result = computeResult(match);
      }
    }

    await match.save();

    return NextResponse.json({
      success: true,
      innings: match.innings[inningsIndex],
      matchStatus: match.status,
    });
  } catch (error) {
    console.error("Add delivery error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function computeResult(match: any): string {
  const first = match.innings[0];
  const second = match.innings[1];

  if (second.totalRuns > first.totalRuns) {
    const wicketsInHand = 10 - second.wickets;
    return `${second.battingTeam} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
  } else if (second.totalRuns < first.totalRuns) {
    const runMargin = first.totalRuns - second.totalRuns;
    return `${first.battingTeam} won by ${runMargin} run${runMargin === 1 ? "" : "s"}`;
  } else {
    return "Match tied";
  }
}
