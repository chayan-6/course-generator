"use client";

import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  roomId: string;
}

export default function CollaborativeBoard({ roomId }: Props) {
  const store = useSyncDemo({ roomId });
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full relative">
      <Tldraw store={store} />
      
      {/* 👇 NEW HEADER with Room Code */}
     <div className="absolute top-4 right-4 z-[99999] flex items-center gap-3">
        
        {/* Title */}
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Live Board
          </h2>
        </div>

        {/* Room Code & Copy Button */}
        <button 
          onClick={copyToClipboard}
          className="bg-black/90 hover:bg-black text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all active:scale-95"
          title="Click to copy Room Code"
        >
          <span className="text-gray-400">Code:</span> 
          <span className="font-mono tracking-wider">{roomId}</span>
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>

      </div>
    </div>
  );
}