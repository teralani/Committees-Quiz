"use client";
import { useState, useEffect, useRef } from "react";
import { Montserrat } from "next/font/google";
import committees from "@/public/committees.json";
import Magnet from "@/components/magneticButton";
import Link from "next/link";

// --- QUIZ DATA ---
type Question = {
  text: string;
  options: { text: string; tags: Array<string>; range?: number }[];
  slider?: boolean;
  max?: number;
};

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const questions: Question[] = [
  {
    text: "How many conferences have you attended?",
    options: [
      { text: "Introductory", range: 2, tags: ["UNODC", "UNECA", "UNCLOS"] },
      { text: "Intermediate", range: 4, tags: ["UNPFII", "UNCLOS", "ECC", "NCOG"] },
      { text: "Intermediate+", range: 6, tags: ["LoN", "C-3301", "FCC", "TSR"] },
      { text: "Advanced", tags: ["AD-HOC", "H-CAB", "LoI"] },
    ],
    slider: true,
    max: 8,
  },
  {
    text: "How many specialized or crisis committees have you attended?",
    options: [
      { text: "Introductory", range: 0, tags: ["ECC", "NCOG"] },
      { text: "Intermediate", range: 2, tags: ["C-3301", "FCC"] },
      { text: "Advanced", tags: ["AD-HOC", "H-CAB", "LoI"] },
    ],
    slider: true,
    max: 5,
  },
  {
    text: "What’s your favorite subject in school?",
    options: [
      { text: "History", tags: ["TSR", "LoN", "H-CAB", "AD-HOC", "LoI"] },
      { text: "Economics", tags: ["UNECA", "FCC", "NCOG", "UNODC"] },
      { text: "Math/Science", tags: ["ECC", "C-3301", "UNCLOS"] },
    ],
  },
  {
    text: "What type of debate style excites you the most?",
    options: [
      { text: "Formal, structured, clear rules", tags: ["UNODC", "UNECA"] },
      { text: "Formal with a few twists", tags: ["UNCLOS", "UNPFII", "LoN"] },
      { text: "Fast paced, crisis-driven", tags: ["ECC", "FCC", "LoI"] },
      {
        text: "Cabinet-style",
        tags: ["TSR", "C-3301", "AD-HOC", "H-CAB", "NCOG"],
      },
    ],
  },
  {
    text: "If you could time-travel, where would you go?",
    options: [
      { text: "Stay in the present day", tags: ["UNODC", "UNECA", "UNPFII", "FCC"] },
      { text: "20th century", tags: ["LoN", "NCOG", "AD-HOC", "H-CAB"] },
      { text: "The Ancient World", tags: ["LoI", "TSR"] },
      { text: "The Future", tags: ["ECC", "UNCLOS"] },
    ],
  },
];

const indexing = [
  "UNODC",
  "UNCLOS",
  "LoN",
  "UNECA",
  "UNPFII",
  "TSR",
  "NCOG",
  "C-3301",
  "AD-HOC",
  "H-CAB",
  "ECC",
  "FCC",
  "LoI",
];

