import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server"; // 👈 1. Import Auth
import CourseClient from "./CourseClient";

const prisma = new PrismaClient();

interface Props {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  
  // 2. Get User ID so we fetch ONLY your progress
  const { userId } = await auth();
  if (!userId) {
      return redirect("/");
  }

  // 3. Fetch Data WITH Progress
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          chapters: {
            include: {
              // 👇 THIS IS THE MAGIC PART
              userProgress: {
                where: {
                  userId: userId,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  // 👇 ADDED 'as any' to bypass the strict TypeScript check for 'summary: string | null'
  return <CourseClient course={course as any} />;
}