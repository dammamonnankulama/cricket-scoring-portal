import connectDB from "@/lib/mongodb";
import Squad from "@/models/Squad";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const squad = await Squad.findById(id).lean();

  if (!squad) return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  if ((squad as any).createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ squad });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, logoUrl, players, defaultCaptainName, defaultWicketkeeperName } = await request.json();

  if (Array.isArray(players) && players.length > 15) {
    return NextResponse.json({ error: "A squad can have at most 15 players" }, { status: 400 });
  }

  await connectDB();
  const squad = await Squad.findById(id);

  if (!squad) return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  if (squad.createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (name?.trim()) squad.name = name.trim();
  if (logoUrl !== undefined) squad.logoUrl = logoUrl;
  if (Array.isArray(players)) squad.players = players;
  if (defaultCaptainName !== undefined) squad.defaultCaptainName = defaultCaptainName;
  if (defaultWicketkeeperName !== undefined) squad.defaultWicketkeeperName = defaultWicketkeeperName;

  await squad.save();

  return NextResponse.json({ success: true, squad });
}
