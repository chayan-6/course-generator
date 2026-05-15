"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,      // 👈 Kept this
  useTracks,            // 👈 Kept this
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import CollaborativeBoard from "./CollaborativeBoard";
import MultiplayerQuiz from "./MultiplayerQuiz";

interface Props {
  roomId: string;
  username: string;
}

// 👇 FIXED COMPONENT: Uses manual mapping instead of GridLayout
function SidebarVideo() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div 
      className="flex flex-col gap-2 overflow-y-auto" 
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {tracks.map((track) => (
        <div key={track.participant.identity + track.source} className="w-full h-48 flex-shrink-0 relative">
          <ParticipantTile 
            trackRef={track} 
            className="w-full h-full rounded-lg border border-neutral-800 object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default function LiveClassroom({ roomId, username }: Props) {
  const [token, setToken] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("action") === "start_quiz";
  const [tab, setTab] = useState<"board" | "quiz">(autoStart ? "quiz" : "board");

  useEffect(() => {
    (async () => {
      try {
       const uniqueUsername = `${username}_${Math.floor(Math.random() * 1000)}`;

        const resp = await fetch(`/api/livekit?room=${roomId}&username=${uniqueUsername}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, username]);

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400">Loading classroom...</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="h-screen w-full bg-neutral-950 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Class? 🎓</h2>
            <p className="text-gray-400 mb-8">Joining as <span className="text-blue-400 font-bold">{username}</span></p>
            <button onClick={() => setHasJoined(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg">
              Enter Classroom 🚀
            </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      data-lk-theme="default"
      className="h-screen w-full flex bg-neutral-900 overflow-hidden"
    >
      
      {/* LEFT SIDE: TABS */}
      <div className="flex-1 bg-white border-r border-gray-800 relative z-0 flex flex-col">
         <div className="flex border-b border-gray-200 bg-white">
            <button 
              onClick={() => setTab("board")}
              className={`flex-1 py-3 font-bold text-sm transition-colors ${tab === "board" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}
            >
              🎨 Whiteboard
            </button>
            <button 
              onClick={() => setTab("quiz")}
              className={`flex-1 py-3 font-bold text-sm transition-colors ${tab === "quiz" ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50" : "text-gray-500 hover:bg-gray-50"}`}
            >
              🧠 Live Quiz
            </button>
         </div>

         <div className="flex-1 relative">
            {tab === "board" ? <CollaborativeBoard roomId={roomId} /> : <MultiplayerQuiz />}
         </div>
      </div>

      {/* RIGHT SIDE: SIDEBAR VIDEO */}
      <div className="w-80 border-l border-gray-800 bg-black flex flex-col">
          <div className="flex-1 overflow-y-auto p-2">
             <SidebarVideo />
          </div>
          <ControlBar variation="minimal" />
          <RoomAudioRenderer />
      </div>

    </LiveKitRoom>
  );
}