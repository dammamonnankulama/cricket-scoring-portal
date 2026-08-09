import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateMatchWizard from "@/components/create-match/CreateMatchWizard";

export default async function CreateMatchPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <CreateMatchWizard />;
}
