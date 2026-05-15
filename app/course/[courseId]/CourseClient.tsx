"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown"; 
import Link from "next/link";

// 1. Define the UserProgress type
interface UserProgress {
  isCompleted: boolean;
  score: number | null;
}

// 2. Add progress to the Chapter interface
interface Chapter {
  id: string;
  name: string;
  youtubeSearchQuery: string;
  summary: string;
  userProgress: UserProgress[]; // 👈 Array of progress (usually length 0 or 1)
}

interface Unit {
  id: string;
  name: string;
  chapters: Chapter[];
}

interface Course {
  name: string;
  units: Unit[];
}

export default function CourseClient({ course }: { course: Course }) {
  const [activeChapter, setActiveChapter] = useState<Chapter>(course.units[0].chapters[0]);
  
  const [details, setDetails] = useState<Record<string, string>>({});
  const [videoIds, setVideoIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadChapterData = async () => {
      if (details[activeChapter.id] && videoIds[activeChapter.id]) return;

      setLoading(true);
      try {
        const [notesRes, videoRes] = await Promise.all([
          fetch("/api/chapter/get-detail", {
            method: "POST",
            body: JSON.stringify({ chapterId: activeChapter.id }),
          }),
          fetch("/api/youtube", {
            method: "POST",
            body: JSON.stringify({ query: activeChapter.youtubeSearchQuery }),
          }),
        ]);

        const notesData = await notesRes.json();
        const videoData = await videoRes.json();
        
        setDetails((prev) => ({ ...prev, [activeChapter.id]: notesData.content }));
        if (videoData.success) {
            setVideoIds((prev) => ({ ...prev, [activeChapter.id]: videoData.videoId }));
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChapterData();
  }, [activeChapter, details, videoIds]);

  const currentVideoId = videoIds[activeChapter.id];

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">{course.name}</h1>
        </div>
        
        <div className="flex-1 p-4 space-y-6">
          {course.units.map((unit, unitIndex) => (
            <div key={unit.id}>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2">
                Unit {unitIndex + 1}: {unit.name}
              </h2>
              <div className="space-y-1">
                {unit.chapters.map((chapter) => {
                  // 👇 3. FIND PROGRESS FOR THIS CHAPTER
                  const progress = chapter.userProgress?.[0]; // Get the first entry (if exists)
                  const isCompleted = progress?.isCompleted;
                  const score = progress?.score;

                  return (
                    <button
                        key={chapter.id}
                        onClick={() => setActiveChapter(chapter)}
                        className={`w-full text-left p-3 text-sm rounded-lg transition-all flex items-center justify-between ${
                        activeChapter.id === chapter.id
                            ? "bg-blue-600 text-white shadow-md font-semibold"
                            : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                        }`}
                    >
                        {/* Chapter Name */}
                        <span className="truncate pr-2">{chapter.name}</span>

                        {/* 👇 4. RENDER BADGES */}
                        <div className="flex items-center gap-2">
                            {score !== null && score !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    score >= 80 ? 'bg-green-900 text-green-300' : 
                                    score >= 50 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                                }`}>
                                    {score}%
                                </span>
                            )}
                            {isCompleted && (
                                <span className="text-green-500 text-lg">✓</span>
                            )}
                        </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT (UNCHANGED) */}
      <div className="flex-1 flex flex-col p-8 bg-gray-950 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-8">
            <h1 className="text-4xl font-extrabold text-white">{activeChapter.name}</h1>
            {/* JOIN LIVE CLASS BUTTON */}
<div className="mb-6 flex justify-end">
  <Link 
    href={`/room/${activeChapter.id}`}
    target="_blank" // Opens in new tab so they don't lose notes
    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-all animate-pulse"
  >
    🔴 Join Live Class
  </Link>
</div>
            
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
                  {loading && !currentVideoId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                          <p className="text-blue-400 animate-pulse font-semibold">Loading Video...</p>
                      </div>
                  )}
                  {currentVideoId ? (
                     <iframe
                         width="100%"
                         height="100%"
                         src={`https://www.youtube.com/embed/${currentVideoId}`}
                         title="YouTube video player"
                         allowFullScreen
                         className="w-full h-full"
                     />
                  ) : (
                    !loading && <div className="flex items-center justify-center h-full text-gray-500">Video Unavailable</div>
                  )}
            </div>

            <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-blue-400 flex items-center">
                    📚 Study Notes
                </h3>
                
                {loading && !details[activeChapter.id] ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                        <div className="h-10 bg-gray-800 rounded w-full my-4"></div>
                        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    </div>
                ) : (
                    <article className="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed">
                        <ReactMarkdown>{details[activeChapter.id] || activeChapter.summary}</ReactMarkdown>
                    </article>
                )}
            </div>
            
            <hr className="my-8 border-gray-800" />

            <div className="flex flex-col items-center justify-center py-8 bg-gray-900/50 rounded-xl border border-gray-800 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to test your knowledge?</h3>
              <p className="text-gray-400 mb-6">Take the quiz to earn points and check your understanding.</p>
              
              <Link 
                href={`/quiz/${activeChapter.id}`} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                Start Chapter Quiz 🚀
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}