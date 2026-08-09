import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import Squad from "@/models/Squad";
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

  const isSquadBased = !!(match.squad1Id && match.squad2Id);
  let squad1 = null;
  let squad2 = null;

  if (isSquadBased) {
    [squad1, squad2] = await Promise.all([
      Squad.findById(match.squad1Id).lean(),
      Squad.findById(match.squad2Id).lean(),
    ]);

    if (match.status === "in_progress") {
      const innings = match.innings[match.currentInningsNumber - 1];
      if (innings && !innings.isCompleted && !innings.openingStriker && innings.deliveries.length === 0) {
        redirect(`/match/${id}/openers`);
      }
    }
  }

  return (
    <ScoringPanel
      matchId={id}
      match={JSON.parse(JSON.stringify(match))}
      squad1={JSON.parse(JSON.stringify(squad1))}
      squad2={JSON.parse(JSON.stringify(squad2))}
    />
  );
}