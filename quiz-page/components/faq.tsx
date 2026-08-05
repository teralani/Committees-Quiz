export default function FAQ({header, body}: {header?: string, body: string}) {

        // <div className={`rounded-md cursor-pointer max-md:text-md py-4 px-2 bg-white mb-10 ${faqOpen? "" : ""}`} onClick={()=> setFaqOpen(!faqOpen)}>
        //     <div className={` flex px-3 `}>
        //       <svg className={`${!faqOpen? "rotate-0" : "rotate-45"}  transition-transform my-auto size-15 fill-neutral-600 stroke-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        //         <path className=" origin-center" d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
        //       </svg>
        //       <h1 className="my-auto md:text-xl lg:px-10 font-bold text-left pl-5">{header}</h1>
        //     </div>
        //     {faqOpen && (
        //       <>
        //       <p className="px-10 pt-5 pb-2 text-left max-md:text-sm">{body}</p>
        //       <p className="pb-5 text-left px-10 max-md:text-sm">To learn more, visit <a className="text-edumun-primary font-bold">https://edumun.com/committees</a> for more information on seminars and committees.</p>
        //       </>
        //     )}
        //   </div>

    return (

        <label className="clickable-card">
        {/* <!-- Hidden native checkbox --> */}
        <input type="checkbox" className="hidden-checkbox"></input>
        
        {/* <!-- Your actual visible card content --> */}
        <div className="card-content pointer-events-none rounded-md cursor-pointer max-md:text-md py-4 px-2 bg-white mb-10">
          <div className={` flex px-3 `}>
              <svg className={` custom-checkbox transition-transform my-auto size-15 fill-neutral-600 stroke-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path className=" origin-center" d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
              </svg>
              <h1 className="my-auto md:text-xl lg:px-10 font-bold text-left pl-5">{header}</h1>
            </div>
          <div>
              <p className="px-10 pt-5 pb-2 text-left max-md:text-sm">{body}</p>
              <p className="pb-5 text-left px-10 max-md:text-sm">To learn more, visit <a className="text-edumun-primary font-bold">https://edumun.com/committees</a> for more information on seminars and committees.</p>
          </div>
            
          </div>
      </label>
    );
}