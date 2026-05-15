"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function CreatePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleCreate = async () => {
    if (!topic.trim()) return;
    if (!isSignedIn) {
        alert("Please sign in first!");
        return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/course/create", {
        method: "POST",
        body: JSON.stringify({ title: topic, units: [] }), // Logic handled by API
      });
      const data = await res.json();
      router.push(`/course/${data.course_id}`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white dark:bg-gray-950 p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
              What do you want to learn?
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Enter a topic, and our AI will generate a comprehensive course for you in seconds.
            </p>
        </div>

        <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Advanced Python Patterns, History of Rome..."
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-transparent text-xl focus:outline-none focus:border-blue-500 transition-colors"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            
            <button
              onClick={handleCreate}
              disabled={loading || !topic}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating Course..." : "Generate Course 🚀"}
            </button>
        </div>
      </div>
    </div>
  );
}