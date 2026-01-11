import { Montserrat } from "next/font/google";
import Link from "next/link"
import TiltedCard from "@/components/card";
import Image from "next/image";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default function Page() {

    const conferences = ["EDUMUN", "PACMUN", "SeattleMUN", "KINGMUN"]

    return (
    
    <div className={`${montserrat.className} min-h-screen`}>
        <nav className="h-16 flex justify-between md:justify-center align-center w-full bg-munnorthwest-primary" >
            <div className="max-md:ml-4" id="MUNNWLOGO"></div> 
            <h1 className="max-md:hidden text-white text-2xl my-auto text-center mx-2 font-bold">MUNNorthwest Committee Quizzes</h1>
            <Link className="absolute right-10 top-3 bg-white py-2 px-4 font-bold rounded-xl" href="/login">
                <p>
                    Sign in
                </p>
            </Link>
        </nav>
        
        <h1 className="font-bold text-4xl md:text-5xl text-center w-full md:mt-50 mb-5 mt-20 px-5 text-white">Available Committee Quizzes</h1>
        <h4 className="text-white w-full text-center mb-10">Click on a quiz to get started!</h4>
        <div className="mx-auto max-w-280 pb-20">
            <div className="grid lg:grid-cols-2 lg:grid-rows-2 place-items-center-safe gap-6 w-full h-full">
                {conferences.map((conference, idx) => <TiltedCard
                    imageSrc={`${conference.toLowerCase()}.jpg`}
                    key={idx}
                    cardHeight={400}
                    cardWidth={400}
                    containerHeight={500}
                    containerWidth={500}
                    showTooltip={true}
                    captionText={`Go to the ${conference} Committee Quiz`}
                    overlayContent={
                        <Link
                            href={`/${conference.toLowerCase()}`}
                        >
                            <Image
                                src={`/${conference.toLowerCase()}.png`}
                                alt={conference}
                                width={500}
                                height={500}
                                className="w-full h-full object-contain p-3"
                        />
                        </Link>
                    }
                    displayOverlayContent={true}
                />)}
            </div>
        </div>
        <footer className="bottom-0 absolute min-h-14 max-h-min flex justify-center align-center w-full bg-munnorthwest-primary">
                <h2 className="text-white text-center my-auto">© {new Date().getFullYear()} King County Model United Nations. All Rights Reserved.</h2>
        </footer>
    </div>
    
    )
}