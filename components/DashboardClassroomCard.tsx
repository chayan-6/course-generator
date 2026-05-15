"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ArrowRight, Video } from "lucide-react";
import { nanoid } from "nanoid";

export default function DashboardClassroomCard() {
  const [mode, setMode] = useState<"menu" | "join">("menu");
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  // 1. Create: Generates a random 6-char ID and goes there
  const handleCreate = () => {
    const roomId = nanoid(6); // e.g., "u8s-2ka"
    router.push(`/room/${roomId}`);
  };

  // 2. Join: Goes to the specific ID typed by the user
  const handleJoin = () => {
    if (joinCode.trim().length > 0) {
      router.push(`/room/${joinCode}`);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group h-full flex flex-col justify-between">
      
      {/* Background Icon Decoration */}
      <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        <Video className="w-32 h-32 text-blue-600" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Study Groups
        </h3>
        
        <p className="text-neutral-500 text-sm mb-6">
            Create a private room to collaborate with friends. Video, Whiteboard & Quizzes.
        </p>
      </div>

      {mode === "menu" ? (
        <div className="flex gap-2 w-full">
          <button 
            onClick={handleCreate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
          <button 
            onClick={() => setMode("join")}
            className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white py-2 px-4 rounded-lg font-bold text-sm transition-colors"
          >
            Join
          </button>
        </div>
      ) : (
        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 w-full">
          <input 
            autoFocus
            type="text" 
            placeholder="Enter Code..."
            className="flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button 
            onClick={handleJoin}
            className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg hover:opacity-80 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMode("menu")}
            className="text-xs text-neutral-400 hover:text-neutral-600 p-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}