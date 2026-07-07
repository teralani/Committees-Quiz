"use client"
import { useState } from 'react'
import DashboardContent from './dashboardContent'
import PageDashboard from './pageContentDashboard'
import CommitteesDashboard from './committeesDashboard'

const TABS = ['Quiz', 'Page Content', 'Committees', 'Docs']

export default function Dashboard() {
    const [tab, setTab] = useState<number>(0)

    return (
        <div>
            <div className='flex justify-center gap-4 bg-white h-15'>
                {TABS.map((t, i) => 
                    <button onClick={() => setTab(i)} className={`min-w-20 cursor-pointer text-center items-center h-10 mt-auto px-2 rounded-t-2xl ${tab === i? "bg-munnorthwest-primary/20" : "bg-gray-200 "}`} style={{lineHeight: "2.5rem"}} key={i}>
                        {t}
                    </button>
                )}
            </div>
            { tab === 0 ? <DashboardContent /> :
              tab === 1 ? <PageDashboard /> :
              tab === 2 ? <CommitteesDashboard /> :
              <DashboardDocs />
            }
        </div>
    )
}

function DashboardDocs() {
    return (
        <div className="p-8 max-w-3xl mx-auto bg-white rounded-lg shadow mt-8">
            <h2 className="text-2xl font-bold mb-4">Dashboard Documentation</h2>
            <p className="mb-4">Welcome to the Committee Quiz Editor Dashboard! This guide will help you understand how to use each section of the dashboard:</p>
            <ol className="list-decimal ml-6 mb-4">
                <li className="mb-2"><b>Quiz Tab:</b> Edit quiz questions, options, and logic. Use this to update or add new questions for the committee quiz.</li>
                <ul className='pl-10 mt-5'><span className='font-bold'>How the quiz works:</span><br></br>
                    <p className='mb-5'>Each question has options that function as "classes" where the class is chosen if the answer option is clicked. Each class is assigned weights for each committee that serve as points. 
                        For example, if a user selects "Crisis" as their ideal committee type, more points are given to HCC than INTERPOL. At the end, the points are tallied and a score is given to each committee. The top 3 are shown to the user in the results page.
                        <br></br>
                        <span className='font-bold'>How slider questions work:</span>
                        <br></br>
                        Each answer option is assigned a range on the slider. For example, "Beginner" could mean any delegate who attended 2 or fewer conferences. Use the slider at the bottom to adjust the ranges for each option.
                        </p>
                </ul>
                <li className="mb-2"><b>Page Content Tab:</b> Manage the text and content that appears on the main quiz pages. Update descriptions, instructions, and other static content here.</li>
                <li className="mb-2"><b>Committees Tab:</b> Add, edit, or remove committees. Set committee details, images, and descriptions that users will see after taking the quiz. The URLs for the images should prefereably be taken from the committee page of the conference.</li>
                <li className="mb-2"><b>Docs Tab:</b> (You are here!) View documentation and instructions for using the dashboard.</li>
            </ol>
            <h3 className="text-xl font-semibold mt-6 mb-2">General Tips</h3>
            <ul className="list-disc ml-6 mb-4">
                <li>Changes are made by clicking <span className='font-bold'>CTRL+S </span>or via a save button.</li>
                <li>View your changes by visiting the main quiz site after editing.</li>
                <li>If you are unable to edit a question, check to see that a question is selected.</li>
                <li>The weights for each option are abstract, so any committee's value for a given option is dependent on the other committees' values.</li>
                <li>If you encounter issues, try refreshing the page or logging out and back in.</li>
            </ul>
            <h3 className="text-xl font-semibold mt-6 mb-2">Need Help?</h3>
            <p>Contact the site administrator, Aniketh at <a  className="underline text-blue-500" href='mailto:aniketh.terala@gmail.com'>aniketh.terala@gmail.com</a></p>
        </div>
    );
}