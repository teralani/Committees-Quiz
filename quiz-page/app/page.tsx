"use client";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import TiltedCard from "@/components/card";
import CommitteesSection from "@/components/committeesSection";
import Committees from "@/public/committees.json";
import Link from "next/dist/client/link";
import Card from "@/components/card";
import Magnet from "@/components/magneticButton";


const montserrat = Montserrat({ subsets: ['latin'],  variable: '--font-montserrat' });
const committees = Committees as Array<{ name: string; acronym: string; description: string }>;

export default function Home() {

    return (
        <div className="min-h-screen">
            {/* <Image
                alt="background image" 
                sizes="100vw" 
                decoding="async"
                fill={true}
                src="https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/aded82f1ddfea876b3f348e95933b96fd2088183041b995520724d6cf199e23c/king_home_media_2026%20(1).jpg&w=3840&q=75"
                className="-z-1 inset-0 p-0 m-auto block w-0 h-0 min-w-full max-w-full min-h-full max-h-full object-cover blur-md" 
                // style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%; object-fit: cover;">
            /> */}
        
            <nav className="h-16 flex justify-center align-center w-full bg-primary" >
                <div className="hidden md:block" id="LOGO"></div> 
                <h1 className="text-white text-2xl my-auto text-center mx-2">KINGMUN 2026 Committee Quiz</h1>
            </nav>
            <div className="w-full mx-auto mt-16 flex justify-center flex-col items-center">
                <h1 className="text-white text-center text-3xl ">Find Your Perfect KINGMUN Committee</h1>
                <p className="text-lg text-white mt-3 mx-5 text-center">Discover your perfect committee match with our interactive quiz!</p>
                <div className="flex justify-center md:flex-col items-center flex-col-reverse">
                        <div className="flex flex-wrap w-full justify-center gap-2 my-5">
                            <Card
                                imageSrc={undefined}
                                altText=""
                                containerHeight={"400px"}
                                containerWidth={"400px"}
                                cardHeight={"352px"}
                                cardWidth={"300px"}
                                scaleOnHover={1.03}
                                rotateAmplitude={14}
                                displayCardContent={true}
                                cardContent={
                                    <div className="w-full h-full p-6">
                                        <div className="w-31 bg-blue border h-31 -mt-1 mx-auto shadow-lg shadow-primary/40 mb-6"></div>
                                        <h3 className="text-2xl font-bold text-center">Delegate Affairs</h3>
                                        <p className="mt-2 text-sm text-center">We know that choosing the right committee can be overwhelming, so we created this quiz to make it easier and even a little fun! We can't wait to see you thrive in committee at KINGMUN 2025 experience!</p>
                                    </div>
                                }
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="w-full h-full flex justify-center align-center">
                                        <img className="bg-blue w-27 border h-27 mt-8" src="/DA.png" alt="DA" />
                                    </div>
                                }
                            />
                            <Card
                                imageSrc={undefined}
                                altText=""
                                containerHeight={"400px"}
                                containerWidth={"400px"}
                                cardHeight={"352px"}
                                cardWidth={"300px"}
                                scaleOnHover={1.03}
                                rotateAmplitude={14}
                                displayCardContent={true}
                                cardContent={
                                    <div className="w-full h-full p-6">
                                        <div className="w-31 bg-blue border h-31 -mt-1 mx-auto shadow-lg shadow-primary/40 mb-6"></div>
                                        <h3 className="text-2xl font-bold text-center">Secretary-General</h3>
                                        <p className="mt-2 text-sm text-center">Whether you're here to challenge yourself or explore something new, I hope this helps you find where you'll shine at KINGMUN 2025.</p>
                                    </div>
                                }
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="w-full h-full flex justify-center align-center">
                                        <img className="bg-blue w-27 border h-27 mt-8" src="/SG.png" alt="Secretary-General" />
                                    </div>
                                }
                            />
                            <Card
                                imageSrc={undefined}
                                altText=""
                                containerHeight={"400px"}
                                containerWidth={"400px"}
                                cardHeight={"352px"}
                                cardWidth={"300px"}
                                scaleOnHover={1.03}
                                rotateAmplitude={14}
                                displayCardContent={true}
                                cardContent={
                                    <div className="w-full h-full p-6">
                                        <div className="w-31 bg-blue border h-31 -mt-1 mx-auto shadow-lg shadow-primary/40 mb-6"></div>
                                        <h3 className="text-2xl font-bold text-center">Internal Secretariat</h3>
                                        <p className="mt-2 text-sm text-center">Our team put a lot of thought into designing committees that are engaging, creative, and, most importantly, perfect for you. This tool is our way of guiding you through our various committees!</p>
                                    </div>
                                }
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="w-full h-full flex justify-center align-center">
                                        <img className="bg-blue w-27 border h-27 mt-8" src="/IS.png" alt="Internal Secretariat" />
                                    </div>
                                }
                            />
                        </div>
                        <div id="disclaimer" className="flex-col mx-5 md:mx-15 max-w-175 my-20 min-h-20 bg-white/88 flex justify-center p-6 rounded-lg shadow-2xl shadow-black hover:shadow-primary transition transform duration-300 hover:scale-105 hover:shadow-xl">
                            <div className="flex">
                                <svg className="h-6 w-6 text-[#2E4A20] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
                            </svg>
                            <h1 className="text-primary font-bold text-xl mb-2">Disclaimer & Contact</h1>
                            </div>
                            
                            <p className="text-sm text-primary mb-3">
                                Disclaimer: This quiz is designed for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
                            </p>
                            <p className="text-sm text-primary">For questions, feedback, or further guidance, contact us at da@kingmun.org.</p>
                        </div>
                        <Magnet
                            padding={30}
                        >
                            <Link href="/quiz">
                                <button className="bg-primary/80 backdrop-blur-lg text-white h-16 px-6 py-3 rounded-lg transition transform hover:scale-105 hover:shadow-2xl shadow-secondary hover:bg-secondary mb-16">Take the Quiz Now!</button>
                            </Link>
                        </Magnet>
                </div>
            </div>
            <CommitteesSection display={false} />
            <footer className="absolute min-h-14 max-h-min flex justify-center align-center bottom-0 w-full bg-secondary">
                <h2 className="text-white text-center my-auto">© 2025 King County Model United Nations. All Rights Reserved.</h2>
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
                    border-left-width: 8px;
                    border-image: linear-gradient(to bottom, #2E4A20, #5b2950) 1;
                }
                
            `}</style>
        </div>
    )
}