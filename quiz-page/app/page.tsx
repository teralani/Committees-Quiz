"use client";
import { useState, useEffect, useRef } from "react";
// Removed unused Image import

// --- QUIZ DATA ---
type Question = {
  text: string;
  options: { text: string; nextQuestion?: number; result?: string }[];
  number: number;
  slider? : boolean;
};

const questions: Question[] = [
  {
    text: "How many conferences have you attended?",
    options: [
      { text: "Beginner", nextQuestion: 1 },
      { text: "Intermediate", nextQuestion: 4 },
      { text: "Advanced", nextQuestion: 7 }
    ],
    number: 1,
    slider: true
  },
  {
    text: "Are you more interested in standard ROP or specialized/creative ROP like Crisis or Cabinet?",
    options: [
      { text: "Standard ROP", nextQuestion: 2 },
      { text: "Specialized/Crisis ROP", nextQuestion: 3 }
    ],
    number: 2
  },
  {
    text: "Do you want your topic to be oriented around global policy issues or regional / thematic topics?",
    options: [
      { text: "Global policy", result: "United Nations Office on Drugs and Crime (UNODC)" },
      { text: "Economics / development focus", result: "United Nations Economic Commission for Africa (UNECA)" }
    ],
    number: 3
  },
  {
    text: "Are you drawn to current real-world issues or history and region specific topics?",
    options: [
      { text: "Environmental / climate focus", result: "Environmental Crisis Committee (ECC)" },
      { text: "History / regional interest", result: "Newfoundland Commission of Government (NCOG)" }
    ],
    number: 4
  },
  {
    text: "Do you prefer standard UN structures or more uniquely-structured committees?",
    options: [
      { text: "Standard UN", nextQuestion: 5 },
      { text: "Unique ROP", nextQuestion: 6 }
    ],
    number: 6
  },
  {
    text: "Are you more interested in law / maritime themes or social / cultural issues?",
    options: [
      { text: "Law / sea governance", result: "United Nations Convention on the Law of the Sea (UNCLOS)" },
      { text: "Cultural / indigenous focus", result: "United Nations Permanent Forum on Indigenous Issues (UNPFII)" }
    ],
    number: 7
  },
  {
    text: "Are you more drawn to economics/finance topics or fiction and espionage themes?",
    options: [
      { text: "Finance & markets focus", result: "Financial Crisis Committee (FCC)" },
      { text: "Cryptography / fiction", result: "Cicada 3301 (C-3301)" }
    ],
    number: 8
  },
  {
    text: "Do you want a committee with a strong historical basis or creative / crisis style?",
    options: [
      { text: "Historical", nextQuestion: 8 },
      { text: "Creative / crisis", nextQuestion: 9 }
    ],
    number: 10
  },
  {
    text: "Which historical angle appeals to you?",
    options: [
      { text: "Classical international interwar diplomacy", result: "League of Nations (LoN)" },
      { text: "Structured government / leadership roles", result: "Historical Cabinet" },
      { text: "[REDACTED]", result: "AD-HOC [REDACTED]" }
    ],
    number: 11
  },
  {
    text: "Are you interested in mythology and broad cultural research or trade and historical connections?",
    options: [
      { text: "Mythic / cross-culture crisis", result: "League of Immortals (LOI)" },
      { text: "Trade history / cross-period narrative", result: "The Silk Road (TSR)" }
    ],
    number: 12
  },
];

const committeeMatches: Record<number, string> = {
  1: "United Nations Office on Drugs and Crime (UNODC)",
  2: "United Nations Convention on the Law of the Sea (UNCLOS)",
  3: "League of Nations (LoN)",
  4: "United Nations Economic Commission for Africa (UNECA)",
  5: "United Nations Permanent Forum on Indigenous Issues (UNPFII)",
  6: "The Silk Road (TSR)",
  7: "Newfoundland Commission of Government (NCOG)",
  8: "Cicada 3301 (C-3301)",
  9: "AD-HOC [REDACTED]",
  10: "Environmental Crisis Committee (ECC)",
  11: "Financial Crisis Committee (FCC)",
  12: "League of Immortals (LOI)",
  13: "Historical Cabinet",
};

