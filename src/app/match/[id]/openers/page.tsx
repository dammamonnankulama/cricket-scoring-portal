import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import Squad from "@/models/Squad";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import SelectOpeners from "@/components/create-match/SelectOpeners";

export default async function OpenersPage({
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
  if (match.status !== "in_progress") redirect(`/match/${id}/score`);

  const innings = match.innings[match.currentInningsNumber - 1];
  if (!innings.isSquadBased) redirect(`/match/${id}/score`);
  if (innings.openingStriker) redirect(`/match/${id}/score`);

  const battingSquadId = innings.battingTeam === match.team1Name ? match.squad1Id : match.squad2Id;
  const bowlingSquadId = innings.battingTeam === match.team1Name ? match.squad2Id : match.squad1Id;

  const [battingSquad, bowlingSquad] = await Promise.all([
    Squad.findById(battingSquadId).lean(),
    Squad.findById(bowlingSquadId).lean(),
  ]);

  return (
    <SelectOpeners
      matchId={id}
      battingTeam={innings.battingTeam}
      bowlingTeam={innings.bowlingTeam}
      battingSquad={JSON.parse(JSON.stringify(battingSquad))}
      bowlingSquad={JSON.parse(JSON.stringify(bowlingSquad))}
    />
  );
}
