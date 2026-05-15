// app/api/chapter/get-detail/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json();

    // 1. Fetch the chapter info from your DB
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    }

    // 2. Ask Groq to explain it in detail
    const prompt = `
      You are an expert teacher.
      The student wants to learn about: "${chapter.name}".
      Context query: "${chapter.youtubeSearchQuery}".
      
      Write a detailed, easy-to-understand educational article about this topic.
      - Use clear headings and bullet points.
      - If it is a coding topic, MUST include a code block example.
      - Keep the tone encouraging and professional.
      - Format the output in Markdown.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI tutor." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
    });

    const content = completion.choices[0]?.message?.content || "No content generated.";

    return NextResponse.json({ success: true, content });

  } catch (error) {
    console.error("Error generating details:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}