import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { applyDelivery, checkInningsComplete, deriveNextFacing, DeliveryInput } from "@/lib/scoringEngine";

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
    const body = await request.json();
    const { newBatterName, newBowlerName, ...input } = body as DeliveryInput & {
      newBatterName?: string;
      newBowlerName?: string;
    };

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
    const currentInnings = match.innings[inningsIndex].toObject();

    if (currentInnings.isCompleted) {
      return NextResponse.json({ error: "Current innings is already complete" }, { status: 409 });
    }

    if (currentInnings.isSquadBased) {
      if (currentInnings.deliveries.length === 0) {
        if (!currentInnings.openingStriker || !currentInnings.openingNonStriker || !currentInnings.openingBowler) {
          return NextResponse.json({ error: "Opening players have not been set" }, { status: 409 });
        }
        input.strikerName = currentInnings.openingStriker;
        input.nonStrikerName = currentInnings.openingNonStriker;
        input.bowlerName = currentInnings.openingBowler;
      } else {
        const facing = deriveNextFacing(currentInnings);

        if (facing.needsNewBatter) {
          if (!newBatterName) {
            return NextResponse.json({ error: "A new batter must be selected" }, { status: 400 });
          }
          input.strikerName = facing.striker || newBatterName;
          input.nonStrikerName = facing.striker ? newBatterName : facing.nonStriker;
        } else {
          input.strikerName = facing.striker;
          input.nonStrikerName = facing.nonStriker;
        }

        if (facing.needsNewBowler) {
          if (!newBowlerName) {
            return NextResponse.json({ error: "A new bowler must be selected" }, { status: 400 });
          }
          if (newBowlerName === facing.previousBowlerName) {
            return NextResponse.json({ error: "The same bowler cannot bowl consecutive overs" }, { status: 400 });
          }
          input.bowlerName = newBowlerName;
        } else {
          input.bowlerName = facing.bowler;
        }
      }
    }

    const updated = applyDelivery(currentInnings, match.ballsPerOver, input);

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
  } catch (error: any) {
    console.error("Add delivery error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
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
