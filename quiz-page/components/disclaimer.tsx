export default function Disclaimer({conferenceSlug, LINKS}: {conferenceSlug: string, LINKS: {[key: string]: string}}) {

    return (<div
          id="disclaimer"
          className="
                mx-10 md:mx-auto max-w-175 my-10 min-h-20
                flex flex-col justify-center
                rounded-lg bg-white/88 p-6
                shadow-[0_25px_50px_-12px_rgba(0,0,0,1)]
                transition-all duration-300
                hover:scale-105
                hover:shadow-[0_20px_25px_-5px_var(--quiz-primary)]
              "
        >
          <div className="flex">
            <svg className="h-6 w-6 mr-2 text-(--quiz-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 11-10 10A10 10 0 0112 2z"></path>
            </svg>
            <h1 className="font-bold text-xl mb-2 text-(--quiz-primary)" >Disclaimer & Contact</h1>
          </div>

          <p className="max-md:text-xs text-sm mb-3 text-(--quiz-primary)">
            Disclaimer: This quiz is intended for guidance only. Final committee assignments are determined by the Delegate Affairs Team.
          </p>
          <p className="max-md:text-xs text-sm text-(--quiz-primary)">For questions, feedback, or further guidance, contact us at <a className="underline " href={conferenceSlug == "edumun" ? `mailto:delegates@${LINKS[conferenceSlug]}` : `mailto:da@${LINKS[conferenceSlug]}`}>{conferenceSlug == "edumun" ? "delegates" : "da"}@{LINKS[conferenceSlug]}</a>.</p>
        </div>
       )
}