import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferenceSlug, content } = body;

    if (!conferenceSlug || !Array.isArray(content)) {
      return NextResponse.json(
        { error: "Invalid payload, expected { conferenceSlug: string, content: [...] }" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, get the page_id for the Home page of this conference
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select(`
        id,
        conferences!inner (
          slug
        )
      `)
      .eq('name', 'Home')
      .eq('conferences.slug', conferenceSlug)
      .single();

    if (pageError || !pageData) {
      console.error("Error fetching page:", pageError);
      return NextResponse.json(
        { error: "Conference or page not found" },
        { status: 404 }
      );
    }

    const pageId = pageData.id;

    // Get existing sections to match keys with IDs
    const { data: existingSections, error: fetchError } = await supabase
      .from('page_sections')
      .select('id, key')
      .eq('page_id', pageId);

    if (fetchError) {
      console.error("Error fetching existing sections:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch existing sections" },
        { status: 500 }
      );
    }

    // Create a map of key -> id
    const sectionMap = new Map(
      (existingSections || []).map((s: any) => [s.key, s.id])
    );

    // Update each section
    const updates = content.map((section: any) => {
      const sectionId = sectionMap.get(section.key);
      if (!sectionId) {
        console.warn(`No section found for key: ${section.key}`);
        return null;
      }

      return supabase
        .from('page_sections')
        .update({
          title: section.title,
          body: section.body,
          img: section.img,
        })
        .eq('id', sectionId);
    });

    // Filter out null updates and execute all
    const validUpdates = updates.filter(Boolean);
    const results = await Promise.all(validUpdates);

    // Check for errors
    const errors = results.filter((r: any) => r.error);
    if (errors.length > 0) {
      console.error("Some updates failed:", errors);
      return NextResponse.json(
        { error: "Some sections failed to update", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, updated: validUpdates.length });
  } catch (err: any) {
    console.error("savePageContent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
