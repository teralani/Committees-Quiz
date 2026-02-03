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
    
    // Efficiently delete all related data in one batch query using cascade
    // This deletes all existing questions and their related options/weights
    const { error: delErr } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("page_id", pageId);
    
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Batch insert all questions, options, and weights
    // First, insert all questions
    const questionsToInsert = questions.map((q, qIdx) => ({
      page_id: pageId,
      text: q.text ?? "",
      slider: !!q.slider,
      max: typeof q.max === "number" ? q.max : null,
      position: qIdx,
    }));

    const { data: insertedQuestions, error: insQErr } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert)
      .select("id");

    if (insQErr) return NextResponse.json({ error: insQErr.message }, { status: 500 });
    if (!insertedQuestions || insertedQuestions.length !== questions.length) {
      return NextResponse.json({ error: "Question insertion failed" }, { status: 500 });
    }

    // Then insert all options for all questions in batches
    const optionsToInsert: any[] = [];
    questions.forEach((q: any, qIdx: number) => {
      const questionId = insertedQuestions[qIdx].id;
      (q.options || []).forEach((opt: any, optIdx: number) => {
        optionsToInsert.push({
          question_id: questionId,
          text: opt.text ?? "",
          range: typeof opt.range === "number" ? opt.range : null,
          position: optIdx,
          _qIdx: qIdx,
          _optIdx: optIdx,
        });
      });
    });

    if (optionsToInsert.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { data: insertedOptions, error: insOptErr } = await supabase
      .from("question_options")
      .insert(optionsToInsert.map(({ _qIdx, _optIdx, ...opt }) => opt))
      .select("id");

    if (insOptErr) return NextResponse.json({ error: insOptErr.message }, { status: 500 });
    if (!insertedOptions || insertedOptions.length !== optionsToInsert.length) {
      return NextResponse.json({ error: "Option insertion failed" }, { status: 500 });
    }

    // Finally, insert all weights in one batch
    const weightsToInsert: any[] = [];
    optionsToInsert.forEach((opt: any, idx: number) => {
      const optionId = insertedOptions[idx].id;
      const weights = Array.isArray(questions[opt._qIdx].options[opt._optIdx].weights) 
        ? questions[opt._qIdx].options[opt._optIdx].weights 
        : [];
      
      weights.forEach((weight: any, weightIdx: number) => {
        weightsToInsert.push({
          option_id: optionId,
          weight: Number(weight) || 0,
          weight_index: weightIdx,
        });
      });
    });

    if (weightsToInsert.length > 0) {
      const { error: wErr } = await supabase
        .from("option_weights")
        .insert(weightsToInsert);
      
      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("saveQuiz error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}