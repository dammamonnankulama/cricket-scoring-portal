import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import TossForm from "@/components/TossForm";

export default async function TossPage({
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

  if (match.status !== "toss_pending") {
    redirect(`/match/${id}/score`);
  }

  return (
    <TossForm
      matchId={id}
      team1Name={match.team1Name}
      team2Name={match.team2Name}
      isSquadBased={!!(match.squad1Id && match.squad2Id)}
    />
  );
}
