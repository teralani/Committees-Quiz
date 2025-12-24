"use client";
import { useState, useEffect, useRef } from "react";
import { Montserrat } from "next/font/google";
import committees from "@/public/committees.json";
import Magnet from "@/components/magneticButton";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });


export default function CommitteeQuizPage() {
    const [results, setResults] = useState<{ idx: number; name: string; percentage: number }[] | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem("quizResults")
        if (stored) {
            setResults(JSON.parse(stored))
        }

        var isMobile = window.matchMedia("only screen and (max-width: 760px)").matches
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas dimensions
        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        })

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        type Particle = {
            x: number;
            y: number;
            r: number;
            d: number;
            color: string;
            tilt: number;
            tiltAngleIncrement: number;
            tiltAngle: number;
            emoji?: string;
        };

        const colors = [
            "DodgerBlue", "OliveDrab", "Gold", "pink", "SlateBlue",
            "lightblue", "Violet", "PaleGreen", "SteelBlue",
            "SandyBrown", "Chocolate", "Crimson"
        ];

        const particles: Particle[] = [];
        const mp = isMobile? 80 : 200; // max particle count

        function random(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        // Initialize particles
        for (let i = 0; i < mp; i++) {
            particles.push({
            x: random(0, canvas.width),
            y: random(-canvas.height, 0),
            r: random(10, 30),
            d: random(10, mp),
            color: colors[i % colors.length],
            tilt: random(-10, 10),
            tiltAngleIncrement: random(0.05, 0.12),
            tiltAngle: 0,
            emoji: Math.random() < 0.25
                ? (Math.random() < 0.5 ? "🎉" : "👑")
                : undefined,
            });
        }

        let angle = 0;
        let animationFrameId: number;

        function draw() {
            if(!ctx || !canvas) {return}
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, idx) => {
            // update tilt angle
            p.tiltAngle += p.tiltAngleIncrement;

            // update tilt (bending/rotation)
            p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

            // Draw either emoji or line confetti
            if (p.emoji) {
                // draw an emoji centered at particle
                ctx.font = `${p.r * 0.7}px serif`;
                ctx.fillText(p.emoji, p.x + p.tilt, p.y);
            } else {
                ctx.beginPath();
                ctx.lineWidth = p.r / 2;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + (p.r / 4), p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 4));
                ctx.stroke();
            }

            // update physics
            p.y += (Math.cos(angle + p.d) + 2 + p.r / 2) / 3;
            p.x += Math.sin(angle);

            // reposition when off-screen
            if (p.x > canvas.width + 20 || p.x < -20 || p.y > canvas.height) {
                if (idx % 5 > 0 || idx % 2 === 0) {
                p.x = Math.random() * canvas.width;
                p.y = -10;
                } else {
                if (Math.sin(angle) > 0) {
                    p.x = -20;
                    p.y = Math.random() * canvas.height;
                } else {
                    p.x = canvas.width + 20;
                    p.y = Math.random() * canvas.height;
                }
                }
            }
            });

            angle += 0.01; // global drift

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

        <nav className="h-20 md:h-16 flex justify-center align-center w-full bg-primary" >
            <div className="hidden md:block" id="LOGO"></div> 
            <h1 className="text-white text-2xl my-auto text-center mx-2">KINGMUN 2026 Committee Quiz</h1>
        </nav>


        <div className="max-md:w-full md:max-w-400 result-card fade-in relative mb-10 md:my-30 backdrop-blur-md md:rounded-2xl max-md:py-12 md:p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-6">Top Committee Matches</h2>

          {results && results.map((r, i) => (
            <div key={i} className="mb-4 w-full bg-white md:pr-10 md:pl-5 max-md:px-10 pb-10 py-5 rounded-2xl">
              <div className="flex justify-between pb-2 align-middle w-full">
                <div
                  className="relative h-7 md:h-5 bg-linear-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${r.percentage}%` }}
                ><p className={`text-sm right-4 text-white font-bold absolute max-md:mt-1`}>{r.percentage}% match</p></div>
                
            </div>
            <div className="flex gap-8 lg:mt-3 md:gap-10 max-md:flex-col">
                <div className="max-md:relative max-md:-top-10.5 max-md:h-0 md:min-h-max w-0 md:flex md:flex-col md:justify-around md:align-middle">
                    <div className="text-center font-bold flex flex-col justify-around text-white rounded-full bg-primary text-2xl w-10 h-10">{i+1}</div>
                </div>
              <div className="bg-blue-50 md:ml-6 my-auto max-md:w-full h-60 md:aspect-square lg:h-60 lg:w-60 xl:h-70 xl:w-70 md:h-50 md:w-50 max-md:mx-auto">
                <img
                    className="object-fill h-full w-full"
                    // src={`https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/0e1764c52a619ffa2c1a5839cfc459053b3e4c935da8744a659f918849f5aa99/${committees[r.idx].acronym.replaceAll("-", "")}%20committee%20photo.jpeg`}

                    alt={committees[r.idx].acronym}
                />
              </div>

              <div className="w-full">
                <p className="text-left text-2xl font-bold text-primary my-2">
                  {r.name}
                </p>
                <p className="md:text-sm lg:text-md  text-start text-gray-600">{committees[r.idx].description}</p>
                <p className={`rounded-full py-1 px-3 my-5 max-w-min ${committees[r.idx].difficulty == "Advanced"? 'text-red-600 bg-red-100' : committees[r.idx].difficulty == "Intermediate"? "text-amber-600 bg-amber-100" : "text-green-700 bg-green-100"}`}>{committees[r.idx].difficulty} </p>
                <p className="text-start font-bold mt-5">Topics: </p>
                <div className="my-2 flex max-w-min gap-3">
                  {committees[r.idx].topics.map((topic, idx) => {
                    return (
                    <p key={idx} className="rounded-full py-1 px-3 bg-gray-200">
                      {topic}
                    </p>)
                  })}
    
                </div>
                <Link href={`https://kingmun.org/committees/${committees[r.idx].acronym.replace("-", "").toLowerCase()}`} target="_blank">
                  <button className="w-full relative bottom-2 mt-7 rounded-lg p-3 bg-primary hover:bg-secondary hover:-translate-y-0.5 transition">
                    <p className="text-white font-bold text-sm">Learn more about {committees[r.idx].acronym}</p>
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
            <Link href={{
                pathname: '/quiz'
            }}>
                <button
                    onClick={clearResults}
                    className="bg-primary/80 backdrop-blur-lg text-white text-lg h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl shadow-secondary hover:bg-secondary"
                    >
                    Try Again
                </button>
            </Link>
          </Magnet>
            <div id="disclaimer" className="flex-col mx-10 md:mx-auto max-w-175 my-10 min-h-20 bg-white/88 flex justify-center p-6 rounded-lg shadow-2xl shadow-black hover:shadow-primary transition transform duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex">
                    <svg className="h-6 w-6 text-[#2E4A20] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
                </svg>
                <h1 className="text-primary font-bold text-xl mb-2">Disclaimer & Contact</h1>
                </div>
                
                <p className="text-sm text-primary mb-3">
                    Disclaimer: This quiz is intended for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
                </p>
                <p className="text-sm text-primary">For questions, feedback, or further guidance, contact us at <a className="text-secondary underline" href="mailto:da@kingmun.org">da@kingmun.org</a>.</p>
            </div>
        </div>


        <footer className="absolute bottom-0 min-h-16 md:min-h-14 flex justify-center w-full bg-secondary">
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
