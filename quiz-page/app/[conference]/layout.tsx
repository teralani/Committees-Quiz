import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Montserrat } from "next/font/google";
import type { Metadata } from 'next'
import { headers } from "next/headers";

const ALLOWED_SLUGS = ["kingmun", "edumun", "pacmun", "seattlemun"];
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });


const SLUG_METADATA: Record<string, string> = {
    "kingmun": 'KINGMUN',
    "edumun": 'EDUMUN',
    "pacmun": 'PACMUN',
    "seattlemun": 'SeattleMUN'
};

type Props = {
  params: Promise<{ conference: string }>
  children: React.ReactNode
}

const year = new Date().getFullYear()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 2. Await the dynamic conference slug
  const { conference } = await params
  const conferenceName = SLUG_METADATA[conference]

  // 3. Read the custom pathname header injected by middleware
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') || ''

  // 4. Default state (neither)
  let title = `${conferenceName} ${year} Committee Quiz`
  let description = `Find your ideal ${conferenceName} committee.`

  // 5. Change metadata conditionally based on sub-route content
  if (pathname.endsWith('/quiz')) {
    title = `${conferenceName} ${year} Committee Quiz`
    description = `Take the official ${conferenceName} Committee Quiz and discover the perfect committee for you!`
  } else if (pathname.endsWith('/results')) {
    title = `${conferenceName} ${year} Quiz Results`
    description = `View your recommended ${conferenceName} committees' description, topic, and more.`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function ConferenceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { conference: string } | Promise<{ conference: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const conferenceSlug = (resolvedParams.conference || "").toLowerCase();

  if (!ALLOWED_SLUGS.includes(conferenceSlug)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: conference, error } = await supabase
    .from("conferences")
    .select("published")
    .eq("slug", conferenceSlug)
    .maybeSingle();

  if (error || !conference?.published) {
    notFound();
  }


  return <div
    className={montserrat.className}
      style={{
        ["--quiz-primary" as string]: `var(--color-${conferenceSlug}-primary)`,
        ["--quiz-secondary" as string]: `var(--color-${conferenceSlug}-secondary)`,
        ["--quiz-logo" as string]: `var(--${conferenceSlug}-logo)`
      } as React.CSSProperties}
  >{children}</div>;
}