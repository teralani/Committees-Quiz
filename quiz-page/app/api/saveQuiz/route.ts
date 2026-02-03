import { NextResponse } from "next/server";
import { createActionClient } from "@/utils/supabase/actions.js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const questions = body?.questions;
    const conferenceSlug = body?.conference || "kingmun"; // Default to kingmun for backwards compatibility
    
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid payload, expected { questions: [...] }" }, { status: 400 });
    }

    const supabase = await createActionClient();

    // find conference + Quiz page
    const { data: confData, error: confError } = await supabase
      .from("conferences")
      .select("id, name, pages(id, name)")
      .eq("slug", conferenceSlug)
      .limit(1)
      .maybeSingle();

    if (confError || !confData || !Array.isArray(confData.pages)) {
      return NextResponse.json({ error: "Conference or pages not found" }, { status: 500 });
    }

    const quizPage = confData.pages.find((p: any) => p.name === "Quiz");
    if (!quizPage) {
      return NextResponse.json({ error: "Quiz page not found for conference" }, { status: 500 });
    }
    const pageId = quizPage.id;

    // 1) Persist a draft copy (page_sections) for backwards compatibility / file-like edit
    const draftBody = JSON.stringify({ questions });
    const { data: existing, error: selErr } = await supabase
      .from("page_sections")
      .select("id, body")
      .eq("page_id", pageId)
      .eq("key", "quiz_draft")
      .limit(1)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    if (existing && existing.id) {
      const { error: updateError } = await supabase
        .from("page_sections")
        .update({ body: draftBody, title: "Quiz Draft" })
        .eq("id", existing.id);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      const { error: insertError } = await supabase
        .from("page_sections")
        .insert({
          page_id: pageId,
          key: "quiz_draft",
          title: "Quiz Draft",
          body: draftBody,
          position: 0,
        });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2) Replace quiz_questions / question_options / option_weights for the Quiz page
    
    // First, get all existing question IDs for this page
    const { data: existingQuestions, error: fetchErr } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("page_id", pageId);
    
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // Delete option_weights and question_options explicitly for each question
    for (const q of (existingQuestions || [])) {
      // Get all option IDs for this question
      const { data: existingOptions, error: optFetchErr } = await supabase
        .from("question_options")
        .select("id")
        .eq("question_id", q.id);
      
      if (optFetchErr) {
        console.error("Error fetching options:", optFetchErr);
        continue;
      }

      // Delete all weights for these options
      for (const opt of (existingOptions || [])) {
        const { error: delWeightsErr } = await supabase
          .from("option_weights")
          .delete()
          .eq("option_id", opt.id);
        
        if (delWeightsErr) {
          console.error("Error deleting weights:", delWeightsErr);
        }
      }

      // Delete all options for this question
      const { error: delOptsErr } = await supabase
        .from("question_options")
        .delete()
        .eq("question_id", q.id);
      
      if (delOptsErr) {
        console.error("Error deleting options:", delOptsErr);
      }
    }

    // Finally, delete all questions for the page
    const { error: delErr } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("page_id", pageId);
    
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Insert new questions, options and weights
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const { data: newQ, error: insQErr } = await supabase
        .from("quiz_questions")
        .insert({
          page_id: pageId,
          text: q.text ?? "",
          slider: !!q.slider,
          max: typeof q.max === "number" ? q.max : null,
          position: qIdx,
        })
        .select("id")
        .maybeSingle();

      if (insQErr) return NextResponse.json({ error: insQErr.message }, { status: 500 });
      const qid = newQ?.id;
      if (!qid) continue;

      for (let optIdx = 0; optIdx < (q.options || []).length; optIdx++) {
        const opt = q.options[optIdx];
        const { data: newOpt, error: insOptErr } = await supabase
          .from("question_options")
          .insert({
            question_id: qid,
            text: opt.text ?? "",
            range: typeof opt.range === "number" ? opt.range : null,
            position: optIdx,
          })
          .select("id")
          .maybeSingle();

        if (insOptErr) return NextResponse.json({ error: insOptErr.message }, { status: 500 });
        const optId = newOpt?.id;
        if (!optId) continue;

        const weights = Array.isArray(opt.weights) ? opt.weights : [];
        // Insert weights (one row per committee index). Adjust field names if your schema differs.
        for (let i = 0; i < weights.length; i++) {
          const payload: any = {
            option_id: optId,
            weight: Number(weights[i]) || 0,
            weight_index: i,
          };
          const { error: wErr } = await supabase.from("option_weights").insert(payload);
          if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("saveQuiz error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}