import connectDB from "@/lib/mongodb";
import Squad from "@/models/Squad";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const squads = await Squad.find({ createdBy: session.user.id }).sort({ name: 1 }).lean();
  return NextResponse.json({ squads });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, logoUrl, players, defaultCaptainName, defaultWicketkeeperName } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Squad name is required" }, { status: 400 });
  }
  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: "Add at least one player" }, { status: 400 });
  }
  if (players.length > 15) {
    return NextResponse.json({ error: "A squad can have at most 15 players" }, { status: 400 });
  }
  for (const p of players) {
    if (!p.name?.trim() || !["batsman", "bowler", "wicketkeeper", "allrounder"].includes(p.role)) {
      return NextResponse.json({ error: "Each player needs a name and a valid role" }, { status: 400 });
    }
  }

  await connectDB();
  const squad = await Squad.create({
    createdBy: session.user.id,
    name: name.trim(),
    logoUrl: logoUrl || null,
    players,
    defaultCaptainName: defaultCaptainName || null,
    defaultWicketkeeperName: defaultWicketkeeperName || null,
  });

  return NextResponse.json({ success: true, squad }, { status: 201 });
}
