import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, difficulty, amount } = await req.json();

    const systemPrompt = `
      You are a helpful AI that generates quiz questions.
      Generate ${amount} ${difficulty} multiple-choice questions about "${topic}".
      
      Output strictly in this JSON format:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "The Correct Option Text"
        }
      ]
      Do not add markdown formatting (like \`\`\`json). Just the raw JSON array.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON generator." },
        { role: "user", content: systemPrompt },
      ],
      // 👇 UPDATED MODEL NAME
      model: "llama-3.1-8b-instant", 
    });

    const content = completion.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const questions = JSON.parse(cleanContent);

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}