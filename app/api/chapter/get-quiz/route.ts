import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { chapterId, amount, difficulty } = await req.json();

    // 1. Get Chapter Context
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    }

    // 2. Ask AI for the specific quiz configuration
    const prompt = `
      You are a strict quiz generator. 
      Topic: "${chapter.name}".
      Context: "${chapter.summary}".
      
      Generate exactly ${amount} multiple-choice questions.
      Difficulty Level: ${difficulty}.

      Output format: A raw JSON array of objects. Do NOT wrap in markdown or code blocks.
      Each object must have:
      - question (string)
      - options (array of 4 strings)
      - answer (string, must exact match one of the options)

      Example:
      [
        {
          "question": "What is 2+2?",
          "options": ["1", "2", "3", "4"],
          "answer": "4"
        }
      ]
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON-only API. Only return valid JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5, // Lower temperature for more consistent formatting
    });

    let content = completion.choices[0]?.message?.content || "[]";
    
    // Clean up if AI accidentally adds markdown
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const quiz = JSON.parse(content);

    return NextResponse.json({ success: true, quiz });

  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate quiz" }, { status: 500 });
  }
}