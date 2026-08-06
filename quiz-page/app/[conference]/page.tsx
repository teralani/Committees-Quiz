import { Montserrat } from "next/font/google";
import CommitteesSection from "@/components/committeesSection";
import Link from "next/link";
import Magnet from "@/components/magneticButton";
import { createClient } from "@/utils/supabase/server";
import type { CSSProperties } from "react";
import Disclaimer from "@/components/disclaimer";
import Card from "@/components/card";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const year = new Date().getFullYear();

const SLUG_METADATA: Record<string, { title: string }> = {
    kingmun: { title: 'KINGMUN' },
    edumun: { title: 'EDUMUN' },
    pacmun: { title: 'PACMUN' },
    seattlemun: { title: 'SeattleMUN' }
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

const LINKS: {[key: string]: string} = {
    "kingmun" : "kingmun.org",
    "edumun" : "edumun.com",
    "pacmun" : "pacificmun.com",
    "seattlemun" : "seattlemun.org",
    }


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
        <title>{`${conferenceName} ${year} Committee Quiz`}</title>
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
        
            <nav className="h-16 flex justify-center align-center w-full bg-(--quiz-primary)">
                <a href={`/${conferenceSlug}`} className="flex justify-center align-center">
                    <div className="hidden md:block quiz-page-logo"></div> 
                    <h1 className="text-white text-xl md:text-2xl my-auto text-center mx-2">{conferenceName} {year} Committee Quiz</h1>
                </a>
            </nav>
            <section className="w-full min-h-screen mx-auto mt-16 flex justify-center flex-col items-center">
                <h2 className="text-white text-center text-3xl max-md:text-2xl max-md:px-10  font-bold">Find Your Perfect {conferenceName} Committee</h2>
                <h3 className="text-lg text-white mt-3 mx-5 text-center max-md:text-md font-bold">Discover your perfect committee match with our interactive quiz!</h3>
                <div className="scale-90 md:scale-100 flex justify-center md:pb-10 flex-col items-center">
                        <Magnet
                            padding={30}
                            wrapperClassName="md:mt-20 md:mb-10 -mt-5 mb-12"
                        >
                            <Link href={`/${conferenceSlug}/quiz`}>
                                <button 
                                    className="bg-(--quiz-primary)/80 shadow-[0_0px_15px_var(--quiz-secondary)] quiz-page-button text-white h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 "
                                >Take the Quiz Now!</button>
                            </Link>
                        </Magnet>
                        <div className="flex flex-wrap w-full justify-center gap-2 my-10">
                            {!teams && <div className="h-100"></div>}
                            {teams && teams.map((team) => {
                                return (<Card
                                key={team.id}
                                containerHeight={"450px"}
                                containerWidth={"420px"}
                                cardHeight={"425px"}
                                cardWidth={"340px"}
                                scaleOnHover={1.03}
                                rotateAmplitude={14}
                                displayCardContent={true}
                                cardContent={
                                    <div className="will-change-transform hover-card w-full h-full p-6">
                                        <div className= "hover-border quiz-page-hover-border w-31 hover:bg-amber-400 h-31 -mt-1 mx-auto shadow-lg shadow-(--quiz-primary)/40 mb-6 rounded-lg"></div>
                                        <h4 className="text-2xl font-bold text-center">{team?.title}</h4>
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
                                                alt="Team Member Image"
                                                loading="lazy"
                                                
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
                        <Disclaimer conferenceSlug={conferenceSlug} LINKS={LINKS}></Disclaimer>
                </div>
            </section>
            <CommitteesSection display={false} />
            <footer className=" min-h-14 max-h-min flex justify-center align-center w-full bg-(--quiz-secondary)">
                <h2 className="text-white text-center my-auto">© {year} Model United Nations Northwest. All Rights Reserved.</h2>
            </footer>
        </div>
    </>
    )
}

export const dynamic = "force-static";