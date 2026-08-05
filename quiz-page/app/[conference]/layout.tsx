import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Montserrat } from "next/font/google";

const ALLOWED_SLUGS = ["kingmun", "edumun", "pacmun", "seattlemun"];
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

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