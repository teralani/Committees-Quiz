"use client"
import pageContent from "@/public/pageText.json"

export default function Testing() {

    type Question = {
        text: string;
        options: { text: string; weights: Array<number>; range?: number }[];
        slider?: boolean;
        max?: number;
        weight?: [number];
    };

    const questions = pageContent[1].questions as Array<Question>

    return (
        <div className="bg-white border w-1/2 h-screen mx-auto flex flex-col justify-center">

            

        </div>
    )
}