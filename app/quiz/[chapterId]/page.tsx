import ChapterQuiz from "@/components/ChapterQuiz";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Props {
  params: Promise<{
    chapterId: string;
  }>;
}

export default async function QuizPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/");
  }

  const { chapterId } = await params;

  // 1. Fetch the chapter to find its parent Course ID
  const chapter = await prisma.chapter.findUnique({
    where: {
      id: chapterId,
    },
    include: {
      unit: true, // We need the unit to get the courseId
    },
  });

  // Safety check: if chapter doesn't exist, go home
  if (!chapter || !chapter.unit) {
    return redirect("/");
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* 2. Pass the courseId to the component */}
      <ChapterQuiz chapterId={chapterId} courseId={chapter.unit.courseId} />
    </div>
  );
}