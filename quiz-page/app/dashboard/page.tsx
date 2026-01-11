import { Montserrat } from "next/font/google";
import { createClient } from '@/utils/supabase/server';
import {redirectIfNotAuthenticated} from '@/utils/redirectIfNotAuthenticated'
import DashboardContent from "@/components/dashboardContent";
import { logout } from "../api/auth/actions";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default async function DashboardPage() {

  const users = await redirectIfNotAuthenticated()
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser()

  const email = user?.email
  let conference  = email? email.slice(email.indexOf('@') + 1, email.lastIndexOf(".")) : "kingmun"
  const CONFERENCES = ["edumun", "pacmun", "seattlemun", "kingmun"]
  
  return (
    <div className={`${montserrat.variable} font-sans min-h-screen bg-slate-50`}>
      <nav className={`h-20 md:h-16 flex justify-center items-center w-full bg-${user && CONFERENCES.indexOf(conference) != -1? conference : "munnorthwest"}-primary text-white`}>
        <div id="LOGO" className="hidden md:block mr-4" />
        <h1 className="text-2xl font-bold">Committee Quiz Editor</h1>
        <form action={logout}>
          <button
            className={`cursor-pointer px-4 py-2 absolute right-8 top-3 bg-white text-${ user && CONFERENCES.indexOf(conference) != -1? conference : "munnorthwest"}-primary rounded`}
          >
            Log out
          </button>

        </form>
      </nav>

      <DashboardContent></DashboardContent>
    </div>
  );
}
