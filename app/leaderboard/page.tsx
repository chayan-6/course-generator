import { PrismaClient } from "@prisma/client";
import { getLeaderboardData } from "@/app/action/getLeaderboard";
import LeaderboardClient from "@/components/LeaderboardClient";

const prisma = new PrismaClient();

export default async function LeaderboardPage() {
  // 1. Fetch Initial Global Leaderboard
  const initialData = await getLeaderboardData();

  // 2. Fetch All Available Courses (for the dropdown)
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 pt-24">
      <LeaderboardClient initialData={initialData} courses={courses} />
    </div>
  );
}