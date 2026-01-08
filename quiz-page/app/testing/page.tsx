"use client"
import MultiRangeSlider from "@/components/multiRangeBar";
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

            {/* <MultiRangeBar
                outerClassName="border border-2 my-5 p-2 h-15"
                question={questions[0]}
            /> */}
            <MultiRangeSlider
                outerClassName="w-1/2"
                question={questions[0]}
                onChange={(updatedRanges:Array<number>) => {
                    // Update your JSON data here
                    console.log("New knob positions:", updatedRanges);
                }}
            />

        </div>
    )
}