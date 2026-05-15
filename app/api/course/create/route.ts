import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    // 👇 ADDED GUARD CLAUSE 👇
    // This tells TypeScript that userId is definitely a string from here on out
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // 👆 ------------------ 👆

    const { title, units } = await req.json();

    const systemPrompt = `
      You are a strict AI course generator.
      The user wants a course on: "${title}".
      Generate a course with exactly 3 chapters (units).
      
      You must output strictly VALID JSON. Do not add markdown formatting like \`\`\`json.
      
      The structure must be:
      {
        "courseTitle": "Title of the course",
        "units": [
          {
            "unitTitle": "Title of the unit",
            "chapters": [
              {
                "chapterTitle": "Title of the specific topic",
                "youtubeSearchQuery": "A search term to find a relevant youtube video for this topic",
                "summary": "A brief explanation of this topic"
              }
            ]
          }
        ]
      }
    `;

    // Call Groq API (Llama 3 model)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the course now." }
      ],
      model: "llama-3.1-8b-instant", // Free, fast, and smart
      response_format: { type: "json_object" } // Forces strict JSON
    });

    const output = completion.choices[0]?.message?.content;
    if (!output) throw new Error("No output from AI");

    const courseData = JSON.parse(output);

    // Save to Database
    const savedCourse = await prisma.course.create({
      data: {
        name: courseData.courseTitle,
        userId: userId, // TypeScript is now happy because of the check above!
        units: {
          create: courseData.units.map((unit: any) => ({
            name: unit.unitTitle,
            chapters: {
              create: unit.chapters.map((chapter: any) => ({
                name: chapter.chapterTitle,
                youtubeSearchQuery: chapter.youtubeSearchQuery,
                summary: chapter.summary
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json({ course_id: savedCourse.id });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

{/*
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { title, units } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    
    // ✅ FIX: We use the exact model name found in your debug list
    // If this gives a 503 error, wait 10 seconds and try again (it's a server hiccup)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are a strict AI course generator.
      The user wants a course on: "${title}".
      Generate a course with exactly 3 chapters (units).
      
      The structure must be:
      {
        "courseTitle": "Title of the course",
        "units": [
          {
            "unitTitle": "Title of the unit",
            "chapters": [
              {
                "chapterTitle": "Title of the specific topic",
                "youtubeSearchQuery": "A search term to find a relevant youtube video for this topic",
                "summary": "A brief explanation of this topic"
              }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const courseData = JSON.parse(response.text());

    // Save to Database
    const savedCourse = await prisma.course.create({
      data: {
        name: courseData.courseTitle,
        units: {
          create: courseData.units.map((unit: any) => ({
            name: unit.unitTitle,
            chapters: {
              create: unit.chapters.map((chapter: any) => ({
                name: chapter.chapterTitle,
                youtubeSearchQuery: chapter.youtubeSearchQuery,
                summary: chapter.summary
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json({ course_id: savedCourse.id });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
  */}