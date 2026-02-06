"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import TiltedCard from "./card";
import { createBrowserClient } from "@supabase/ssr";

type Committee = {
  id: string;
  name: string;
  acronym: string;
  description: string;
  difficulty: string;
  topics: string[];
  img_url: string;
};

export default function committeesSection({display, conferenceSlug = 'kingmun'}: {display: boolean, conferenceSlug?: string}) {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (err) {
        console.error("Error fetching committees:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommittees();
  }, [conferenceSlug]);

  if (loading) {
    return (
      <div className={`${display? "block" : "hidden"} bg-secondary/40 rounded-2xl mt-10 lg:w-5/6 mx-auto px-10 py-4 text-center text-white`}>
        <p className="my-10">Loading committees...</p>
      </div>
    );
  }

return (
        <div className={`${display? "block" : "hidden"} bg-secondary/40 rounded-2xl mt-10 lg:w-5/6 mx-auto px-10 py-4`}>
            <h1 className="text-white text-center text-3xl my-10">Principal</h1>
            <div className="flex flex-wrap w-full mx-auto justify-center items-center mt-10 mb-24">
                {committees.slice(0, 3).map((committtee) => (
                    <TiltedCard
                        key={committtee.name}
                        imageSrc={undefined}
                        rotateAmplitude={12}
                        captionText="Take the quiz to find out which committee suits you best!"
                        containerHeight="400px"
                        containerWidth="325px"
                        cardWidth="275px"
                        cardHeight="350px"
                        displayOverlayContent={true}
                        overlayContent={
                            <div className="text-black w-full h-full flex flex-col justify-center items-center p-7">
                                <h2 className="text-2xl font-bold mb-4 text-center">{committtee.acronym}</h2>
                                <p className="text-center text-sm mb-6 flex-2">{committtee.description}</p>
                                <Link className="cursor-pointer" target="_blank" href={`https://kingmun.org/committees/${committtee.acronym.toLowerCase()}`}>
                                    <button className="cursor-pointer bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary" onClick={() => {}}>Learn More</button>
                                </Link>
                            </div>
                        }
                    ></TiltedCard>
                ))}
            </div>
            <h1 className="text-white text-center text-3xl my-10">ECOSOC</h1>
            <div className="flex flex-wrap w-full mx-auto justify-center items-center mt-10 mb-24">
                {committees.slice(3, 6).map(committtee => (
                    <TiltedCard 
                        key={committtee.name}
                        imageSrc={undefined}
                        rotateAmplitude={12}
                        captionText="Take the quiz to find out which committee suits you best!"
                        containerHeight="400px"
                        containerWidth="325px"
                        cardWidth="275px"
                        cardHeight="350px"
                        displayOverlayContent={true}
                        overlayContent={
                            <div className="text-black w-full h-full flex flex-col justify-center items-center p-7">
                                <h2 className="text-2xl font-bold mb-4 text-center">{committtee.acronym}</h2>
                                <p className="text-center text-sm mb-6 flex-2">{committtee.description}</p>
                                <Link className="cursor-pointer" target="_blank" href={`https://kingmun.org/committees/${committtee.acronym.toLowerCase()}`}>
                                    <button className="cursor-pointer bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary" onClick={() => {}}>Learn More</button>
                                </Link>
                            </div>
                        }
                    ></TiltedCard>
                ))}
            </div>
            <h1 className="text-white text-center text-3xl my-10">Specialized Bodies</h1>
            <div className="flex flex-wrap w-full mx-auto justify-center items-center mt-10 mb-24">
                {committees.slice(6, 10).map(committtee => (
                    <TiltedCard
                        key={committtee.name} 
                        imageSrc={undefined}
                        rotateAmplitude={12}
                        captionText="Take the quiz to find out which committee suits you best!"
                        containerHeight="400px"
                        containerWidth="325px"
                        cardWidth="275px"
                        cardHeight="350px"
                        displayOverlayContent={true}
                        overlayContent={
                            <div className="text-black w-full h-full flex flex-col justify-center items-center p-7">
                                <h2 className="text-2xl font-bold mb-4 text-center">{committtee.acronym}</h2>
                                <p className="text-center text-sm mb-6 flex-2">{committtee.description}</p>
                                <Link className="cursor-pointer" target="_blank" href={`https://kingmun.org/committees/${committtee.acronym.toLowerCase()}`}>
                                    <button className="cursor-pointer bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary" onClick={() => {}}>Learn More</button>
                                </Link>
                            </div>
                        }
                    ></TiltedCard>
                ))}
            </div>
            <h1 className="text-white text-center text-3xl my-10">Crisis</h1>
            <div className="flex flex-wrap w-full mx-auto justify-center items-center mt-10 mb-24">
                {committees.slice(10, 13).map(committtee => (
                    <TiltedCard 
                        key={committtee.name}
                        imageSrc={undefined}
                        rotateAmplitude={12}
                        captionText="Take the quiz to find out which committee suits you best!"
                        containerHeight="400px"
                        containerWidth="325px"
                        cardWidth="275px"
                        cardHeight="350px"
                        displayOverlayContent={true}
                        overlayContent={
                            <div className="text-black w-full h-full flex flex-col justify-center items-center p-7">
                                <h2 className="text-2xl font-bold mb-4 text-center">{committtee.acronym}</h2>
                                <p className="text-center text-sm mb-6 flex-2">{committtee.description}</p>
                                <Link className="cursor-pointer" target="_blank" href={`https://kingmun.org/committees/${committtee.acronym.toLowerCase()}`}>
                                    <button className="cursor-pointer bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary" onClick={() => {}}>Learn More</button>
                                </Link>
                            </div>
                        }
                    ></TiltedCard>
                ))}
            </div>
        </div>
    );
}