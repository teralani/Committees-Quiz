import { Montserrat } from "next/font/google";

import {redirectIfNotAuthenticated} from '@/utils/redirectIfNotAuthenticated'
import DashboardContent from "@/components/dashboardContent";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default async function DashboardPage() {

  // const user = await redirectIfNotAuthenticated()

  
  return (
    <div className={`${montserrat.variable} font-sans min-h-screen bg-slate-50`}>
      <nav className="h-20 md:h-16 flex justify-center items-center w-full bg-primary text-white">
        <div id="LOGO" className="hidden md:block mr-4" />
        <h1 className="text-2xl font-bold">Committee Quiz Editor</h1>
      </nav>

      <DashboardContent></DashboardContent>
    </div>
  );
}
