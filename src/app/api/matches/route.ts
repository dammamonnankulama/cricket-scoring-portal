import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { team1Name, team2Name, totalOvers, ballsPerOver } = await request.json();

    if (!team1Name?.trim() || !team2Name?.trim()) {
      return NextResponse.json({ error: "Both team names are required" }, { status: 400 });
    }
    if (team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase()) {
      return NextResponse.json({ error: "Team names must be different" }, { status: 400 });
    }
    if (!totalOvers || totalOvers < 1) {
      return NextResponse.json({ error: "Overs must be at least 1" }, { status: 400 });
    }
    if (!ballsPerOver || ballsPerOver < 1) {
      return NextResponse.json({ error: "Balls per over must be at least 1" }, { status: 400 });
    }

    await connectDB();

    const match = await Match.create({
      createdBy: session.user.id,
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      totalOvers,
      ballsPerOver,
      status: "toss_pending",
      innings: [],
    });

    return NextResponse.json({ success: true, matchId: match._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Create match error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
