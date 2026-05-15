// app/api/youtube/route.ts
import { NextResponse } from "next/server";
import ytsr from "ytsr";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // Search YouTube (limit to 1 result)
    const searchResults = await ytsr(query, { limit: 1 });
    const firstResult: any = searchResults.items[0];

    // Check if we found a video
    if (firstResult && firstResult.type === 'video' && firstResult.id) {
        return NextResponse.json({ success: true, videoId: firstResult.id });
    } else {
        return NextResponse.json({ success: false, error: "No video found" });
    }

  } catch (error) {
    console.error("YouTube Search Error:", error);
    return NextResponse.json({ success: false, error: "Search failed" });
  }
}