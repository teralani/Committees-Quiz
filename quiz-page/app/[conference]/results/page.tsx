"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import Magnet from "@/components/magneticButton";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];

type Committee = 
  {
    id: string;
    name: string;
    acronym: string;
    description: string;
    difficulty: string;
    topics: string[];
    img_url: string;
  }

export default function CommitteeQuizPage() {
  const params = useParams();
  const rawSlug = (params.conference as string || 'kingmun').toLowerCase();
  const conferenceSlug = ALLOWED_SLUGS.includes(rawSlug) ? rawSlug : 'kingmun';
  const conferenceName = conferenceSlug.toUpperCase();
  
  const [results, setResults] = useState<{ idx: number; name: string; percentage: number }[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showPercentage = true;
  
  const [loading, setLoading] = useState(true)
  const [committees, setCommittees] = useState<Committee[]>([])
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
          console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
          setLoading(false);
          return;
        }
        const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    
        async function fetchCommittees() {
          try {
            const { data: committeesData, error: committeesErr } = await supabase
              .from("conferences")
              .select(`
                committees (
                  id,
                  name,
                  acronym,
                  description,
                  difficulty,
                  topics,
                  img_url
                )
              `)
              .eq("slug", conferenceSlug)
              .maybeSingle();
    
            if (!committeesErr && committeesData) {
              setCommittees(committeesData.committees || []);
              setLoading(false);
              console.log(committeesData.committees)
            }
          } catch (err) {
            console.error("Error fetching committees:", err);
          } finally {
            console.log(committees)
          }
        }
        fetchCommittees();

  }, [conferenceSlug])

  // Resolve a committee for a result entry safely (by name or acronym)
  const resolveCommittee = (r: { idx: number; name: string }) => {
    if (!committees || committees.length === 0) return undefined;
    return committees.find(c => c.name === r.name || c.acronym === r.name);
  }

  useEffect(() => {
  
    const stored = localStorage.getItem("quizResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
    const MAX_PARTICLES = isMobile ? 80 : 200;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      tilt: number;
      tiltAngle: number;
      tiltAngleIncrement: number;
      emoji?: string;
    };

    const colors = [
      "DodgerBlue", "OliveDrab", "Gold", "pink", "SlateBlue",
      "lightblue", "Violet", "PaleGreen", "SteelBlue",
      "SandyBrown", "Chocolate", "Crimson"
    ];

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    // Create initial particles
    let particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        x: random(0, canvas.width),
        y: random(-canvas.height, 0),
        r: random(10, 30),
        d: random(10, MAX_PARTICLES),
        color: colors[i % colors.length],
        tilt: random(-10, 10),
        tiltAngle: 0,
        tiltAngleIncrement: random(0.05, 0.12),
        emoji: Math.random() < 0.25
          ? (Math.random() < 0.5 ? "🎉" : "👑")
          : undefined,
      });
    }

    let angle = 0;
    let animationFrameId: number;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Update particles
      particles = particles.filter((p) => {
        // update tilt
        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        // draw
        if (p.emoji) {
          ctx!.font = `${p.r * 0.7}px serif`;
          ctx!.fillText(p.emoji, p.x + p.tilt, p.y);
        } else {
          ctx!.beginPath();
          ctx!.lineWidth = p.r / 2;
          ctx!.strokeStyle = p.color;
          ctx!.moveTo(p.x + p.tilt + p.r / 4, p.y);
          ctx!.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
          ctx!.stroke();
        }

        // update position
        p.y += (Math.cos(angle + p.d) + 2 + p.r / 2) * 2 / 2.5;
        p.x += Math.sin(angle) * 2;

        // keep only if still onscreen
        const onScreen = !(p.x > canvas!.width + 20 || p.x < -20 || p.y > canvas!.height);
        return onScreen;
      });

      // stop when no particles left
      if (particles.length === 0) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      angle += 0.01;
      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  const clearResults = () => {
      localStorage.removeItem("quizResults");
      window.location.href = `/${conferenceSlug}`;
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-x-clip">
        {<canvas ref={canvasRef} className="pointer-events-none fixed inset-0 max-h-screen max-w-screen w-screen h-screen" />}

        <nav className="h-20 md:h-16 flex justify-center align-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}>
            <div className="hidden md:block" id="LOGO"></div> 
            <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </nav>

        <div className="max-md:w-full md:max-w-400 result-card fade-in relative mb-10 md:my-30 backdrop-blur-md md:rounded-2xl max-md:py-12 md:p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-6">Top Committee Matches</h2>


          {loading? 
          <div className="h-40 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
                    <p className="text-xl font-semibold text-white">Loading {conferenceSlug.toUpperCase()} quiz results...</p>
                </div>
            </div>

          :
          <>
            <Magnet
              padding={30}
              wrapperClassName="p-10 my-10 "
            >
              <Link href={`/${conferenceSlug}`}>
                  <button
                      onClick={clearResults}
                      className="backdrop-blur-lg text-white text-lg h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl"
                      style={{ 
                          backgroundColor: `color-mix(in srgb, var(--color-${conferenceSlug}-primary) 80%, transparent)`,
                          boxShadow: `0 0 15px var(--color-${conferenceSlug}-secondary)` 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-${conferenceSlug}-secondary)`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-${conferenceSlug}-primary) 80%, transparent)`}
                      >
                      Try Again
                  </button>
              </Link>
            </Magnet>

         {results && results.map((r, i) => {
          const committee = resolveCommittee(r);
          if (!committee) console.warn('No committee found for result:', r);
          return (
            <div key={i} className="mb-4 w-full bg-white md:pr-10 md:pl-5 max-md:px-10 pb-10 py-5 rounded-2xl">
              <div className="flex justify-between pb-2 align-middle w-full">
                <div
                  className={`${showPercentage? "" : "hidden"} relative h-7 md:h-5 rounded-r-full md:rounded-full transition-all duration-500`}
                  style={{ 
                    width: `${r.percentage}%`,
                    background: `linear-gradient(to right, var(--color-${conferenceSlug}-primary), var(--color-${conferenceSlug}-secondary))`
                  }}
                ><p className={`text-sm right-4 text-white font-bold absolute max-md:mt-1`}>{r.percentage}% match</p></div>
                
            </div>
            <div className="flex gap-8 lg:mt-3 md:gap-10 max-md:flex-col">
                <div className="max-md:relative max-md:-top-10.5 max-md:-left-8 max-md:h-0 md:min-h-max w-0 md:flex md:flex-col md:justify-around md:align-middle">
                    <div className="text-center font-bold flex flex-col justify-around text-white rounded-full text-2xl w-10 h-10" style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}>{i+1}</div>
                </div>
              <div className="bg-blue-50 md:ml-6 my-auto max-md:w-full h-60 md:aspect-square lg:h-60 lg:w-60 xl:h-70 xl:w-70 md:h-50 md:w-50 max-md:mx-auto">
                {committee?.img_url ? (
                  <img
                      className="card-img object-cover h-full w-full"
                      src={committee.img_url}
                      alt={committee.acronym || ''}
                  />
                ) : (
                  <div className="card-img object-cover h-full w-full" />
                )}
              </div>

              <div className="w-full">
                <p className="text-left text-2xl font-bold my-2" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>
                  {r.name}
                </p>
              <p className="md:text-sm lg:text-md  text-start text-gray-600">{committee?.description || ''}</p>
              <p className={`rounded-full py-1 px-3 my-5 max-w-min ${committee?.difficulty == "Advanced"? 'text-red-600 bg-red-100' : committee?.difficulty == "Intermediate"? "text-amber-600 bg-amber-100" : "text-green-700 bg-green-100"}`}>{committee?.difficulty || ''} </p>
              <p className="text-start font-bold mt-5">Topic{(committee?.topics?.length || 0)>1? "s" : ""}: </p>
              <div className="my-2 flex gap-3 w-full flex-wrap">
                {(committee?.topics || []).map((topic, idx) => {
                  return (
                    <p key={idx} className="rounded-full py-1 px-3 bg-gray-200">
                      {topic}
                    </p>
                  )
                })}
  
              </div>
              <Link href={`https://kingmun.org/committees/${(committee?.acronym || '').toLowerCase()}`} target="_blank">
                <button 
                  className="w-full relative bottom-2 mt-7 rounded-lg p-3 hover:-translate-y-0.5  transition"
                  style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-${conferenceSlug}-secondary)`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-${conferenceSlug}-primary)`}
                >
                  <p className="text-white font-bold text-sm">Learn more about {committee?.acronym || ''}</p>
                  </button>
                </Link>
              </div>
            </div>

            </div>
          )
          })}
            </>
          }

            <div id="disclaimer" className="flex-col mx-10 md:mx-auto max-w-175 my-10 min-h-20 bg-white/88 flex justify-center p-6 rounded-lg shadow-2xl shadow-black transition transform duration-300 hover:scale-105 hover:shadow-xl" onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 20px 25px -5px var(--color-${conferenceSlug}-primary)`} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 1)'}>
                <div className="flex">
                    <svg className="h-6 w-6 mr-2" style={{ color: `var(--color-${conferenceSlug}-primary)` }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
                </svg>
                <h1 className="font-bold text-xl mb-2" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>Disclaimer & Contact</h1>
                </div>
                
                <p className="text-sm mb-3" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>
                    Disclaimer: This quiz is intended for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
                </p>
                <p className="text-sm" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>For questions, feedback, or further guidance, contact us at <a className="underline" style={{ color: `var(--color-${conferenceSlug}-secondary)` }} href={`mailto:da@${rawSlug == "kingmun" || rawSlug == "seattlemun"? `${rawSlug}.org` : `${rawSlug}.com`}`}>da@{rawSlug == "kingmun" || rawSlug == "seattlemun"? `${rawSlug}.org` : `${rawSlug}.com`}</a>.</p>
            </div>
        </div>


        <footer className="absolute bottom-0 min-h-16 md:min-h-14 flex justify-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-secondary)` }}>
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
            border-image: linear-gradient(to bottom, var(--color-${conferenceSlug}-primary), var(--color-${conferenceSlug}-secondary)) 1;
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
          box-shadow: 0 6px 15px color-mix(in srgb, var(--color-kingmun-primary) 50%, transparent);
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
        .card-img {
          background: url(https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/9b852e368aceaf885c8e672aa83c8a2ac7ef2500a81335c7356c6732d175beda/whiteSmallLogo.png&w=3840&q=75) no-repeat center, var(--color-kingmun-primary);
          background-size: 10rem;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
