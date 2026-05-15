import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardClassroomCard from "@/components/DashboardClassroomCard";

const prisma = new PrismaClient();

export default async function GalleryPage() {
  // 1. Get the current user
  const { userId } = await auth();

  if (!userId) {
    return redirect("/");
  }

  // 2. Fetch ONLY courses that belong to this user
  const courses = await prisma.course.findMany({
    where: {
      userId: userId,
    },
    include: {
      units: true,
    },
  });

  return (
    <div className="py-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Courses</h1>
        <Link href="/create" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition dark:bg-white dark:text-black dark:hover:bg-gray-200">
          + Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <DashboardClassroomCard />
        {courses.map((course) => {
          return (
            <Link href={`/course/${course.id}`} key={course.id} className="block group">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-all h-full bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="flex items-center space-x-2 mb-4">
                   {/* Random Emoji as "Icon" for now */}
                   <span className="text-4xl">📚</span>
                </div>
                
                <h2 className="text-xl font-bold group-hover:text-blue-600 transition-colors dark:text-gray-100">
                  {course.name}
                </h2>
                
                <p className="text-sm text-gray-500 mt-2">
                  {course.units.length} Units
                </p>
              </div>
            </Link>
          );
        })}
        
        {courses.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <h3 className="text-xl font-semibold text-gray-600">No courses yet!</h3>
                <Link href="/create" className="text-blue-600 underline mt-2 block">
                    Create your first AI Course
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}