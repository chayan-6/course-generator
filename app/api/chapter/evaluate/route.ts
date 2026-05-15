import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { questions, userAnswers } = await req.json();

    // Filter only wrong answers to save tokens
    const wrongAnswers = questions.map((q: any, index: number) => {
        if (userAnswers[index] !== q.answer) {
            return { question: q.question, userAnswer: userAnswers[index], correctAnswer: q.answer };
        }
        return null;
    }).filter(Boolean);

    if (wrongAnswers.length === 0) {
        return NextResponse.json({ feedback: "Perfect score! No weaknesses detected. Keep up the great work." });
    }

    const prompt = `
      You are an AI tutor. The user just took a quiz and got these questions wrong:
      ${JSON.stringify(wrongAnswers)}

      Analyze their mistakes. 
      1. Identify the specific concept they are weak in.
      2. Provide a short (2-3 sentences) tip to strengthen that area.
      3. Keep it encouraging but direct.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful tutor." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
    });

    return NextResponse.json({ feedback: completion.choices[0]?.message?.content });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}