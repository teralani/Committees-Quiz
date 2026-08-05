"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];

export default function CommitteeQuizPage() {
  const params = useParams();
  const router = useRouter()

  const rawSlug = (params.conference as string || 'kingmun').toLowerCase();
  const conferenceSlug = ALLOWED_SLUGS.includes(rawSlug) ? rawSlug : 'kingmun';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Array<number | null>>([]);
  const [sliderValues, setSliderValues] = useState<Array<number>>([]);
  const [results, setResults] = useState<
    { idx: number; name: string; percentage: number }[] | null
  >(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [conferenceName, setConferenceName] = useState<string>('');
  const [committees, setCommittees] = useState<any[]>([]);
  const [indexing, setIndexing] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  async function fetchQuestions() {
    setLoading(true);
    try {
      console.groupCollapsed(`[quiz] load questions for ${conferenceSlug}`);

      // Fetch committees first
      const { data: confRow, error: confErr } = await supabase
      .from("conferences")
      .select(`
        id,
        name,
        committees (
          id,
          name,
          acronym,
          description,
          difficulty,
          topics,
          img_url,
          position
        )
      `)
      .eq("slug", conferenceSlug)
      .maybeSingle();

    if (confErr || !confRow) {
      console.error("conference query failed:", confErr);
      setQuestions([]);
      setLoading(false);
      return;
    }

    setConferenceName(confRow.name);

    const comms = (confRow.committees || []).sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
    );

    setCommittees(comms);
    setIndexing(comms.map((c: any) => c.acronym));

    const confId = confRow.id;


      // Resolve page id
      const { data: pageRow, error: pageErr } = await supabase
        .from("pages")
        .select("id")
        .eq("conference_id", confId)
        .eq("name", "Quiz")
        .limit(1)
        .maybeSingle();
      // console.log("[quiz] quiz page row:", pageRow);
      if (pageErr || !pageRow) {
        console.error("page query failed:", pageErr);
        setQuestions([]);
        setLoading(false);
        return;
      }
      const pageId = pageRow.id;

      // Fetch questions in stable order
      const { data: questionsRows, error: qErr } = await supabase
      .from("quiz_questions")
      .select(`
        id,
        text,
        slider,
        max,
        position,
        question_options (
          id,
          text,
          range,
          position,
          option_weights (
            weight,
            weight_index
          )
        )
      `)
      .eq("page_id", pageId)
      .order("position", { ascending: true });

    if (qErr) {
      console.error("fetch quiz_questions error:", qErr);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const assembled = (questionsRows || []).map((q: any) => ({
      id: q.id,
      text: q.text ?? "",
      slider: !!q.slider,
      max: typeof q.max === "number" ? q.max : null,

      question_options: (q.question_options || [])
        .sort(
          (a: any, b: any) =>
            (a.position ?? 0) - (b.position ?? 0)
        )
        .map((opt: any) => ({
          id: opt.id,
          text: opt.text ?? "",
          range: typeof opt.range === "number"
            ? opt.range
            : null,

          option_weights: (opt.option_weights || [])
            .sort(
              (a: any, b: any) =>
                (a.weight_index ?? 0) - (b.weight_index ?? 0)
            )
            .map((w: any) => ({
              weight: Number(w.weight),
            })),
        })),
    }));

    setQuestions(assembled);
      setLoading(false);

    } catch (err) {
      console.error("fetchQuestions unexpected error", err);
      setQuestions([]);
      setLoading(false);
    } finally {
      console.groupEnd();
    }
  }

  fetchQuestions();
}, [supabaseUrl, supabaseKey]);

  // initialize selection arrays when questions load
  useEffect(() => {
    setSelectedOptions(Array(questions.length).fill(null));
    setSliderValues(Array(questions.length).fill(0));
    setQuestionNumber(0);
  }, [questions.length]);


  // — HANDLERS —
  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    const newSelections = [...selectedOptions];
    newSelections[qIdx] = optIdx;
    setSelectedOptions(newSelections);

    // console.log(selectedOptions)
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

    selectedOptions.forEach((sel, qIdx) => {
      const question = questions[qIdx];

      if (!question) return;

      if (question.slider && sel !== null) {
        const sliderBands = question["question_options"]
          .filter((opt: any) => typeof opt.range === "number")
          .slice()
          .sort((a: any, b: any) => a.range - b.range);

        const selectedBand =
          sliderBands.find((opt: any) => (sel as number) <= opt.range) ?? sliderBands[sliderBands.length - 1];

        if (selectedBand && selectedBand["option_weights"]) {
          selectedBand["option_weights"].forEach((w: any, committeeIdx: number) => {
              tally[committeeIdx] += Number(w.weight);
          });
        }
      } else if (sel !== null) {
        const chosen = question["question_options"][sel];
        if (chosen && chosen["option_weights"]) {
          chosen["option_weights"].forEach((w: any, committeeIdx: number) => {
              // const weight = typeof w === "number" ? w : (w?.weight ?? 0);
              tally[committeeIdx] += Number(w.weight);
          });
        }
      }
    });

    const temperature = 1;

    const highestRaw = Math.max(...tally);

    const scaledScores = tally.map((s) => Math.pow(s, 1 / temperature));

    const percentages = scaledScores.map((val) =>
      highestRaw > 0 ? Math.round((val / Math.pow(highestRaw, 1 / temperature)) * 10000)/100 : 0
    );

    const scored = tally.map((score, idx) => ({
      idx,
      score,
      name: committees[idx].name,
      percentage: percentages[idx],
    }));

    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const topThree = sorted.slice(0, 3);

    setResults(topThree);
    localStorage.setItem(`quizResults-${conferenceSlug}`, JSON.stringify(topThree));
    // window.location.href = `/${conferenceSlug}/results`
    
    router.push(`/${conferenceSlug}/results`)
    
    
  };

  const progressPercent = questions.length ? (questionNumber / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="relative flex flex-col items-center min-h-screen">
        <nav className="h-16 flex justify-center align-center w-full bg-(--quiz-primary)" >
        <a href={`/${conferenceSlug}`} className="flex justify-center align-center">
          <div className="hidden md:block quiz-page-logo"></div>
          <h1 className="font-bold text-white text-xl md:text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </a>
      </nav>
      <div className="relative max-md:mx-4 w-full px-4 md:w-150 mt-20 max-w-5xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 h-5">
            {/* <span className="text-sm font-semibold text-white">Question {questionNumber + 1} of {questions.length}</span>
            <span className="text-sm font-semibold text-white">{Math.round(progressPercent)}%</span> */}
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-(--quiz-primary) to-(--quiz-secondary)"
              style={{ 
                width: `${progressPercent}%`,
              }}
            ></div>
          </div>
        </div>
        </div>

        <div className="relative max-md:mx-4 md:w-140 max-w-5xl">
          <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 h-120">
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="relative flex flex-col items-center min-h-screen">
        <nav className={`h-16 flex justify-center align-center w-full bg-(--quiz-primary)`}>
          <div className="hidden md:block" id="LOGO"></div>
          <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </nav>
        <div className="relative max-md:mx-4 md:w-150 my-20 max-w-5xl">
          <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <p>No quiz available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen">
      {results !== null && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 max-h-screen max-w-screen" />}

      <nav className="h-16 flex justify-center align-center w-full bg-(--quiz-primary)" >
        <a href={`/${conferenceSlug}`} className="flex justify-center align-center">
          <div className="hidden md:block quiz-page-logo"></div>
          <h1 className="font-bold text-white text-xl md:text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </a>
      </nav>

      <div className="relative max-md:mx-4 w-full px-4 md:w-150 my-20 max-w-5xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-white">Question {questionNumber + 1} of {questions.length}</span>
            <span className="text-sm font-semibold text-white">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-(--quiz-primary) to-(--quiz-secondary)"
              style={{ 
                width: `${progressPercent}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <p className="text-xl md:text-2xl font-bold mb-6 text-(--quiz-primary)">
            {questions[questionNumber].text}
          </p>

          {/* --- Slider Question Block --- */}
          {questions[questionNumber].slider ? (
            <div className="flex flex-col items-center mt-10 gap-10 h-full">
              <p className="md:mt-8 mb-8 text-lg font-bold text-(--quiz-primary)" >
                {sliderValues[questionNumber] < questions[questionNumber]["max"]!? sliderValues[questionNumber] : `${sliderValues[questionNumber]}+` } conference{sliderValues[questionNumber] == 1? "": "s"}
              </p>
              <div className="w-full md:mb-8 relative">
                <div className="flex bg-linear-to-r from-green-200 via-yellow-200 to-red-200 h-3 rounded-full w-full justify-between px-1.5">{Array.from({ length: questions[questionNumber]["max"] + 1 }, (_, i) => (
                  <div key={i} className="h-1 w-1 my-auto rounded-full bg-gray-400"></div>
                ))}</div>
                <input
                  type="range"
                  min={0}
                  max={questions[questionNumber]["max"]!.toString()}
                  value={sliderValues[questionNumber] ?? 0}
                  onChange={(e) =>
                    handleSliderChange(questionNumber, parseInt(e.target.value))
                  }
                  className="-mt-3 absolute w-full slider-gradient h-3 rounded-lg appearance-none cursor-pointer accent-(--quiz-secondary)"
                />
              </div>
              
              

              <div className="relative md:mt-8 mb-2 flex justify-between w-full px-10">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={questionNumber <= 0}
                  className="btn-retry text-gray-500 shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center"
                >
                  <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title>
                      <polyline style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}} points="328 112 184 256 328 400" ></polyline>
                    </g>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if(selectedOptions[questionNumber] === null) {
                      handleSliderChange(questionNumber, 0)
                    }
                    goToNextQuestion()
                  }}
                  className={`btn-retry ${questionNumber == questions.length - 1? "bg-kingmun-primary text-white" : "text-gray-500"}  shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center`}
                >
                  {questionNumber === questions.length - 1 ? "Submit" : <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform=""><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M184 112l144 144-144 144"/></svg>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {questions[questionNumber]["question_options"].map((opt: any, idx: number) => (
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
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier"><title>ionicons-v5-a</title>
                      <polyline style={{fill: "none", stroke: "#6a7282", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "48px"}} points="328 112 184 256 328 400" ></polyline>
                    </g>
                  </svg>
                </button>
                <button
                  onClick={goToNextQuestion}
                  disabled={selectedOptions[questionNumber] === null}
                  className={`max-md:text-sm btn-retry ${questionNumber == questions.length - 1 && selectedOptions[questionNumber] !== null? "bg-kingmun-primary text-white" : "text-gray-500"} shadow-md shadow-gray-400 max-h-72 max-w-min flex flex-col items-center justify-center`}
                >
                  {questionNumber === questions.length - 1 ? "Submit" : <svg width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform=""><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M184 112l144 144-144 144"/></svg>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>


        <footer className="absolute bottom-0 min-h-14 flex justify-center w-full bg-(--quiz-secondary)">
          <h2 className="text-white text-center my-auto">
            © {new Date().getFullYear()} Model United Nations Northwest. All Rights Reserved.
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
          border-color: var(--quiz-primary);
          border-thickness: 5px;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .btn-option.selected {
          border-color: var(--quiz-primary);
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
          box-shadow: 0 6px 15px color-mix(in srgb, var(--quiz-primary) 50%, transparent);
        }
      `}</style>
    </div>
  );
}