"use client"
import { useState } from 'react'
import DashboardContent from './dashboardContent'
import PageDashboard from './pageContentDashboard'

const TABS = ['Quiz', 'Page Content', 'Committees']

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
            { tab === 0? <DashboardContent></DashboardContent> :
              tab === 1? <PageDashboard></PageDashboard> : 
              <div className='text-center my-20 font-bold text-4xl'>
                Coming Soon...
              </div>
            }
        </div>
    )

}