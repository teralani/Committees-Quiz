import { Montserrat } from "next/font/google";
import Link from "next/link"
import TiltedCard from "@/components/card";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default async function Page() {

    const supabase = await createClient();
    const { data: conferencesData, error } = await supabase
        .from('conferences')
        .select('name,slug')
        .eq('published', true)
        .order('name', { ascending: true });

    const conferences = conferencesData || [];

    return (

    <div className={`${montserrat.className} min-h-screen`}>
        <nav className="h-16 flex justify-between md:justify-center align-center w-full bg-munnorthwest-primary" >
            <div className="max-md:ml-4" id="MUNNWLOGO"></div> 
            <h1 className="max-md:hidden text-white text-xl md:text-2xl my-auto text-center mx-2 font-bold">MUNNorthwest Committee Quizzes</h1>
            <Link className="absolute right-10 top-3 bg-white py-2 px-4 font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-transform" href="/login">
                <p>
                    Sign in
                </p>
            </Link>
        </nav>
        <main>
        <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-center w-full md:mt-20 mb-5 mt-20 px-5 text-white">Available Committee Quizzes</h1>
        <h2 className="text-white max-md:text-sm w-full text-center mb-10">Click on a quiz to get started!</h2>
        <div className="mx-auto max-w-280 pb-20">
            <div className={`${conferences.length > 1? "grid lg:grid-cols-2 lg:grid-rows-2": "flex justify-center"} max-md:my-10 place-items-center-safe gap-6 w-full h-full`}>
                {conferences.map((conf: any, idx: number) => (
                    <div key={idx} className="max-w-screen max-md:m-3 max-md:flex max-md:justify-center">
                        <div className="max-md:hidden md:scale-90 lg:scale-100">
                            <TiltedCard
                                imageSrc={`${conf.slug.toLowerCase()}.jpg`}
                                key={conf.slug || idx}
                                cardHeight={400}
                                cardWidth={400}
                                containerHeight={500}
                                containerWidth={500}
                                showTooltip={true}
                                captionText={`Go to the ${conf.name} Committee Quiz`}
                                overlayContent={
                                    <Link href={`/${conf.slug.toLowerCase()}`}>
                                        <Image
                                            src={`/${conf.slug.toLowerCase()}.png`}
                                            alt={conf.name}
                                            width={500}
                                            height={500}
                                            className="w-full h-full object-contain p-3"
                                        />
                                    </Link>
                                }
                                displayOverlayContent={true}
                            />
                        </div>
                        <div className="w-[clamp(300px,50%,800px)] bg-white rounded-xl md:hidden">
                            <Link  href={`/${conf.slug.toLowerCase()}`}>
                                <Image
                                    src={`/${conf.slug.toLowerCase()}.png`}
                                    alt={conf.name}
                                    width={500}
                                    height={500}
                                    className="w-full h-full object-contain p-3"
                                />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </main>
        <footer className="bottom-0 absolute min-h-14 max-h-min flex justify-center align-center w-full bg-munnorthwest-primary">
                <h2 className="text-white text-center my-auto">© {new Date().getFullYear()} King County Model United Nations. All Rights Reserved.</h2>
        </footer>
    </div>
    
    )
}