const committeeDescriptions: Record<string, string> = {
  "United Nations Office on Drugs and Crime (UNODC)": "1Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "United Nations Convention on the Law of the Sea (UNCLOS)" : "2Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "League of Nations (LoN)" : "3Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "United Nations Economic Commission for Africa (UNECA)" : "This ECOSOC committee focuses on economic development issues in Africa, addressing economic and regional issues. UNECA is perfect for beginner delegates interested in geopolitics and development.",
  "United Nations Permanent Forum on Indigenous Issues (UNPFII)" : "This committee centers around indigenous issues globally, discussing cultural preservation and rights. UNPFII suits delegates passionate about indigenous advocacy and are open to a standard ROP with a few specialized motions.",
  "The Silk Road (TSR)" : "Explore the trade routes from East to West that connected the ancient world in this historical committee. TSR is ideal for delegates who want to explore the rich history of trade and cultural exchange, and who are open to a specialized ROP.",
  "Newfoundland Commission of Government (NCOG)" : "7Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "Cicada 3301 (C-3301)" : "8Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "AD-HOC [REDACTED]" : "This committee's topic will be revealed on conference day and it best for advanced delegates. Prepare for an exciting and secretive experience!",
  "Environmental Crisis Committee (ECC)" : "10Lorem ipsum dolor. Lorem ipsum  dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "Financial Crisis Committee (FCC)" : "11Lorem ipsum dolor. Lorem ipsum  dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "League of Immortals (LOI)" : "12Lorem ipsum dolor. Lorem ipsum  dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
  "Historical Cabinet": "13Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor. Lorem ipsum dolor.",
};


