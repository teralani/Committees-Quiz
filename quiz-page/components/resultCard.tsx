"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

type Committee = {
  id: string;
  name: string;
  acronym: string;
  description: string;
  difficulty: string;
  topics: string[];
  img_url: string;
};

type Result = {
  idx: number;
  name: string;
  percentage: number;
};

interface CommitteeResultCardProps {
  result: Result;
  committee?: Committee;
  index: number;
  conferenceSlug: string;
  showPercentage?: boolean;
  committeeLink: string;
}

const CommitteeResultCard = memo(
  ({
    result,
    committee,
    index,
    conferenceSlug,
    showPercentage = true,
    committeeLink,
  }: CommitteeResultCardProps) => {

    const primary = "var(--quiz-primary)";

    return (
      <div className="mb-4 w-full bg-white md:pr-10 md:pl-5 max-md:px-10 pb-10 py-5 rounded-2xl">
        
        <div className="flex justify-between pb-2 align-middle w-full">
          {showPercentage && (
            <div
              className="
                relative h-7 md:h-5 rounded-r-full md:rounded-full
                transition-all duration-500 bg-linear-to-br from-(--quiz-primary) to-(--quiz-secondary)
              "
              style={{
                width: `${result.percentage}%`
              }}
            >
              <p className="text-sm right-4 text-white font-bold absolute max-md:mt-1">
                {result.percentage}% match
              </p>
            </div>
          )}
        </div>


        <div className="flex gap-8 lg:mt-3 md:gap-10 max-md:flex-col">

          {/* Rank */}
          <div className="
            max-md:relative max-md:-top-10.5 max-md:-left-8 max-md:h-0
            md:min-h-max w-0 md:flex md:flex-col md:justify-around
          ">
            <div
              className="
                text-center font-bold flex flex-col justify-around
                text-white rounded-full text-2xl w-10 h-10
              "
              style={{
                backgroundColor: primary,
              }}
            >
              {index + 1}
            </div>
          </div>


          {/* Image */}
          <div
            className="
              bg-blue-50 md:ml-6 my-auto max-md:w-full h-50
              md:aspect-square lg:h-60 lg:w-60 xl:h-70 xl:w-70
              md:h-50 md:w-50 max-md:mx-auto
            "
          >
            {committee?.img_url ? (
              <Image
                className="card-img object-cover h-full w-full"
                src={committee.img_url}
                alt={committee.acronym || ""}
                height={300}
                width={300}
                sizes="(max-width:768px) 100vw, 300px"
                loading="lazy"
              />
            ) : (
              <div className="card-img object-cover h-full w-full" />
            )}
          </div>


          {/* Content */}
          <div className="w-full">

            <p
              className="
                text-left max-md:text-xl text-2xl font-bold my-2
              "
              style={{
                color: primary,
              }}
            >
              {result.name}
            </p>


            <p className="md:text-sm lg:text-md text-start max-md:text-sm text-gray-600">
              {committee?.description || ""}
            </p>


            <p
              className={`
                rounded-full py-1 px-3 my-5 max-w-min max-md:text-sm
                ${
                  committee?.difficulty === "Advanced"
                    ? "text-red-600 bg-red-100"
                    : committee?.difficulty === "Intermediate"
                    ? "text-amber-600 bg-amber-100"
                    : "text-green-700 bg-green-100"
                }
              `}
            >
              {committee?.difficulty || ""}
            </p>


            <p className="text-start font-bold mt-5">
              Topic{(committee?.topics?.length || 0) > 1 ? "s" : ""}:
            </p>


            <div className="my-2 flex gap-3 w-full flex-wrap">
              {(committee?.topics || []).map((topic, idx) => (
                <p
                  key={idx}
                  className="
                    max-md:text-sm rounded-full py-1 px-3 bg-gray-200
                  "
                >
                  {topic}
                </p>
              ))}
            </div>


            <Link
              href={committeeLink}
              target="_blank"
            >
              <button
                className="
                  w-full relative bottom-2 mt-7 rounded-lg p-3
                  bg-(--quiz-primary)
                  hover:bg-(--quiz-secondary)
                  hover:-translate-y-1
                  transition
                "
              >
                <p className="text-white max-md:text-xs font-bold text-sm">
                  Learn more about {committee?.acronym || ""}
                </p>
              </button>
            </Link>

          </div>
        </div>

      </div>
    );
  },
  (prev, next) => {
     return (
      prev.result.name === next.result.name &&
      prev.result.percentage === next.result.percentage &&
      prev.committee?.id === next.committee?.id &&
      prev.index === next.index &&
      prev.committeeLink === next.committeeLink
    );
  }
);

CommitteeResultCard.displayName = "CommitteeResultCard";

export default CommitteeResultCard;