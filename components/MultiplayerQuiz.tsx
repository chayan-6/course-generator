"use client";

import { useState, useEffect, useRef } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Loader2, Trophy, Settings, Users, Play, Clock, Lock, RefreshCw } from "lucide-react";
import axios from "axios";

// --- TYPES ---
type GameState = "SETUP" | "WAITING" | "LOBBY" | "ACTIVE" | "LEADERBOARD";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

export default function MultiplayerQuiz() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  
  // STATE
  const [gameState, setGameState] = useState<GameState>("WAITING");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isHost, setIsHost] = useState(false);
  
  // LOBBY STATE
  const [players, setPlayers] = useState<string[]>([]);
  const [hasJoined, setHasJoined] = useState(false);

  // HOST CONFIG
  const [config, setConfig] = useState({ topic: "General", difficulty: "Medium", amount: 5 });
  const [loading, setLoading] = useState(false);

  // 🔒 REFS
  const stateRef = useRef({ gameState, isHost, questions, currentQIndex, timeLeft, players });

  useEffect(() => {
    stateRef.current = { gameState, isHost, questions, currentQIndex, timeLeft, players };
  }, [gameState, isHost, questions, currentQIndex, timeLeft, players]);

  // 📡 1. LISTENER
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant: any) => {
      const message = new TextDecoder().decode(payload);
      const data = JSON.parse(message);
      const current = stateRef.current;

      console.log("📩 RECEIVED SIGNAL:", data.type);

      // --- LOBBY LOGIC ---
      if (data.type === "LOBBY_OPEN" || data.type === "LOBBY_PULSE") {
         if (current.gameState === "WAITING") {
             setQuestions(data.questions);
             setPlayers(data.players);
             setGameState("LOBBY"); 
         }
      }

      if (data.type === "PLAYER_JOIN_REQUEST" && current.isHost) {
         const newPlayerName = data.name;
         if (!current.players.includes(newPlayerName)) {
            const updatedPlayers = [...current.players, newPlayerName];
            setPlayers(updatedPlayers);
            sendSignal("LOBBY_UPDATE", { players: updatedPlayers });
         }
      }

      if (data.type === "LOBBY_UPDATE") {
         setPlayers(data.players);
      }

      if (data.type === "START_MATCH") {
         setGameState("ACTIVE");
         setCurrentQIndex(0);
         setMyScore(0);
         setSelectedOption(null);
         setTimeLeft(15);
      }

      // --- GAME LOGIC ---
      if (data.type === "NEXT_QUESTION") {
        setCurrentQIndex(data.index);
        setSelectedOption(null);
        setTimeLeft(15); // Student resets here
      }

      if (data.type === "SHOW_LEADERBOARD") {
        setGameState("LEADERBOARD");
      }

      // --- SYNC ---
      if (data.type === "GET_STATE_REQUEST" && current.isHost) {
         if (current.gameState === "LOBBY") {
            sendSignal("LOBBY_PULSE", { 
                questions: current.questions,
                players: current.players 
            });
         }
         if (current.gameState === "ACTIVE") {
            sendSignal("CURRENT_STATE_RESPONSE", {
                state: current.gameState,
                questions: current.questions,
                players: current.players,
                index: current.currentQIndex,
                timeLeft: current.timeLeft
            });
         }
      }

      if (data.type === "CURRENT_STATE_RESPONSE" && current.gameState === "WAITING") {
         setQuestions(data.questions);
         setPlayers(data.players);
         setCurrentQIndex(data.index);
         setTimeLeft(data.timeLeft);
         setGameState(data.state as GameState);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    const timer = setTimeout(() => sendSignal("GET_STATE_REQUEST"), 1000);

    return () => { 
        room.off(RoomEvent.DataReceived, handleData); 
        clearTimeout(timer);
    };
  }, [room]);

  // 📡 2. SENDER
  const sendSignal = async (type: string, payload: any = {}) => {
    if (!room || room.state !== ConnectionState.Connected) return;
    const data = JSON.stringify({ type, ...payload });
    const encoder = new TextEncoder();
    try {
        await room.localParticipant.publishData(encoder.encode(data), { reliable: true });
    } catch (e) { console.error(e); }
  };

  // 💓 3. HOST HEARTBEAT
  useEffect(() => {
    if (!isHost || gameState !== "LOBBY") return;
    const interval = setInterval(() => {
        sendSignal("LOBBY_PULSE", { 
            questions: stateRef.current.questions,
            players: stateRef.current.players 
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [isHost, gameState]);

  // ⏱️ 4. VISUAL TIMER (For EVERYONE)
  useEffect(() => {
    if (gameState !== "ACTIVE") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        return prev > 0 ? prev - 1 : 0; 
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentQIndex]);

  // ⏱️ 5. GAME ENGINE (HOST ONLY)
  useEffect(() => {
    if (!isHost || gameState !== "ACTIVE") return;
    if (timeLeft === 0) {
       handleTimeUp();
    }
  }, [timeLeft, isHost, gameState]);

  // 👇 FIXED FUNCTION
  const handleTimeUp = () => {
    if (currentQIndex < questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setTimeLeft(15); // 👈 THIS WAS MISSING!
      sendSignal("NEXT_QUESTION", { index: nextIdx });
    } else {
      setGameState("LEADERBOARD");
      sendSignal("SHOW_LEADERBOARD");
    }
  };

  // --- ACTIONS ---
  const initLobby = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/quiz/generate", {
        topic: config.topic,
        difficulty: config.difficulty,
        amount: config.amount,
      });

      const newQuestions = res.data.questions;
      if (!newQuestions || newQuestions.length === 0) return;
      
      setQuestions(newQuestions);
      setGameState("LOBBY");
      setPlayers([localParticipant.identity]); 
      setHasJoined(true);
      sendSignal("LOBBY_OPEN", { questions: newQuestions, players: [localParticipant.identity] });
    } catch (error) {
      console.error(error);
      alert("Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const joinLobby = () => {
     setHasJoined(true);
     sendSignal("PLAYER_JOIN_REQUEST", { name: localParticipant.identity });
  };

  const startMatch = () => {
     sendSignal("START_MATCH");
     setGameState("ACTIVE");
     setCurrentQIndex(0);
     setTimeLeft(15);
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === questions[currentQIndex].answer) setMyScore(s => s + 1);
  };

  // --- UI ---
  if (gameState === "SETUP") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-700">
           <h2 className="text-2xl font-bold mb-6">Quiz Setup</h2>
           <div className="space-y-4 mb-8">
             <div>
               <label className="text-gray-400 text-sm mb-1 block">Topic</label>
               <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white" placeholder="e.g. React Hooks" value={config.topic} onChange={(e) => setConfig({...config, topic: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-gray-400 text-sm mb-1 block">Difficulty</label>
                   <select className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg" value={config.difficulty} onChange={(e) => setConfig({...config, difficulty: e.target.value})}>
                     <option>Easy</option>
                     <option>Medium</option>
                     <option>Hard</option>
                   </select>
                </div>
                <div>
                   <label className="text-gray-400 text-sm mb-1 block">Questions</label>
                   <input type="number" min={1} max={30} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white" value={config.amount} onChange={(e) => setConfig({...config, amount: Number(e.target.value)})} />
                </div>
             </div>
           </div>
           <button onClick={initLobby} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
             {loading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />} Create Lobby
           </button>
        </div>
      </div>
    );
  }

  if (gameState === "LOBBY") {
     return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-blue-50 text-center">
           <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Quiz Lobby</h2>
              <p className="text-gray-500 mb-6">Topic: <span className="font-bold">{config.topic}</span></p>
              <div className="bg-gray-50 p-4 rounded-xl mb-6 max-h-40 overflow-y-auto">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-2">{players.length} Joined</p>
                 <div className="flex flex-wrap gap-2 justify-center">
                    {players.map((p, i) => (
                       <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold truncate max-w-[100px]">{p}</span>
                    ))}
                 </div>
              </div>
              {isHost ? (
                 <button onClick={startMatch} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg animate-pulse shadow-lg">Start Final Game 🚀</button>
              ) : (
                 !hasJoined ? (
                    <button onClick={joinLobby} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg">Join Quiz Now 👋</button>
                 ) : (
                    <div className="text-gray-500 font-medium flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Waiting for Host...</div>
                 )
              )}
           </div>
        </div>
     );
  }

  if (gameState === "WAITING") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full relative">
           <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-gray-800 mb-2">Multiplayer Arena</h2>
           <p className="text-gray-500 mb-6">Wait for a lobby to open...</p>
           <button onClick={() => sendSignal("GET_STATE_REQUEST")} className="w-full mb-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"><RefreshCw className="w-4 h-4" /> Check for Lobby</button>
           <div className="border-t border-gray-100 my-4"></div>
           <button onClick={() => { setIsHost(true); setGameState("SETUP"); }} className="w-full bg-black text-white py-3 rounded-lg font-bold">Create New Lobby 👑</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex];
  if (gameState === "ACTIVE") {
      if (!hasJoined && !isHost) {
          return (
             <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
                <Lock className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Match in Progress</h2>
                <p className="text-gray-400">The lobby is locked.</p>
             </div>
          );
      }
      if (!q) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;
      const progress = (timeLeft / 15) * 100;

      return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
          <div className="bg-gray-900 text-white p-4">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                   <span className="bg-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
                   <span className="font-medium">Q{currentQIndex + 1}/{questions.length}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-yellow-400 font-bold">
                   <Clock className="w-4 h-4" /> {timeLeft}s
                </div>
             </div>
             <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
             <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-snug">{q.question}</h3>
             <div className="grid gap-3">
               {q.options.map((opt) => (
                 <button key={opt} onClick={() => handleAnswer(opt)} disabled={selectedOption !== null} className={`p-5 rounded-xl border-2 text-left text-lg font-medium transition-all ${selectedOption === opt ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"}`}>
                   {opt}
                 </button>
               ))}
             </div>
          </div>
        </div>
      );
  }

  if (gameState === "LEADERBOARD") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-purple-900 text-white p-6">
        <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-4xl font-black mb-2">Game Over!</h2>
        <div className="bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl w-full max-w-sm text-center">
           <p className="uppercase text-xs font-bold tracking-widest text-gray-400 mb-2">Your Final Score</p>
           <div className="text-7xl font-black text-white mb-2">{myScore}</div>
           <p className="text-gray-400">out of {questions.length}</p>
        </div>
        {isHost && <button onClick={() => setGameState("SETUP")} className="mt-8 px-6 py-3 bg-white text-purple-900 font-bold rounded-lg">Start New Quiz</button>}
      </div>
    );
  }

  return null;
}