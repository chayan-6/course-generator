"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface Props {
  chapterId: string;
  courseId: string;
}

export default function ChapterQuiz({ chapterId, courseId }: Props) {
  // CONFIG STATE
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");

  // QUIZ STATE
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  
  // ANTI-CHEAT STATE
  const [warnings, setWarnings] = useState(0);

  // EVALUATION STATE
  const [feedback, setFeedback] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // 🛡️ ANTI-CHEAT: TAB SWITCH LISTENER
  useEffect(() => {
    if (!started || showResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((prev) => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            alert("🚫 Cheating detected! You switched tabs twice. submitting quiz now.");
            finishQuiz();
          } else {
            alert("⚠️ Warning! Do not switch tabs or the quiz will auto-fail.");
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [started, showResult]);

  const startQuiz = async () => {
    setLoading(true);
    setWarnings(0);
    setUserAnswers({});
    try {
      const res = await axios.post("/api/chapter/get-quiz", { chapterId, amount, difficulty });
      if (res.data.success) {
        setQuestions(res.data.quiz);
        setStarted(true);
      }
    } catch (error) {
      alert("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

 const finishQuiz = async () => {
    // 1. Calculate Score
    let correct = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) correct++;
    });
    const percentage = Math.round((correct / questions.length) * 100);

    // 2. Save to Database
    try {
      await axios.post("/api/chapter/complete", {
        chapterId,
        score: percentage,
      });
    } catch (error) {
      console.error("Failed to save score");
    }

    // 3. Show Results & Get Feedback (Existing Logic)
    setShowResult(true);
    setEvaluating(true);
    try {
        const res = await axios.post("/api/chapter/evaluate", {
            questions,
            userAnswers
        });
        setFeedback(res.data.feedback);
    } catch (error) {
        setFeedback("Could not generate AI feedback.");
    } finally {
        setEvaluating(false);
    }
  };

  // 1. CONFIG SCREEN
  if (!started) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Ready for your Exam? 📝</h1>
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl">
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-gray-400 mb-2 text-sm">Difficulty</label>
                    <div className="flex gap-2">
                        {["Easy", "Medium", "Hard"].map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    difficulty === level ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-gray-400 mb-2 text-sm">Questions</label>
                    <select 
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                    >
                        {[5, 10, 15, 20, 25, 30].map(num => (
                            <option key={num} value={num}>{num} Questions</option>
                        ))}
                    </select>
                </div>
            </div>
            <button onClick={startQuiz} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl">
                {loading ? "Generating Exam..." : "Start Exam"}
            </button>
        </div>
      </div>
    );
  }

  // 2. DETAILED RESULT SCREEN (New!)
  if (showResult) {
    const score = questions.reduce((acc, q, i) => (userAnswers[i] === q.answer ? acc + 1 : acc), 0);
    return (
        <div className="max-w-4xl mx-auto p-8 pb-20">
           <div className="flex items-center justify-between mb-8">
                 <h3 className="text-3xl font-bold">Results 📊</h3>
                 <Link 
                    href={`/course/${courseId}`}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                 >
                    ← Back to Course
                 </Link>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-gray-400">Final Score</p>
                    <h1 className="text-5xl font-black text-white">{Math.round((score / questions.length) * 100)}%</h1>
                </div>
                <div className="text-right">
                    <p className="text-gray-400">AI Feedback Status</p>
                    <p className={evaluating ? "animate-pulse text-yellow-500" : "text-green-500"}>
                        {evaluating ? "Analyzing Weaknesses..." : "Analysis Complete"}
                    </p>
                </div>
            </div>

            {/* AI FEEDBACK BOX */}
            {!evaluating && feedback && (
                <div className="bg-blue-900/20 border border-blue-800 p-6 rounded-xl mb-8">
                    <h4 className="font-bold text-blue-400 mb-2">💡 AI Tutor Feedback:</h4>
                    <p className="text-gray-300 leading-relaxed">{feedback}</p>
                </div>
            )}

            {/* QUESTION BREAKDOWN */}
            <div className="space-y-4">
                {questions.map((q, i) => {
                    const isCorrect = userAnswers[i] === q.answer;
                    return (
                        <div key={i} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10'}`}>
                            <div className="flex justify-between mb-2">
                                <h4 className="font-semibold text-gray-200">Question {i + 1}</h4>
                                {isCorrect ? <span className="text-green-500 font-bold">✓ Correct</span> : <span className="text-red-500 font-bold">✗ Wrong</span>}
                            </div>
                            <p className="text-lg mb-4 text-white">{q.question}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-3 rounded">
                                    <span className="text-xs text-gray-500 uppercase">Your Answer</span>
                                    <p className={isCorrect ? "text-green-400" : "text-red-400"}>{userAnswers[i]}</p>
                                </div>
                                {!isCorrect && (
                                    <div className="bg-gray-900/50 p-3 rounded">
                                        <span className="text-xs text-gray-500 uppercase">Correct Answer</span>
                                        <p className="text-green-400">{q.answer}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  }

  // 3. ACTIVE QUIZ (Full Screen)
  const currentQ = questions[currentIndex];
  return (
    <div className="max-w-4xl mx-auto p-8 mt-10">
        <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-bold text-gray-400">Question {currentIndex + 1} of {questions.length}</h4>
            <div className="flex gap-2">
                {warnings > 0 && <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">⚠️ Warning 1/2</span>}
                <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">{difficulty}</span>
            </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl">
            <p className="text-2xl font-medium text-white mb-8 leading-relaxed">{currentQ.question}</p>

            <div className="space-y-3">
                {currentQ.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full text-left p-5 rounded-lg border transition-all text-lg ${
                            userAnswers[currentIndex] === option 
                                ? "bg-blue-600 border-blue-500 text-white" 
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleNext}
                    disabled={!userAnswers[currentIndex]}
                    className="bg-white text-black font-bold py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                    {currentIndex + 1 === questions.length ? "Finish & Submit" : "Next Question →"}
                </button>
            </div>
        </div>
    </div>
  );
}