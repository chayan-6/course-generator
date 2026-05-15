import LiveClassroom from "@/components/LiveClassRoom";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    chapterId: string;
  }>;
}

export default async function RoomPage({ params }: Props) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return redirect("/");
  }

  const { chapterId } = await params;

  // Use the user's real name (or email if name is missing)
  const username = user.firstName || user.emailAddresses[0].emailAddress.split("@")[0];

  return (
    <div className="h-screen w-full bg-black">
      <LiveClassroom roomId={chapterId} username={username} />
    </div>
  );
}