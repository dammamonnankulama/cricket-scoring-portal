import connectDB from "@/lib/mongodb";
import Match from "@/models/Match";
import Squad from "@/models/Squad";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ReviewScheduledMatch from "@/components/create-match/ReviewScheduledMatch";

export default async function ReviewMatchPage({
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
  if (match.status !== "scheduled") redirect(`/match/${id}/toss`);

  const [squad1, squad2] = await Promise.all([
    match.squad1Id ? Squad.findById(match.squad1Id).lean() : null,
    match.squad2Id ? Squad.findById(match.squad2Id).lean() : null,
  ]);

  return (
    <ReviewScheduledMatch
      matchId={id}
      match={JSON.parse(JSON.stringify(match))}
      squad1={JSON.parse(JSON.stringify(squad1))}
      squad2={JSON.parse(JSON.stringify(squad2))}
    />
  );
}
