"use client"
import { redirectIfNotAuthenticated } from "@/utils/redirectIfNotAuthenticated";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect } from "react";

export default function Testing() {

    let conference = 'KINGMUN'

    type Data = {
        id: string;
        name: string;
        pages: {
            id: string;
            name: string;
            quiz_questions: {
                id: string;
                text: string;
                question_options: {
                    id: string;
                    text: string;
                    range: number;
                    option_weights: {
                        weight: number;
                    }[];
                }[];
            }[];
        }[];
    }[]

    
    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

        // const user = redirectIfNotAuthenticated()
        const supabase = createBrowserClient(
        supabaseUrl,
        supabaseKey
        )
        async function fetchData() {
            const {data, error} = await supabase
                .from('conferences')
                .select(`
                    id, 
                    name, 
                    pages (
                        id, 
                        name,
                        quiz_questions (
                            id,
                            text,
                            question_options (
                                id,
                                text,
                                range,
                                option_weights (
                                    weight
                                )
                            )
                        )
                    )
                `)
                .eq('name', conference).eq('pages.name', 'Quiz')
            
            if(!data) {return}

            const kingmunInfo:Data = data

            const questions = kingmunInfo[0]["pages"][0]["quiz_questions"]
            console.log(questions)
        }
        fetchData()
    })


    

    return (
        <div className="bg-white border w-1/2 h-screen mx-auto flex flex-col justify-center">

            

        </div>
    )
}