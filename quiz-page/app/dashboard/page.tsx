import { Montserrat } from "next/font/google";
import {redirectIfNotAuthenticated} from '@/utils/redirectIfNotAuthenticated'
import { logout } from "../api/auth/actions";
import Dashboard from "@/components/dashboard";
import { createClient } from "@/utils/supabase/server";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default async function DashboardPage() {

  await redirectIfNotAuthenticated()
  // const supabase = await createClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // const CONFERENCES = ["edumun", "pacmun", "seattlemun", "kingmun"]
  
  return (
    <div className={`${montserrat.variable} font-sans min-h-screen bg-slate-50`}>
      <nav className={`h-16 md:h-16 flex md:justify-center items-center w-full bg-munnorthwest-primary text-white`}>
        <div id="LOGO" className="hidden md:block mr-4" />
        <h1 className="md:text-2xl font-bold text-left max-md:ml-3 text-xl">Committee Quiz Editor</h1>
        <div className=" absolute right-8 top-0 flex gap-6">
          <img className="rounded-full w-12 h-12 mt-2 bg-white cursor-pointer p-1" title={`${user?.email}`} src={`${user?.email? user.email.split("@")[1].slice(0, -4) : "kingmun"}.png`}></img>
          <form action={logout}>
            <button
              className={`cursor-pointer px-4 py-2 mt-3 bg-white text-munnorthwest-primary rounded hover:bg-gray-100`}
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
      <Dashboard></Dashboard>
    </div>
  );
}
