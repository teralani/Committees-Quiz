"use client";
import { useState, useEffect, useRef } from "react";
import { Montserrat } from "next/font/google";
import committees from "@/public/committees.json";
import Magnet from "@/components/magneticButton";
import Link from "next/link";
import { canvas } from "motion/react-client";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });


export default function CommitteeQuizPage() {
  const [results, setResults] = useState<
    { idx: number; name: string; percentage: number }[] | null
  >(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("quizResults");
    if(stored) {
        setResults(JSON.parse(stored))
    }

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
    
    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  
    const clearResults = () => {
    localStorage.removeItem("quizResults");
    window.location.href = "/";
    };

  return (
    <div className="relative flex flex-col items-center min-h-screen">
      {<canvas ref={canvasRef} className="pointer-events-none fixed inset-0 max-h-screen max-w-screen w-screen h-screen" />}

      <nav className="h-16 flex justify-center align-center w-full bg-primary" >
          <div className="hidden md:block" id="LOGO"></div> 
          <h1 className="text-white text-2xl my-auto text-center mx-2">KINGMUN 2026 Committee Quiz</h1>
      </nav>


        <div className="max-md:w-full md:max-w-400 result-card fade-in relative mb-10 md:my-30 backdrop-blur-md md:rounded-2xl max-md:py-12 md:p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-6">Top Committee Matches</h2>

          {results && results.map((r, i) => (
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

              <div className="w-full">
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
                <Link href={`https://kingmun.org/committees/${committees[r.idx].acronym}`} target="_blank">
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
            <Link href={"./quiz"}>
                <button
                    onClick={clearResults}
                    className="bg-primary/80 backdrop-blur-lg text-white text-lg h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl shadow-secondary hover:bg-secondary"
                    >
                    Try Again
                </button>
            </Link>
          </Magnet>
        </div>

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
