import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_SLUGS = ["kingmun", "edumun", "pacmun", "seattlemun"];

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

  return <>{children}</>;
}