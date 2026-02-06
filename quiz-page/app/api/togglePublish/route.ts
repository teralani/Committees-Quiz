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

    // Fetch the conference
    const { data: conf, error: fetchErr } = await supabase
      .from('conferences')
      .select('id, published')
      .eq('slug', conferenceSlug)
      .single();

    if (fetchErr || !conf) {
      console.error('Conference fetch error', fetchErr);
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
    }

    if (!conf.id) {
      console.error('Conference missing id', conf);
      return NextResponse.json({ error: 'Invalid conference data' }, { status: 500 });
    }

    const newPublished = !Boolean(conf.published);

    const { data: updatedRows, error: updateErr } = await supabase
      .from('conferences')
      .update({ published: newPublished })
      .select('published')
      .eq('id', conf.id);

    if (updateErr || !updatedRows || updatedRows.length === 0) {
      console.error('Conference update error', updateErr);
      return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 });
    }

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

    return NextResponse.json({ ok: true, published: updated.published });
  } catch (err: any) {
    console.error('togglePublish error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
