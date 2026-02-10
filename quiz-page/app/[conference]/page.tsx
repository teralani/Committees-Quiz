"use client";
import { useParams, notFound } from "next/navigation";
import { Montserrat } from "next/font/google";
import CommitteesSection from "@/components/committeesSection";
import Link from "next/dist/client/link";
import Card from "@/components/card";
import Magnet from "@/components/magneticButton";
import Pages from "@/public/pageText.json"
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";


const montserrat = Montserrat({ subsets: ['latin'],  variable: '--font-montserrat' });


const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];

export default function Home() {
    const [loading, setLoading] = useState(false)
    const params = useParams();
    const rawSlug = (params.conference as string || '').toLowerCase();
    if (!ALLOWED_SLUGS.includes(rawSlug)) {
        notFound();
        return null;
    }
    const conferenceSlug = rawSlug;
    const conferenceName = conferenceSlug.toUpperCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

    const [teams, setTeams] = useState<{
        id: string;
        page_id: string;
        key: string;
        title: string | null;
        img: string | null;
        body: string | null;
        position: number;
    }[] | null>(null);

    useEffect(() => {
        const load = async () => {
            const supabase = createBrowserClient(supabaseUrl, supabaseKey);

            const { data: nestedData, error: nestedErr } = await supabase
                .from('page_sections')
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
                .eq('pages.name', 'Home')
                .eq('pages.conferences.slug', conferenceSlug)
                .order('position', { ascending: true });

            if (nestedErr) {
                console.error("Supabase error:", nestedErr);
                return;
            }

            setTeams(nestedData); // Set the data in state
        };

        load();
    }, [supabaseUrl, supabaseKey, conferenceSlug]);

    return (
        <div className="min-h-screen relative">
            {/* <Image
                alt="background image" 
                sizes="100vw" 
                decoding="async"
                fill={true}
                src="https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/aded82f1ddfea876b3f348e95933b96fd2088183041b995520724d6cf199e23c/king_home_media_2026%20(1).jpg&w=3840&q=75"
                className="-z-1 inset-0 p-0 m-auto block w-0 h-0 min-w-full max-w-full min-h-full max-h-full object-cover blur-md" 
                // style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%; object-fit: cover;">
            /> */}
        
            <nav className="h-16 flex justify-center align-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-primary)` }}>
                <div className="hidden md:block" id="LOGO"></div> 
                <h1 className="text-white text-2xl my-auto text-center mx-2">{conferenceName} {new Date().getFullYear()} Committee Quiz</h1>
            </nav>
            <div className="w-full min-h-screen mx-auto mt-16 flex justify-center flex-col items-center">
                <h1 className="text-white text-center text-3xl ">Find Your Perfect {conferenceName} Committee</h1>
                <p className="text-lg text-white mt-3 mx-5 text-center">Discover your perfect committee match with our interactive quiz!</p>
                <div className="flex justify-center pb-10 flex-col items-center flex-col ">
                        <Magnet
                            padding={30}
                            wrapperClassName="mt-20 mb-10"
                        >
                            <Link href={`/${conferenceSlug}/quiz`}>
                                <button 
                                    className="backdrop-blur-lg text-white h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl"
                                    style={{ 
                                        backgroundColor: `color-mix(in srgb, var(--color-${conferenceSlug}-primary) 80%, transparent)`,
                                        boxShadow: `0 0 15px var(--color-${conferenceSlug}-secondary)` 
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-${conferenceSlug}-secondary)`}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--color-${conferenceSlug}-primary) 80%, transparent)`}
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
                                        <div className={`hover-border w-31 hover:bg-amber-400 h-31 -mt-1 mx-auto shadow-lg shadow-${conferenceSlug}-primary/40 mb-6 rounded-lg`}></div>
                                        <h3 className="text-2xl font-bold text-center">{team?.title}</h3>
                                        <p className="mt-2 text-sm text-center">{team?.body}</p>
                                    </div>
                                }
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="w-full h-full flex justify-center align-center">
                                        {loading? <img onLoad={()=>setLoading(true)} className="card-img pointer-events-none w-27 h-27 mt-8 rounded-md text-transparent" src={team?.img ?? undefined} 
                                            aria-placeholder=""/> : <div className="card-img pointer-events-none w-27 h-27 mt-8 rounded-md text-transparent"></div>}
                                    </div>
                                }
                            />)
                            }
                            )}
                        </div>
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
                            <p className="text-sm" style={{ color: `var(--color-${conferenceSlug}-primary)` }}>For questions, feedback, or further guidance, contact us at <a className="underline" style={{ color: `var(--color-${conferenceSlug}-secondary)` }} href="mailto:da@kingmun.org">da@kingmun.org</a>.</p>
                        </div>
                </div>
            </div>
            <CommitteesSection display={false} />
            <footer className=" min-h-14 max-h-min flex justify-center align-center w-full" style={{ backgroundColor: `var(--color-${conferenceSlug}-secondary)` }}>
                <h2 className="text-white text-center my-auto">© {new Date().getFullYear()} Model United Nations Northwest. All Rights Reserved.</h2>
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
                .card-img {
                    background: url(https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/9b852e368aceaf885c8e672aa83c8a2ac7ef2500a81335c7356c6732d175beda/whiteSmallLogo.png&w=3840&q=75) no-repeat center, var(--color-${conferenceSlug}-primary);
                    background-size: contain;
                }
                figure:hover .hover-border {
                    background-color: var(--color-${conferenceSlug}-secondary);
                }
            `}</style>
        </div>
    )
}