export default function CommitteeQuizPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderDisplay = useRef<HTMLParagraphElement>(null);
  const sliderInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
    if (!result) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      opacity: number;
      emoji?: string;
    };

    const colors = ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#A855F7"];
    const particles: Particle[] = [];

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    for (let i = 0; i < 200; i++) {
      const isEmoji = Math.random() < 0.3;
      particles.push({
        x: random(0, canvas.width),
        y: random(-canvas.height, 0),
        vx: random(-1.5, 1.5),
        vy: random(2, 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: random(3, 6),
        opacity: Math.random(),
        emoji: isEmoji ? (Math.random() < 0.5 ? "👑" : "🎉") : undefined, // Randomly choose between crown and another emoji
      });
    }

    let animationFrameId: number;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        if (p.emoji) {
          ctx.font = `${p.size * 5}px Arial`;
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size * 2);
        }

        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.005;

        if (p.y > canvas.height || p.opacity <= 0) {
          p.x = random(0, canvas.width);
          p.y = random(-canvas.height, -20);
          p.opacity = 1;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    }
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {draw()}

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [result]);

  const handleSelect = (option: { text: string; nextQuestion?: number; result?: string }) => {
    if (option.result) {
      setResult(option.result);
    } else if (option.nextQuestion !== undefined) {
      setCurrent(option.nextQuestion);
      setQuestionNumber(questions[option.nextQuestion].number);
    }
  };

  const progressPercent = ((questionNumber - 1) / 12) * 100;

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gradient-to-br from-[#2E4A20] to-purple-800 p-6">
      {result && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0"
        />
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <h1 className="relative text-5xl font-bold text-white text-center mb-2 drop-shadow-lg flex flex-wrap items-center justify-center">
        <div id="LOGO"></div>
        <p>KINGMUN Committee Quiz</p>
      </h1>
      <p className="relative text-purple-200 text-center mb-8">Find your perfect committee match</p>

      {!started? (
        <div className="result-card fade-in relative bg-white/10 backdrop-blur-md rounded-2xl p-12 shadow-2xl text-center border border-white/20 max-w-lg">
          <div className="text-6xl mb-4 left-[42%]" id="LOGO"></div>
          <h2 className="text-4xl font-bold text-white">KINGMUN 2026 Committees Quiz</h2>
          <p className="text-xl font-smibold text-white my-8">
            Find the perfect KINGMUN committee for you!
          </p>
          <div className="my-8 h-1 w-28 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto"></div>
          <button
            onClick={() => {
              setStarted(true);
            }}
            className="btn-retry"
          >
            Start Quiz
          </button>
        </div>
      ) : 
      (!result ? (
        <div className="relative w-full max-w-5xl">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-purple-200">
                Question {questionNumber}
              </span>
              <span className="text-sm font-semibold text-purple-200">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="card fade-in bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <p className="text-2xl font-bold text-white mb-6">
              {questions[current].text}
            </p>

            <div className={`grid grid-cols-1 ${questions[current] && questions[current].slider? "" : "md:grid-cols-2"} gap-4`}>
              {questions[current] && questions[current].slider? (
                <div className="flex flex-row flex-wrap items-center max-md:flex-col my-10">
                    <div className="flex flex-col flex-grow md:mr-6 max-md:w-full">
                    <p 
                      ref = {sliderDisplay}
                      className="mt-2 mb-8 text-center text-xl font-bold text-white"
                    >4 conferences</p>
                    <input
                      ref={sliderInput}
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      className="w-full accent-purple-500 mr-5 mb-5 slider-gradient"
                      onChange={(e) => sliderDisplay.current && (sliderDisplay.current.textContent = (e.target.value == e.target.max)? "8+ conferences": e.target.value + ` conference${e.target.value == "1"? "": "s"}`)}
                    />
                    </div>
                  <button
                    onClick={() => {
                      const number = sliderInput.current ? parseInt(sliderInput.current.value) : 4;
                      if (number <= 3) {
                        var nextQ = 1;
                      } else if (number <= 6) {
                        var nextQ = 4;
                      } else {
                        var nextQ = 7;
                      }
                      handleSelect({ text: "", nextQuestion: nextQ });
                    }}
                    className="btn-retry group max-h-10 max-md:mt-10 md:max-h-72 w-full md:max-w-min flex flex-col items-center justify-center mt-auto"
                  >
                    Next
                  </button>
                </div>
              ) : (
                questions[current].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className="btn-option group min-h-40 md:min-h-72 flex flex-col items-center justify-center"
                  >
                    <span className="relative z-10 text-lg">{opt.text}</span>
                  </button>
              )))
              }
            </div>
          </div>
        </div>
        ) : (
          <div className="result-card fade-in relative bg-white/10 backdrop-blur-md rounded-2xl p-12 shadow-2xl text-center border border-white/20 max-w-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2">You're Matched With:</h2>
            <div className="my-8 h-1 w-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto"></div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-8">
              <span className={result == "AD-HOC [REDACTED]"? "text-black bg-black" : ""}>{result}</span>
            </p>
            <p className="my-8"> <span className={result == "AD-HOC [REDACTED]"? "text-black bg-black" : ""}>{committeeDescriptions[result]}</span></p>
            <button
              onClick={() => {
                setCurrent(0);
                setAnswers([]);
                setResult(null);
                setQuestionNumber(1);
              }}
              className="btn-retry"
            >
              Try Again
            </button>
          </div>
        ))}

      <style jsx>{`
        #LOGO{
          top:-10%;
          position: relative;
          margin-right: 18px;
          width: 60px;
          height: 60px;
          background: url(https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/9b852e368aceaf885c8e672aa83c8a2ac7ef2500a81335c7356c6732d175beda/whiteSmallLogo.png&w=3840&q=75) no-repeat center;
          background-size: contain;
        }
        .btn-option {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        .btn-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        .btn-option:hover::before {
          left: 100%;
        }
        .btn-option:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .btn-retry {
          padding: 14px 32px;
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          color: white;
          border-radius: 10px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
        }
        .btn-retry:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -80px) scale(1.1);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}