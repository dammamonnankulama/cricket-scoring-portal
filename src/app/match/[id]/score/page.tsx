import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ScoringPanel from "@/components/ScoringPanel";

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  await connectDB();
  const match = await Match.findById(id).lean();

  if (!match) notFound();
  if (match.createdBy.toString() !== session?.user?.id) notFound();
  if (match.status === "toss_pending") redirect(`/match/${id}/toss`);

  return (
    <ScoringPanel
      matchId={id}
      match={JSON.parse(JSON.stringify(match))}
    />
  );
}
