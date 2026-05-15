"use client";

import { useState, useEffect } from "react";
import { getLeaderboardData } from "../app/action/getLeaderboard";

interface Props {
  initialData: any[];
  courses: { id: string; name: string }[];
}

export default function LeaderboardClient({ initialData, courses }: Props) {
  const [tab, setTab] = useState<"global" | "course">("global");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // When Tab or Course changes, fetch new data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "global") {
          const res = await getLeaderboardData(); // Fetch Global
          setData(res);
        } else {
          const res = await getLeaderboardData(selectedCourseId); // Fetch Specific Course
          setData(res);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, selectedCourseId]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 1. HEADER & TABS */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 text-blue-500">🏆 Leaderboard</h1>
        
        {/* TAB SWITCHER */}
        <div className="flex justify-center gap-4 bg-gray-900 p-2 rounded-xl inline-flex border border-gray-800">
          <button
            onClick={() => setTab("global")}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              tab === "global" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            All-Time Global
          </button>
          <button
            onClick={() => setTab("course")}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              tab === "course" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Topic Specific
          </button>
        </div>
      </div>

      {/* 2. COURSE SELECTOR (Only if tab is 'course') */}
      {tab === "course" && (
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 bg-gray-900 px-6 py-3 rounded-xl border border-gray-800">
            <span className="text-gray-400 font-medium">Select Topic:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-black text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. RANKING TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl min-h-[300px]">
        {loading ? (
           <div className="flex items-center justify-center h-64 text-gray-500 animate-pulse">
             Loading Rankings...
           </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((student: any, index: number) => (
                <tr key={student.userId} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap w-16">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? "bg-yellow-500 text-black" :
                        index === 1 ? "bg-gray-400 text-black" :
                        index === 2 ? "bg-orange-600 text-black" : "text-gray-500"
                    }`}>
                        {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full mr-4 border-2 border-gray-700" src={student.image} alt="" />
                      <span className="font-bold text-white">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-blue-400">
                    {student.score} pts
                  </td>
                </tr>
              ))}
              
              {data.length === 0 && (
                  <tr>
                      <td colSpan={3} className="text-center py-12 text-gray-500">
                          No scores recorded for this topic yet. Be the first! 🚀
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}