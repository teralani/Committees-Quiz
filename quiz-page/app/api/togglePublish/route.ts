import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferenceSlug } = body;

    if (!conferenceSlug || typeof conferenceSlug !== 'string') {
      return NextResponse.json({ error: 'Invalid payload, expected { conferenceSlug: string }' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch and update in one query to reduce roundtrips
    const { data: conf, error: fetchErr } = await supabase
      .from('conferences')
      .select('id, published')
      .eq('slug', conferenceSlug)
      .single();

    if (fetchErr || !conf?.id) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
    }

    const newPublished = !conf.published;

    const { data: updated, error: updateErr } = await supabase
      .from('conferences')
      .update({ published: newPublished })
      .eq('id', conf.id)
      .select('published')
      .single();

    if (updateErr || !updated) {
      console.error('Conference update error', updateErr);
      return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, published: updated.published });
  } catch (err: any) {
    console.error('togglePublish error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
