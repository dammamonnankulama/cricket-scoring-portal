import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { striker, nonStriker, bowler } = await request.json();

  if (!striker || !nonStriker || !bowler) {
    return NextResponse.json({ error: "Striker, non-striker, and bowler are all required" }, { status: 400 });
  }
  if (striker === nonStriker) {
    return NextResponse.json({ error: "Striker and non-striker must be different players" }, { status: 400 });
  }

  await connectDB();
  const match = await Match.findById(id);

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inningsIndex = match.currentInningsNumber - 1;
  const innings = match.innings[inningsIndex];

  if (innings.deliveries.length > 0) {
    return NextResponse.json({ error: "Openers already set for this innings" }, { status: 409 });
  }

  innings.openingStriker = striker;
  innings.openingNonStriker = nonStriker;
  innings.openingBowler = bowler;

  await match.save();

  return NextResponse.json({ success: true });
}
