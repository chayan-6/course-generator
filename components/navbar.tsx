"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// 👇 THE FIX: Import UserButton dynamically with SSR disabled
const UserButton = dynamic(() => import("@clerk/nextjs").then((mod) => mod.UserButton), {
  ssr: false,
  // Optional: Shows a grey circle while loading to prevent layout shift
  loading: () => <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />, 
});

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 dark:border-zinc-800 py-2">
      <div className="flex items-center justify-center h-full gap-2 px-8 mx-auto sm:justify-between max-w-7xl">
        {/* LEFT SIDE: LOGO */}
        <Link href="/" className="items-center hidden gap-2 sm:flex">
          <p className="rounded-lg border-2 border-b-4 border-r-4 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block dark:border-white">
            AI Course Generator
          </p>
        </Link>

        {/* RIGHT SIDE: BUTTONS */}
        <div className="flex items-center gap-4">
          <Link href="/gallery" className="text-sm font-medium hover:text-blue-600 transition-colors">
            My Courses
          </Link>
          
          <Link href="/create" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Create Course
          </Link>

          <Link href="/leaderboard" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Leaderboard 🏆
          </Link>

          {/* 👇 UserButton is now a Client-Only component */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}