"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import committees from "@/public/committees.json";
import { createBrowserClient } from "@supabase/ssr";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const indexing = (committees as Array<{name:string, acronym:string, description:string, difficulty:string, topics:Array<string>}>).map((committee => committee.acronym))

const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];

export default function CommitteeQuizPage() {
  const params = useParams();
  const rawSlug = (params.conference as string || 'kingmun').toLowerCase();
  const conferenceSlug = ALLOWED_SLUGS.includes(rawSlug) ? rawSlug : 'kingmun';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

  // type Data = {
  //     id: string;
  //     name: string;
  //     pages: {
  //         id: string;
  //         name: string;
  //         quiz_questions: {
  //             id: string;
  //             text: string;
  //             slider: boolean;
  //             max: number;
  //             question_options: {
  //                 id: string;
  //                 text: string;
  //                 range: number;
  //                 option_weights: {
  //                     weight: number;
  //                 }[];
  //             }[];
  //         }[];
  //     }[];
  // }[]

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Array<number | null>>([]);
  const [sliderValues, setSliderValues] = useState<Array<number>>([]);
  const [results, setResults] = useState<
    { idx: number; name: string; percentage: number }[] | null
  >(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [conferenceName, setConferenceName] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  async function fetchQuestions() {
    setLoading(true);
    try {
      // 1) Try nested select first (original approach that sometimes works)
      const { data: nestedData, error: nestedErr } = await supabase
        .from("conferences")
        .select(`
          id,
          name,
          pages (
            id,
            name,
            quiz_questions (
              id,
              text,
              slider,
              max,
              question_options (
                id,
                text,
                range,
                option_weights ( weight )
              )
            )
          )
        `)
        .eq("slug", conferenceSlug)
        .eq("pages.name", "Quiz")
        .limit(1)
        .maybeSingle();

      if (nestedErr) {
        console.debug("nested select returned error (continuing to fallback):", nestedErr);
      } else if (nestedData && Array.isArray(nestedData.pages) && nestedData.pages.length > 0) {
        // Build the exact nested shape the quiz UI expects
        setConferenceName(nestedData.name);
        const page = nestedData.pages.find((p: any) => p.name === "Quiz");
        const nestedQuestions = (page?.quiz_questions || []).map((qq: any) => ({
          id: qq.id,
          text: qq.text ?? "",
          slider: !!qq.slider,
          max: typeof qq.max === "number" ? qq.max : null,
          question_options: (qq.question_options || []).map((opt: any) => ({
            id: opt.id,
            text: opt.text ?? "",
            range: typeof opt.range === "number" ? opt.range : null,
            option_weights: (opt.option_weights || []).map((w: any) => ({ weight: Number(w?.weight ?? 0) })),
          })),
        }));

        setQuestions(nestedQuestions);
        setSelectedOptions(Array(nestedQuestions.length).fill(null));
        setSliderValues(Array(nestedQuestions.length).fill(0));
        setQuestionNumber(0);
        setLoading(false);
        return;
      }

      // 2) Fallback to explicit, ordered per-table queries (stable and predictable)
      // Resolve conference id
      const { data: confRow, error: confErr } = await supabase
        .from("conferences")
        .select("id, name")
        .eq("slug", conferenceSlug)
        .limit(1)
        .maybeSingle();
      if (confErr || !confRow) {
        console.error("conference query failed:", confErr);
        setQuestions([]);
        setLoading(false);
        return;
      }
      const confId = confRow.id;
      setConferenceName(confRow.name);

      // Resolve page id
      const { data: pageRow, error: pageErr } = await supabase
        .from("pages")
        .select("id")
        .eq("conference_id", confId)
        .eq("name", "Quiz")
        .limit(1)
        .maybeSingle();
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
        .select("id, text, slider, max")
        .eq("page_id", pageId)
        .order("position", { ascending: true });

      if (qErr) {
        console.error("fetch quiz_questions error:", qErr);
        setQuestions([]);
        setLoading(false);
        return;
      }

      const assembled: any[] = [];
      for (const qq of questionsRows || []) {
        // Fetch options for this question in stable order
        let { data: optsRows, error: optErr } = await supabase
          .from("question_options")
          .select("id, text, range")
          .eq("question_id", qq.id)
          .order("position", { ascending: true });

        if (optErr) {
          console.error("fetch question_options error (per-row):", optErr);
          // Attempt a nested fallback for this question specifically
          try {
            const { data: nested2, error: nested2Err } = await supabase
              .from("conferences")
              .select(`
                pages (
                  id,
                  quiz_questions (
                    id,
                    question_options (
                      id,
                      text,
                      range,
                      option_weights ( weight )
                    )
                  )
                )
              `)
              .eq("slug", conferenceSlug)
              .eq("pages.id", pageId)
              .eq("pages.quiz_questions.id", qq.id)
              .limit(1);

            if (nested2Err) {
              console.error("nested fallback for options failed:", nested2Err);
              optsRows = [];
            } else {
              optsRows = nested2?.[0]?.pages?.[0]?.quiz_questions?.[0]?.question_options || [];
            }
          } catch (e) {
            console.error("exception in nested fallback for options:", e);
            optsRows = [];
          }
        }

        const qOptions: any[] = [];
        for (const opt of optsRows || []) {
          // Fetch weights for this option in stable order
          const { data: weightsRows, error: wErr } = await supabase
            .from("option_weights")
            .select("weight")
            .eq("option_id", opt.id)
            .order("weight_index", { ascending: true });

          if (wErr) {
            console.error("fetch option_weights error for option", opt.id, ":", wErr?.message || wErr);
            // Still add the option with empty weights rather than stopping
            qOptions.push({
              id: opt.id,
              text: opt.text ?? "",
              range: typeof opt.range === "number" ? opt.range : null,
              option_weights: [],
            });
            continue;
          }

          const optionWeights = (weightsRows || []).map((w: any) => ({ weight: Number(w?.weight ?? 0) }));

          qOptions.push({
            id: opt.id,
            text: opt.text ?? "",
            range: typeof opt.range === "number" ? opt.range : null,
            option_weights: optionWeights,
          });
        }

        assembled.push({
          id: qq.id,
          text: qq.text ?? "",
          slider: !!qq.slider,
          max: typeof qq.max === "number" ? qq.max : null,
          question_options: qOptions,
        });
        
        console.log(`Loaded question ${assembled.length}: "${qq.text}" with ${qOptions.length} options`);
      }

      setQuestions(assembled);
      setSelectedOptions(Array(assembled.length).fill(null));
      setSliderValues(Array(assembled.length).fill(0));
      setQuestionNumber(0);
      setLoading(false);
      
      // Debug: log loaded questions
      console.log("Loaded questions count:", assembled.length);
      console.log("Questions:", assembled.map(q => ({ text: q.text, optionsCount: q.question_options?.length })));
    } catch (err) {
      console.error("fetchQuestions unexpected error", err);
      setQuestions([]);
      setLoading(false);
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

    console.log(selectedOptions)
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
        question["question_options"].forEach((opt: any) => {
          if (opt.range !== undefined && (sel as number) <= opt.range) {
            if (opt["option_weights"]) {
              opt["option_weights"].forEach((w: any, committeeIdx: number) => {
                  // const weight = typeof w === "number" ? w : (w?.weight ?? 0);
                  tally[committeeIdx] += Number(w.weight);
              });
            }
          }
        });
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
    localStorage.setItem("quizResults", JSON.stringify(topThree));
    window.location.href = `/${conferenceSlug}/results`;
  };

  const progressPercent = questions.length ? (questionNumber / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="relative flex flex-col items-center min-h-screen">
        <nav className={`h-16 flex justify-center align-center w-full bg-${conferenceSlug}-primary`} >
          <div className="hidden md:block" id="LOGO"></div>
          <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </nav>
        <div className="relative max-md:mx-4 md:w-150 my-20 max-w-5xl">
          <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="relative flex flex-col items-center min-h-screen">
        <nav className={`h-16 flex justify-center align-center w-full bg-${conferenceSlug}-primary`}>
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

      <nav className="h-16 flex justify-center align-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}>
          <div className="hidden md:block" id="LOGO"></div> 
          <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} Committee Quiz</h1>
      </nav>
      <div className="relative max-md:mx-4 md:w-150 my-20 max-w-5xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-white">Question {questionNumber + 1} of {questions.length}</span>
            <span className="text-sm font-semibold text-white">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(to right, var(--color-${conferenceSlug}-primary), var(--color-${conferenceSlug}-secondary))`
              }}
            ></div>
          </div>
        </div>

        <div className="card fade-in bg-white backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <p className="text-xl md:text-2xl font-bold mb-6" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>
            {questions[questionNumber].text}
          </p>

          {/* --- Slider Question Block --- */}
          {questions[questionNumber].slider ? (
            <div className="flex flex-col items-center mt-10 gap-10 h-full">
              <p className="md:mt-8 mb-8 text-lg font-bold" style={{ color: `var(--color-${conferenceSlug}-secondary)` }}>
                {sliderValues[questionNumber] < questions[questionNumber]["max"]!? sliderValues[questionNumber] : `${sliderValues[questionNumber]}+` } conference{sliderValues[questionNumber] == 1? "": "s"}
              </p>
              <input
                type="range"
                min={0}
                max={questions[questionNumber]["max"]!.toString()}
                value={sliderValues[questionNumber]}
                onChange={(e) =>
                  handleSliderChange(questionNumber, parseInt(e.target.value))
                }
                className="w-full slider-gradient md:mb-8 h-3 bg-linear-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: `var(--color-${conferenceSlug}-secondary)` }}
              />

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


        <footer className="absolute bottom-0 min-h-14 flex justify-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-secondary)` }}>
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
          border-color: var(--color-${conferenceSlug}-primary);
          border-thickness: 5px;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .btn-option.selected {
          border-color: var(--color-${conferenceSlug}-primary);
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
          box-shadow: 0 6px 15px color-mix(in srgb, var(--color-${conferenceSlug}-primary) 50%, transparent);
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