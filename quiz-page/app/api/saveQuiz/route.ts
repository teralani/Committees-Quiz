import { NextResponse } from "next/server";
import { createActionClient } from "@/utils/supabase/actions.js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const questions = body?.questions;
    const conferenceSlug = body?.conference || "kingmun";
    
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid payload, expected { questions: [...] }" }, { status: 400 });
    }

    const supabase = await createActionClient();

    // Find conference + Quiz page
    const { data: confData, error: confError } = await supabase
      .from("conferences")
      .select("id, name, pages(id, name)")
      .eq("slug", conferenceSlug)
      .limit(1)
      .maybeSingle();

    if (confError || !confData?.pages?.length) {
      return NextResponse.json({ error: "Conference or pages not found" }, { status: 500 });
    }

    const quizPage = confData.pages.find((p: any) => p.name === "Quiz");
    if (!quizPage) {
      return NextResponse.json({ error: "Quiz page not found for conference" }, { status: 500 });
    }

    const pageId = quizPage.id;
    const draftBody = JSON.stringify({ questions });

    // Check if draft exists, then update or insert
    const { data: existing, error: checkErr } = await supabase
      .from("page_sections")
      .select("id")
      .eq("page_id", pageId)
      .eq("key", "quiz_draft")
      .maybeSingle();

    if (checkErr) return NextResponse.json({ error: checkErr.message }, { status: 500 });

    if (existing?.id) {
      // Update existing draft
      const { error: updateErr } = await supabase
        .from("page_sections")
        .update({ body: draftBody, title: "Quiz Draft" })
        .eq("id", existing.id);
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    } else {
      // Insert new draft
      const { error: insertErr } = await supabase
        .from("page_sections")
        .insert({
          page_id: pageId,
          key: "quiz_draft",
          title: "Quiz Draft",
          body: draftBody,
          position: 0,
        });
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Delete all existing questions (cascade deletes options and weights)
    const { error: delErr } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("page_id", pageId);
    
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Insert all questions
    const questionsToInsert = questions.map((q, idx) => ({
      page_id: pageId,
      text: q.text ?? "",
      slider: !!q.slider,
      max: typeof q.max === "number" ? q.max : null,
      position: idx,
    }));

    const { data: insertedQuestions, error: insQErr } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert)
      .select("id");

    if (insQErr || !insertedQuestions?.length) {
      return NextResponse.json({ error: insQErr?.message || "Question insertion failed" }, { status: 500 });
    }

    // Build options batch (link to inserted questions by index order)
    const optionsToInsert: any[] = [];
    questions.forEach((q: any, qIdx: number) => {
      const questionId = insertedQuestions[qIdx].id;
      (q.options || []).forEach((opt: any, optIdx: number) => {
        optionsToInsert.push({
          question_id: questionId,
          text: opt.text ?? "",
          range: typeof opt.range === "number" ? opt.range : null,
          position: optIdx,
          _weights: Array.isArray(opt.weights) ? opt.weights : [],
        });
      });
    });

    if (!optionsToInsert.length) return NextResponse.json({ ok: true });

    // Insert all options
    const { data: insertedOptions, error: insOptErr } = await supabase
      .from("question_options")
      .insert(optionsToInsert.map(({ _weights, ...opt }) => opt))
      .select("id");

    if (insOptErr || !insertedOptions?.length) {
      return NextResponse.json({ error: insOptErr?.message || "Option insertion failed" }, { status: 500 });
    }

    // Build weights batch using inserted option IDs
    const weightsToInsert = optionsToInsert
      .flatMap((opt, idx) =>
        opt._weights.map((weight: any, wIdx: number) => ({
          option_id: insertedOptions[idx].id,
          weight: Number(weight) || 0,
          weight_index: wIdx,
        }))
      );

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