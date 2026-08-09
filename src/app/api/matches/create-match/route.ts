import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import Squad from "@/models/Squad";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    squad1Id,
    squad2Id,
    totalOvers,
    ballsPerOver,
    city,
    ground,
    matchDate,
    ballType,
    schedule,
  } = await request.json();

  if (!squad1Id || !squad2Id) {
    return NextResponse.json({ error: "Both squads are required" }, { status: 400 });
  }
  if (squad1Id === squad2Id) {
    return NextResponse.json({ error: "Squads must be different" }, { status: 400 });
  }
  if (!totalOvers || totalOvers < 1 || !ballsPerOver || ballsPerOver < 1) {
    return NextResponse.json({ error: "Invalid overs configuration" }, { status: 400 });
  }
  if (!["tennis", "leather", "other"].includes(ballType)) {
    return NextResponse.json({ error: "Invalid ball type" }, { status: 400 });
  }

  await connectDB();

  const [squad1, squad2] = await Promise.all([
    Squad.findById(squad1Id).lean(),
    Squad.findById(squad2Id).lean(),
  ]);

  if (!squad1 || !squad2) {
    return NextResponse.json({ error: "One or both squads not found" }, { status: 404 });
  }
  if (
    (squad1 as any).createdBy.toString() !== session.user.id ||
    (squad2 as any).createdBy.toString() !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const match = await Match.create({
    createdBy: session.user.id,
    squad1Id,
    squad2Id,
    team1Name: (squad1 as any).name,
    team2Name: (squad2 as any).name,
    totalOvers,
    ballsPerOver,
    matchType: "limitedOvers",
    city: city || null,
    ground: ground || null,
    matchDate: matchDate ? new Date(matchDate) : null,
    ballType,
    status: schedule ? "scheduled" : "toss_pending",
    innings: [],
  });

  return NextResponse.json({ success: true, matchId: match._id.toString() }, { status: 201 });
}