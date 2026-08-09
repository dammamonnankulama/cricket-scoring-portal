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
  if (match.status !== "scheduled") {
    return NextResponse.json({ error: "Match is not scheduled" }, { status: 409 });
  }

  match.status = "toss_pending";
  await match.save();

  return NextResponse.json({ success: true });
}
