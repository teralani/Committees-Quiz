import { Montserrat } from "next/font/google";
import CommitteesSection from "@/components/committeesSection";
import Link from "next/link";
import Card from "@/components/card";
import Magnet from "@/components/magneticButton";
import { createClient } from "@/utils/supabase/server";
import type { CSSProperties } from "react";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });


const SLUG_METADATA: Record<string, { title: string }> = {
    kingmun: { title: 'KINGMUN' },
    edumun: { title: 'EDUMUN' },
    pacmun: { title: 'PACMUN' },
    seattlemun: { title: 'SEATTLEMUN' }
};


type Team = {
    id: string;
    page_id: string;
    key: string;
    title: string | null;
    img: string | null;
    body: string | null;
    position: number;
};

export default async function Home({ params }: { params: { conference: string } | Promise<{ conference: string }> }) {
    const resolvedParams = await Promise.resolve(params);
    const conferenceSlug = (resolvedParams.conference || "").toLowerCase();
    const conferenceName = SLUG_METADATA[conferenceSlug].title;
    const supabase = await createClient();

    const { data: teams, error: nestedErr } = await supabase
        .from("page_sections")
        .select(`
        id,
        key,
        title,
        img,
        body,
        position,
        page_id,
        pages!inner (
            name,
            conferences!inner (
                slug
            )
        )
        `)
        .eq("pages.name", "Home")
        .eq("pages.conferences.slug", conferenceSlug)
        .order("position", { ascending: true });

    if (nestedErr) {
        console.error("Supabase error:", nestedErr);
    }

    return (
        <>
        <title>{`${conferenceName} ${new Date().getFullYear()} Committee Quiz`}</title>
        <meta name="description" content="Discover your perfect committee match with an interactive quiz!" />
        <div
            className="min-h-screen relative quiz-page-root"
            style={{
                fontFamily: montserrat.style.fontFamily,
                ["--quiz-primary" as string]: `var(--color-${conferenceSlug}-primary)`,
                ["--quiz-secondary" as string]: `var(--color-${conferenceSlug}-secondary)`,
                ["--quiz-logo" as string]: `var(--${conferenceSlug}-logo)`
            } as CSSProperties}
        >
        
            <nav className="h-16 flex justify-center align-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}>
                <div className="hidden md:block quiz-page-logo"></div> 
                <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
            </nav>
            <div className="w-full min-h-screen mx-auto mt-16 flex justify-center flex-col items-center">
                <h1 className="text-white text-center text-3xl ">Find Your Perfect {conferenceName} Committee</h1>
                <p className="text-lg text-white mt-3 mx-5 text-center">Discover your perfect committee match with our interactive quiz!</p>
                <div className="flex justify-center pb-10 flex-col items-center ">
                        <Magnet
                            padding={30}
                            wrapperClassName="mt-20 mb-10"
                        >
                            <Link href={`/${conferenceSlug}/quiz`}>
                                <button 
                                    className="quiz-page-button backdrop-blur-lg text-white h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl"
                                    style={{ 
                                        backgroundColor: `color-mix(in srgb, var(--quiz-primary) 80%, transparent)`,
                                        boxShadow: `0 0 15px var(--quiz-secondary)` 
                                    }}
                                >Take the Quiz Now!</button>
                            </Link>
                        </Magnet>
                        <div className="flex flex-wrap w-full justify-center gap-2 my-10">
                            {!teams && <div className="h-100"></div>}
                            {teams && teams.map((team, idx) => {
                                return (<Card
                                key={idx}
                                imageSrc={undefined}
                                altText=""
                                containerHeight={"450px"}
                                containerWidth={"420px"}
                                cardHeight={"425px"}
                                cardWidth={"340px"}
                                scaleOnHover={1.03}
                                rotateAmplitude={14}
                                displayCardContent={true}
                                cardContent={
                                    <div className="hover-card w-full h-full p-6">
                                        <div className={`hover-border quiz-page-hover-border w-31 hover:bg-amber-400 h-31 -mt-1 mx-auto shadow-lg shadow-${conferenceSlug}-primary/40 mb-6 rounded-lg`}></div>
                                        <h3 className="text-2xl font-bold text-center">{team?.title}</h3>
                                        <p className="mt-2 text-sm text-center">{team?.body}</p>
                                    </div>
                                }
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="w-full h-full flex justify-center align-center">
                                        {team?.img ? (
                                            <img
                                                className="card-img quiz-page-card-image pointer-events-none w-27 h-27 mt-8 rounded-md text-transparent"
                                                id = {conferenceSlug}
                                                src={team.img}
                                                alt=""
                                                loading="eager"
                                                
                                            />
                                        ) : (
                                            <div className="card-img pointer-events-none w-27 h-27 mt-8 rounded-md text-transparent"></div>
                                        )}
                                    </div>
                                }
                            />)
                            }
                            )}
                        </div>
                        <div id="disclaimer" className="quiz-page-disclaimer flex-col mx-10 md:mx-auto max-w-175 my-10 min-h-20 bg-white/88 flex justify-center p-6 rounded-lg shadow-2xl shadow-black transition transform duration-300 hover:scale-105 hover:shadow-xl">
                            <div className="flex">
                                <svg className="h-6 w-6 mr-2" style={{ color: `var(--color-${conferenceSlug}-primary)` }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
                            </svg>
                            <h1 className="font-bold text-xl mb-2" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>Disclaimer & Contact</h1>
                            </div>
                            
                            <p className="text-sm mb-3" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>
                                Disclaimer: This quiz is intended for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
                            </p>
                            <p className="text-sm" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>For questions, feedback, or further guidance, contact us at <a className="underline" style={{ color: `var(--color-${conferenceSlug}-secondary)` }} href={conferenceSlug == "edumun"? `mailto:delegates@${conferenceSlug}.org` : `mailto:da@${conferenceSlug}.org`}>{conferenceSlug == "edumun"? "delegates" : "da"}@{conferenceSlug}.org</a>.</p>
                        </div>
                </div>
            </div>
            <CommitteesSection display={false} />
            <footer className=" min-h-14 max-h-min flex justify-center align-center w-full" style={{ backgroundColor: `var(--quiz-secondary)` }}>
                <h2 className="text-white text-center my-auto">© {new Date().getFullYear()} Model United Nations Northwest. All Rights Reserved.</h2>
            </footer>
        </div>
    </>
    )
}