"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import Magnet from "@/components/magneticButton";
import { createBrowserClient } from "@supabase/ssr";
import FAQ from "@/components/faq";

import dynamic from "next/dynamic";
import Disclaimer from "@/components/disclaimer";
import CommitteeResultCardSkeleton from "@/components/resultCardSkeleton";
import CommitteeResultCard from "@/components/resultCard";

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
  const router = useRouter();
  const conferenceSlug = useMemo(() => {
    const slug = (params.conference as string || "kingmun").toLowerCase();
    return ALLOWED_SLUGS.includes(slug) ? slug : "kingmun";
  }, [params]);

  const [showConfetti, setShowConfetti] = useState(true);
  const conferenceName = conferenceSlug.toUpperCase();

  const [results, setResults] = useState<{ idx: number; name: string; percentage: number }[] | null>(null);

  const [committeesLoaded, setCommitteesLoaded] = useState(false)
  const [resultsLoaded, setResultsLoaded] = useState(false);

  const [committees, setCommittees] = useState<Committee[]>([])

  const isEdumun = conferenceSlug == 'edumun'

  useEffect(() => {
  import("@/components/resultCard");
}, []);

  useEffect(() => {
    async function fetchCommittees() {

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setCommitteesLoaded(false)
        setResultsLoaded(false)
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
      
      setCommitteesLoaded(true);
    }

    fetchCommittees();

  }, [conferenceSlug]);

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

    setResultsLoaded(true)
  }, [conferenceSlug]);


  const clearResults = useCallback(() => {
    localStorage.removeItem(`quizResults-${conferenceSlug}`);
    router.replace(`/${conferenceSlug}`);
  }, [conferenceSlug, router]); 

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

  const loading = !resultsLoaded || !committeesLoaded

  return (
    <div
      className={`relative flex flex-col items-center min-h-screen overflow-x-clip ${montserrat.variable}`}
      style={{
        ["--quiz-primary" as string]: `var(--color-${conferenceSlug}-primary)`,
        ["--quiz-secondary" as string]: `var(--color-${conferenceSlug}-secondary)`,
        ["--quiz-logo" as string]: `var(--${conferenceSlug}-logo)`,
      } as React.CSSProperties}
    >
      {showConfetti && <Confetti onComplete={()=>setShowConfetti(false)}/>}

      <nav className="h-16 flex justify-center align-center w-full bg-(--quiz-primary) z-50" >
        <a href={`/${conferenceSlug}`} className="flex justify-center align-center">
          <div className="hidden md:block quiz-page-logo"></div>
          <h1 className="font-bold text-white text-xl md:text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
        </a>
      </nav>

      <div className="max-md:w-full md:max-w-400 md:w-full result-card fade-in relative mb-10 md:my-30 md:rounded-2xl max-md:py-12 md:p-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl max-md:text-2xl font-bold text-white mb-6">Top Committee Matches</h2>

      
        {loading ?
          // <div className="h-40 flex items-center justify-center">
          //   <div className="text-center">
          //     <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
          //     <p className="text-xl font-semibold text-white">Loading {conferenceSlug.toUpperCase()} quiz results...</p>
          //   </div>
          // </div>
          <>
            <div
              className="p-10 max-md:mb-0 mb-10 flex justify-center "
            >
              <div>
                <div className="h-14 md:h-16 w-30 rounded-lg skeleton" />
              </div>
            </div>

            {conferenceSlug == "edumun" && (
              <div className="rounded-md py-4 px-2 bg-white mb-10 skeleton h-23"></div>
            )}

            {Array.from({ length: 3 }).map((_, i) => (
              <CommitteeResultCardSkeleton key={i} />
            ))}
          </>
          :
          <>
          {resultCards.length > 0? 

          <>
            <Magnet
              padding={30}
              wrapperClassName="p-10 max-md:mb-0 mb-10 "
            >
              <div>
                <button
                  onClick={clearResults}
                  className="shadow-[0_0px_15px_var(--quiz-secondary)] cursor-pointer bg-(--quiz-primary)/80 hover:bg-(--quiz-secondary) text-white md:text-lg text-sm h-14 md:h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 "
                >
                  Try Again
                </button>
              </div>
            </Magnet>

            { isEdumun && 
              <FAQ
                header="What is the difference between seminars and committees?"
                body="Seminars are designed to help delegates develop the knowledge and skills needed to succeed in Model UN. Beginner Seminars introduce the fundamentals of MUN, including the Rules of Procedure, Flow of Debate, and position paper writing, before concluding with a Capstone session where delegates can apply their learning. Advanced Seminars are intended for delegates with prior MUN experience who are ready to explore more complex committee formats, such as Specialized, Cabinet, and Crisis committees. Committees are intended for delegates who already have a strong understanding of MUN procedures and are prepared to engage directly in debate."
              />
            }

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
          :
          <div className="bg-white/80 bg-blur-2xl py-10 max-w-200 w-full md:mx-auto"><p className="text-lg md:text-2xl font-bold">Fill out our quiz first to view your results!</p> 

            <Magnet
              padding={30}
              wrapperClassName="p-10 my-auto"
            >
              <div>
                <button
                  onClick={() => {window.location.href = `/${conferenceSlug}/quiz`}}
                  className="shadow-[0_0px_15px_var(--quiz-secondary)] cursor-pointer bg-(--quiz-primary)/80 hover:bg-(--quiz-secondary) text-white md:text-lg text-sm h-14 md:h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 "
                >
                  Take our quiz
                </button>
              </div>
            </Magnet>

          </div>
          }
          </>
        }

          <Disclaimer conferenceSlug={conferenceSlug} LINKS={LINKS}/>
       </div>


      <footer className="absolute bottom-0 min-h-16 md:min-h-14 flex justify-center w-full bg-(--quiz-secondary)">
        <h2 className="text-white text-center my-auto">
          © {new Date().getFullYear()} Model United Nations Northwest. All Rights Reserved.
        </h2>
      </footer>
    </div>
  );
}