export default function CommitteeQuizPage() {
  const [selectedOptions, setSelectedOptions] = useState<Array<number | null>>(
    Array(questions.length).fill(null)
  );
  const [sliderValues, setSliderValues] = useState<Array<number>>(
    Array(questions.length).fill(0)
  );
  const [results, setResults] = useState<
    { idx: number; name: string; percentage: number }[] | null
  >(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // confetti effect when results appear
  useEffect(() => {
    if (!results) return;
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
        opacity: 1-Math.random()*0.05,
        emoji: isEmoji ? (Math.random() < 0.5 ? "👑" : "🎉") : undefined,
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
        p.opacity -= 0.0005;
        if (p.y > canvas.height || p.opacity <= 0) {
          p.x = random(0, canvas.width);
          p.y = random(-canvas.height, -20);
          p.opacity = 1;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [results]);

  // — HANDLERS —
  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    const newSelections = [...selectedOptions];
    newSelections[qIdx] = optIdx;
    setSelectedOptions(newSelections);
  };

  const handleSliderChange = (qIdx: number, value: number) => {
    const newSliderVals = [...sliderValues];
    newSliderVals[qIdx] = value;
    setSliderValues(newSliderVals);

    const newSelections = [...selectedOptions];
    newSelections[qIdx] = value;
    setSelectedOptions(newSelections);
  };

  const goToNextQuestion = () => {
    if (questionNumber + 1 < questions.length) {
      setQuestionNumber(questionNumber + 1);
    } else {
      calculateResults();
    }
  };

  const goToPreviousQuestion = () => {
    if (questionNumber > 0) setQuestionNumber(questionNumber - 1);
  };

  const calculateResults = () => {
    const tally = Array(indexing.length).fill(0);
    // max possible = number of questions (each can give +1 per committee)
    const maxPossible = questions.length;

    selectedOptions.forEach((sel, idx) => {
      const question = questions[idx];
      if (question.slider && sel !== null) {
        question.options.forEach((opt) => {
          if (opt.range !== undefined && (sel as number) <= opt.range) {
            opt.tags.forEach((tag) => {
              const tid = indexing.indexOf(tag);
              if (tid !== -1) tally[tid]++;
            });
          }
        });
      } else if (sel !== null) {
        question.options[sel].tags.forEach((tag) => {
          const tid = indexing.indexOf(tag);
          if (tid !== -1) tally[tid]++;
        });
      }
    });

    // sort committees descending by score
    const sorted = [...tally]
      .map((score, idx) => ({ idx, score }))
      .sort((a, b) => b.score - a.score);

    const topThree = sorted.slice(0, 3).map(({ idx, score }) => ({
      idx,
      name: committees[idx].name,
      percentage: Math.round((score / maxPossible) * 100),
    }));

    setResults(topThree);
    localStorage.setItem("quizResults", JSON.stringify(topThree))
    window.location.href= "./results";
  };

  const progressPercent = (questionNumber / questions.length) * 100;


  return (
    <div className="relative flex flex-col items-center min-h-screen">
      {results !== null && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 max-h-screen max-w-screen" />}

      <nav className="h-16 flex justify-center align-center w-full bg-primary" >
          <div className="hidden md:block" id="LOGO"></div> 
          <h1 className="text-white text-2xl my-auto text-center mx-2">KINGMUN 2026 Committee Quiz</h1>
      </nav>

      {!results ? (
        <div className="relative max-md:mx-4 md:w-150 my-20 max-w-5xl">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">Question {questionNumber + 1}</span>
              <span className="text-sm font-semibold text-white">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <p className="text-xl md:text-2xl font-bold text-primary mb-6">
              {questions[questionNumber].text}
            </p>

            {/* --- Slider Question Block --- */}
            {questions[questionNumber].slider ? (
              <div className="flex flex-col items-center mt-10 gap-10 h-full">
                <p className="md:mt-8 mb-8 text-lg font-bold text-secondary">
                  {sliderValues[questionNumber] < questions[questionNumber].max!? sliderValues[questionNumber] : `${sliderValues[questionNumber]}+` } conference{sliderValues[questionNumber] == 1? "": "s"}
                </p>
                <input
                  type="range"
                  min={0}
                  max={questions[questionNumber].max!.toString()}
                  value={sliderValues[questionNumber]}
                  onChange={(e) =>
                    handleSliderChange(questionNumber, parseInt(e.target.value))
                  }
                  className="w-full accent-secondary slider-gradient md:mb-8"
                />

                <div className="relative md:mt-8 mb-2 flex justify-between w-full px-10">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={questionNumber <= 0}
                    className="btn-retry text-gray-500 shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center"
                  >
                    <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title>
                        <polyline style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}} points="328 112 184 256 328 400" ></polyline>
                      </g>
                    </svg>
                  </button>
                  <button
                    onClick={goToNextQuestion}
                    disabled={selectedOptions[questionNumber] === null}
                    className={`btn-retry ${questionNumber == questions.length - 1? "bg-primary text-white" : "text-gray-500"}  shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center`}
                  >
                    {questionNumber === questions.length - 1 ? "Submit" : <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title><polyline points="328 112 184 256 328 400" style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}}></polyline></g></svg>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {questions[questionNumber].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(questionNumber, idx)}
                      className={`max-md:text-sm btn-option p-3 md:p-5 ${
                        selectedOptions[questionNumber] === idx ? "selected" : ""
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                <div className="relative mt-8 mb-2 flex justify-between w-full px-10">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={questionNumber <= 0}
                    className="max-md:text-sm btn-retry text-gray-500 shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center"
                  >
                    <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title>
                        <polyline style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}} points="328 112 184 256 328 400" ></polyline>
                      </g>
                    </svg>
                  </button>
                  <button
                    onClick={goToNextQuestion}
                    disabled={selectedOptions[questionNumber] === null}
                    className={`max-md:text-sm btn-retry ${questionNumber == questions.length - 1 && selectedOptions[questionNumber] !== null? "bg-primary text-white" : "text-gray-500"} shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center`}
                  >
                    {questionNumber === questions.length - 1 ? "Submit" : <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title><polyline points="328 112 184 256 328 400" style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}}></polyline></g></svg>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-md:w-full md:max-w-400 result-card fade-in relative mb-10 md:my-30 backdrop-blur-md md:rounded-2xl max-md:py-12 md:p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-6">Top Committee Matches</h2>

          {results.map((r, i) => (
            <div key={i} className="mb-4 w-full bg-white px-10 pb-10 py-5 rounded-2xl">
              <div className="flex justify-between pb-2 align-middle w-full">
                <div
                  className="relative h-5 bg-linear-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${r.percentage}%` }}
                ><p className={`text-sm right-4 text-white font-bold absolute`}>{r.percentage}% match</p></div>
                
            </div>
            <div className="flex gap-10 max-md:flex-col">
              <img
                className="bg-blue-50 m-3 mb-0 aspect-square min-w-40 md:min-w-70 max-md:mx-auto"
                // src={`https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/0e1764c52a619ffa2c1a5839cfc459053b3e4c935da8744a659f918849f5aa99/${committees[r.idx].acronym.replaceAll("-", "")}%20committee%20photo.jpeg`}

                alt={committees[r.idx].acronym}
              />

              <div>
                <p className="text-left text-2xl font-bold text-primary my-2">
                  {r.name}
                </p>
                <p className="text-start text-gray-600">{committees[r.idx].description}</p>
                <p className={`rounded-full py-1 px-3 my-5 max-w-min ${committees[r.idx].difficulty == "Advanced"? 'text-red-600 bg-red-100' : committees[r.idx].difficulty == "Intermediate"? "text-yellow-600 bg-yellow-100" : "text-green-600 bg-green-100"}`}>{committees[r.idx].difficulty} </p>
                <p className="text-start font-bold mt-5">Topics: </p>
                <div className="my-2 flex max-w-min gap-3">
                  {committees[r.idx].topics.map((topic) => {
                    return (
                    <p className="rounded-full py-1 px-3 bg-gray-200">
                      {topic}
                    </p>)
                  })}
    
                </div>
                <Link target={"_blank"} href={`https://kingmun.org/committees/${committees[r.idx].acronym}`}>
                  <button className="w-full relative bottom-2 mt-7 rounded-lg p-3 bg-primary hover:bg-secondary">
                    <p className="text-white font-bold text-sm">Learn More</p>
                  </button>
                </Link>
              </div>
            </div>

            </div>
          ))}


          <Magnet
            padding={30}
            wrapperClassName="p-10"
          >
            <button
              onClick={() => {
                setSelectedOptions(Array(questions.length).fill(null));
                setSliderValues(Array(questions.length).fill(0));
                setResults(null);
                setQuestionNumber(0);
              }}
              className="bg-primary/80 backdrop-blur-lg text-white text-lg h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl shadow-secondary hover:bg-secondary"
            >
              Try Again
            </button>
          </Magnet>
        </div>
      )}

        <footer className="absolute bottom-0 min-h-14 flex justify-center w-full bg-secondary">
          <h2 className="text-white text-center my-auto">
            © {new Date().getFullYear()} King County Model United Nations. All Rights Reserved.
          </h2>
        </footer>

      <style jsx>{`
        * {
          font-family: ${montserrat.style.fontFamily};
          box-sizing: border-box;
        }
        h1 {
            font-weight: 700;
        }
        #LOGO{
            position: relative;
            width: 45px;
            height: auto;
            background: url(https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/9b852e368aceaf885c8e672aa83c8a2ac7ef2500a81335c7356c6732d175beda/whiteSmallLogo.png&w=3840&q=75) no-repeat center;
            background-size: contain;
        }
        #disclaimer {
            max-width: 700px;
            border-left-width: 12px;
            border-image: linear-gradient(to bottom, #2E4A20, #5b2950) 1;
        }
          
        .btn-option {
          width: 100%;
          flex: 1;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 2px solid rgba(100, 100, 100, 0.3);
          border-radius: 12px;
          // font-weight: 600;
          color: black;
          transition: all 0.3s ease;
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
          border-color: var(--color-primary);
          border-thickness: 5px;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .btn-option.selected {
          border-color: var(--color-primary);
          border-thickness: 5px;
          background: #f3fcf2;
        }
        .btn-retry:enabled {
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-retry:disabled {
          opacity: 0;
        }
        .btn-retry:enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px color-mix(in srgb, var(--color-primary) 50%, transparent);
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
      `}</style>
    </div>
  );
}
