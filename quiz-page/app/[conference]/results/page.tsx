"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import Magnet from "@/components/magneticButton";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import FAQ from "@/components/faq";
import CommitteeResultCard from "@/components/resultCard";

import dynamic from "next/dynamic";

const Confetti = dynamic(
  () => import("@/components/confetti"),
  {
    ssr: false
  }
);

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];
const LINKS: { [key: string]: string } = {
  "kingmun": "kingmun.org",
  "edumun": "edumun.com",
  "pacmun": "pacificmun.com",
  "seattlemun": "seattlemun.org",
}

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
  const conferenceSlug = useMemo(() => {
    const slug = (params.conference as string || "kingmun").toLowerCase();
    return ALLOWED_SLUGS.includes(slug) ? slug : "kingmun";
  }, [params]);

  const conferenceName = conferenceSlug.toUpperCase();

  const [results, setResults] = useState<{ idx: number; name: string; percentage: number }[] | null>(null);

  const [loading, setLoading] = useState(true)
  const [committees, setCommittees] = useState<Committee[]>([])


  useEffect(() => {
    async function fetchCommittees() {

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { data, error } = await supabase
        .from("conferences")
        .select(`
          committees(
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


      if (!error) {
        setCommittees(data?.committees ?? []);
      }

      setLoading(false);
    }

    fetchCommittees();

  }, [conferenceSlug]);

  const resolveCommittee = (r: { idx: number; name: string }) => {
    return committeeMap.get(r.name)
  }
  const committeeMap = useMemo(() => {
    const map = new Map<string, Committee>();

    committees.forEach((committee) => {
      map.set(committee.name, committee);
      map.set(committee.acronym, committee);
    });

    return map;
  }, [committees]);

  useEffect(() => {
    const stored = localStorage.getItem(`quizResults-${conferenceSlug}`);
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  const clearResults = () => {
    localStorage.removeItem("quizResults");
    window.location.href = `/${conferenceSlug}`;
  };

  const resultCards = useMemo(() => {
    if (!results) return [];

    return results.map((r, i) => {
      const committee = committeeMap.get(r.name);

      return {
        key: r.idx,
        result: r,
        committee,
        index: i,
        link: `https://${LINKS[conferenceSlug]}/committees/${(
          committee?.acronym || ""
        ).toLowerCase()}`,
      };
    });
  }, [results, committeeMap, conferenceSlug]);

  return (
    <div
      className={`relative flex flex-col items-center min-h-screen overflow-x-clip ${montserrat.variable}`}
      style={{
        ["--quiz-primary" as string]: `var(--color-${conferenceSlug}-primary)`,
        ["--quiz-secondary" as string]: `var(--color-${conferenceSlug}-secondary)`,
        ["--quiz-logo" as string]: `var(--${conferenceSlug}-logo)`,
      } as React.CSSProperties}
    >
      <Confetti></Confetti>

      <nav className="h-16 flex justify-center align-center w-full bg-(--quiz-primary)" >
        <a href={`/${conferenceSlug}`} className="flex justify-center align-center">
          <div className="hidden md:block quiz-page-logo"></div>
          <h1 className="font-bold text-white text-xl md:text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </a>
      </nav>

      <div className="max-md:w-full md:max-w-400 result-card fade-in relative mb-10 md:my-30 backdrop-blur-md md:rounded-2xl max-md:py-12 md:p-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl max-md:text-2xl font-bold text-white mb-6">Top Committee Matches</h2>


        {loading ?
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
              wrapperClassName="p-10 max-md:mb-0 mb-10 "
            >
              <Link href={`/${conferenceSlug}`}>
                <button
                  onClick={clearResults}
                  className="shadow-[0_0px_15px_var(--quiz-secondary)]  backdrop-blur-lg bg-(--quiz-primary)/80 hover:bg-(--quiz-secondary) text-white md:text-lg text-sm h-14 md:h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 "
                >
                  Try Again
                </button>
              </Link>
            </Magnet>

            {conferenceSlug == "edumun" && (
              <FAQ
                header="What is the difference between seminars and committees?"
                body="Seminars are designed to help delegates develop the knowledge and skills needed to succeed in Model UN. Beginner Seminars introduce the fundamentals of MUN, including the Rules of Procedure, Flow of Debate, and position paper writing, before concluding with a Capstone session where delegates can apply their learning. Advanced Seminars are intended for delegates with prior MUN experience who are ready to explore more complex committee formats, such as Specialized, Cabinet, and Crisis committees. Committees are intended for delegates who already have a strong understanding of MUN procedures and are prepared to engage directly in debate."
              />
            )}


            {resultCards.map((card) => (
              <CommitteeResultCard
                key={card.key}
                result={card.result}
                committee={card.committee}
                index={card.index}
                conferenceSlug={conferenceSlug}
                showPercentage={true}
                committeeLink={card.link}
              />
            ))
            }
          </>
        }

        <div
          id="disclaimer"
          className="
                mx-10 md:mx-auto max-w-175 my-10 min-h-20
                flex flex-col justify-center
                rounded-lg bg-white/88 p-6
                shadow-[0_25px_50px_-12px_rgba(0,0,0,1)]
                transition-all duration-300
                hover:scale-105
                hover:shadow-[0_20px_25px_-5px_var(--quiz-primary)]
              "
        >
          <div className="flex">
            <svg className="h-6 w-6 mr-2 text-(--quiz-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
            </svg>
            <h1 className="font-bold text-xl mb-2 text-(--quiz-primary)" >Disclaimer & Contact</h1>
          </div>

          <p className="max-md:text-xs text-sm mb-3 text-(--quiz-primary)">
            Disclaimer: This quiz is intended for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
          </p>
          <p className="max-md:text-xs text-sm text-(--quiz-primary)">For questions, feedback, or further guidance, contact us at <a className="underline " href={conferenceSlug == "edumun" ? `mailto:delegates@${LINKS[conferenceSlug]}` : `mailto:da@${LINKS[conferenceSlug]}`}>{conferenceSlug == "edumun" ? "delegates" : "da"}@{LINKS[conferenceSlug]}</a>.</p>
        </div>
      </div>


      <footer className="absolute bottom-0 min-h-16 md:min-h-14 flex justify-center w-full bg-(--quiz-secondary)">
        <h2 className="text-white text-center my-auto">
          © {new Date().getFullYear()} Model United Nations Northwest. All Rights Reserved.
        </h2>
      </footer>
    </div>
  );
}
