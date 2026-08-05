const CommitteeResultCardSkeleton = () => {
    return (
        <div className="mb-4 w-full bg-white md:pr-10 md:pl-5 max-md:px-10 pb-10 py-5 rounded-2xl">


            {/* Percentage */}
            <div className="flex justify-between pb-2 align-middle w-full">
                <div className="bar h-7 md:h-5 w-full rounded-r-full md:rounded-full skeleton" />
            </div>

            <div className="flex gap-8 lg:mt-3 md:gap-10 max-md:flex-col ">

                {/* Rank */}
                <div
                    className="
            max-md:relative max-md:-top-10.5 max-md:-left-8 max-md:h-0
            md:min-h-max w-0 md:flex md:flex-col md:justify-around
          "
                >
                    <div className="rank h-10 w-10 rounded-full skeleton" />
                </div>


                {/* Image */}
                <div className="md:ml-6 my-auto max-md:w-full h-50
                md:aspect-square lg:h-60 lg:w-60 xl:h-70 xl:w-70
                md:h-50 md:w-50 max-md:mx-auto">
                    <div
                        className="
                skeleton w-full h-full
            "
                    />
                </div>



                {/* Content - mirror real card */}
                <div className="w-full min-w-0">

                    {/* title */}
                    <div className="my-2 h-8 w-2/3 rounded skeleton" />


                    {/* description */}
                    <div className="md:text-sm lg:text-md space-y-2">
                        <div className="h-4 w-full rounded skeleton" />
                        <div className="h-4 w-full rounded skeleton" />
                        <div className="h-4 w-3/4 rounded skeleton" />
                    </div>


                    {/* difficulty */}
                    <div className="my-5 h-8 w-28 rounded-full skeleton" />


                    {/* topic title */}
                    <div className="mt-5 h-5 w-20 rounded skeleton" />


                    {/* topics */}
                    <div className="my-2 flex gap-3 w-full flex-wrap">
                        <div className="h-8 w-64 rounded-full skeleton" />
                    </div>


                    {/* Match Link + Button structure */}
                    <div className="w-full">
                        <div className="h-12 w-full rounded-lg skeleton" />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CommitteeResultCardSkeleton