import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white dark:bg-gray-950 px-4">
      <div className="text-center max-w-3xl space-y-8">
        {/* HERO BADGE */}
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20">
            Powered by Generative AI <span className="font-semibold text-blue-600">v1.0</span>
          </div>
        </div>

        {/* HERO TITLE */}
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Learn Anything with <span className="text-blue-600">AI-Powered</span> Courses
        </h1>

        {/* HERO DESCRIPTION */}
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Stop searching for playlists. Just type a topic, and let our AI build a structured video course with detailed notes, quizzes, and progress tracking instantly.
        </p>

        {/* CALL TO ACTION BUTTONS */}
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/create"
            className="rounded-md bg-blue-600 px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            Get Started
          </Link>
          <Link href="/gallery" className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
            View My Dashboard <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}