"use server";

import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

interface LeaderboardEntry {
  userId: string;
  score: number;
  name: string;
  image: string;
}

export async function getLeaderboardData(courseId?: string): Promise<LeaderboardEntry[]> {
  // 1. Build the query (Filter by courseId if provided)
  const whereClause = courseId ? { chapter: { unit: { courseId } } } : {};

  // 2. Group scores by User
  const groupedProgress = await prisma.userProgress.groupBy({
    by: ["userId"],
    _sum: {
      score: true,
    },
    where: whereClause,
    orderBy: {
      _sum: {
        score: "desc",
      },
    },
    take: 10,
  });

  // 3. Fetch User Names from Clerk
  const userIds = groupedProgress.map((entry) => entry.userId);
  if (userIds.length === 0) return [];

  const client = await clerkClient();
  const users = await client.users.getUserList({
    userId: userIds,
  });

  // 4. Merge Data
  return groupedProgress.map((entry) => {
    const user = users.data.find((u) => u.id === entry.userId);
    return {
      userId: entry.userId,
      score: entry._sum.score || 0,
      name: user ? user.firstName || "Anonymous" : "Unknown",
      image: user ? user.imageUrl : "",
    };
  });
}