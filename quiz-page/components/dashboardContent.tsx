"use client"
import { useEffect, useState } from "react";
import committees from "@/public/committees.json"
import MultiRangeSlider from "@/components/multiRangeBar";
import { createBrowserClient } from "@supabase/ssr";

const conferenceName = "KINGMUN";

const persistQuestions = async (questions: any) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return false;
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    // find conference + Quiz page
    const { data: confData, error: confError } = await supabase
      .from("conferences")
      .select("id, pages(id, name)")
      .eq("name", conferenceName)
      .limit(1)
      .maybeSingle();
    console.debug("confData", confData, "confError", confError);
    if (confError) return false;
    if (!confData || !Array.isArray(confData.pages)) {
      console.error("Conference or pages not found", confData);
      return false;
    }

    const quizPage = confData.pages.find((p: any) => p.name === "Quiz");
    if (!quizPage) {
      console.error("Quiz page not found for conference", confData.pages);
      return false;
    }
    const pageId = quizPage.id;
    const body = JSON.stringify({ questions });

    // check existing section (get id and current body)
    const { data: existing, error: selErr } = await supabase
      .from("page_sections")
      .select("id, body")
      .eq("page_id", pageId)
      .eq("key", "quiz_draft")
      .limit(1)
      .maybeSingle();
    console.debug("existing section", existing, "select error", selErr);
    if (selErr) return false;

    if (existing && existing.id) {
      // update and request returned rows to inspect
      const { data: updateData, error: updateError } = await supabase
        .from("page_sections")
        .update({ body, title: "Quiz Draft" })
        .eq("id", existing.id)
        .select("id, body")
        .maybeSingle();
      console.debug("updateData", updateData, "updateError", updateError);
      if (updateError) return false;
      // verify save by refetching the row
      const { data: verify, error: verifyErr } = await supabase
        .from("page_sections")
        .select("id, body")
        .eq("id", existing.id)
        .maybeSingle();
      console.debug("verify after update", verify, verifyErr);
      if (verifyErr) return false;
      if (!verify || verify.body !== body) {
        console.error("Updated body does not match payload", { verifyBody: verify?.body, expected: body });
        return false;
      }
      return true;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from("page_sections")
        .insert({
          page_id: pageId,
          key: "quiz_draft",
          title: "Quiz Draft",
          body,
          position: 0,
        })
        .select("id, body")
        .maybeSingle();
      console.debug("insertData", insertData, "insertError", insertError);
      if (insertError) return false;
      // verify insert
      const { data: verifyInsert, error: verifyInsertErr } = await supabase
        .from("page_sections")
        .select("id, body")
        .eq("id", insertData?.id)
        .maybeSingle();
      console.debug("verify after insert", verifyInsert, verifyInsertErr);
      if (verifyInsertErr) return false;
      if (!verifyInsert || verifyInsert.body !== body) {
        console.error("Inserted body does not match payload", { verifyBody: verifyInsert?.body, expected: body });
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error("persistQuestions unexpected error:", err);
    return false;
  }
};

type Option = {
  text: string;
  weights?: number[];
  range?: number;
};
type Question = {
  text: string;
  options: { text: string; weights: number[]; range?: number }[];
  slider?: boolean;
  max?: number;
};

const INDEXING = (committees as Array<{name:string, acronym:string, description:string, difficulty:string, topics:Array<string>}>).map((committee => committee.acronym))

export default function DashboardContent() {
    const [selected, setSelected] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);

    // Fetch from Supabase on mount (and map DB shape -> editor shape).
    useEffect(() => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
      }
      const supabase = createBrowserClient(supabaseUrl, supabaseKey);
      const conferenceName = "KINGMUN";

      async function fetchQuestionsFromDb() {
        try {
          const { data, error } = await supabase
            .from("conferences")
            .select(`
              id,
              name,
              pages (
                id,
                name,
                quiz_questions (
                  id,
                  text,
                  slider,
                  max,
                  question_options (
                    id,
                    text,
                    range,
                    option_weights (
                      weight
                    )
                  )
                )
              )
            `)
            .eq("name", conferenceName)
            .eq("pages.name", "Quiz")
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error("fetch error", error);
            return;
          }
          if (!data) return;

          const page = (data.pages || []).find((p: any) => p.name === "Quiz");
          const dbQuestions = (page?.quiz_questions || []).map((qq: any) => ({
            text: qq.text ?? "",
            slider: !!qq.slider,
            max: typeof qq.max === "number" ? qq.max : undefined,
            options: (qq.question_options || []).map((opt: any) => ({
              text: opt.text ?? "",
              range: typeof opt.range === "number" ? opt.range : undefined,
              weights: (opt.option_weights || []).map((w: any) => Number(w?.weight ?? 0)),
            })),
          }));

          // If user has a local edit buffer, prefer that (per your requirement)
          const local = localStorage.getItem("editorQuestions");
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setQuestions(parsed);
                return;
              }
            } catch {
              // fall through to use DB version
            }
          }

          // prefer saved draft in page_sections if present
          const { data: draft, error: draftErr } = await supabase
            .from("page_sections")
            .select("body")
            .eq("page_id", page?.id)
            .eq("key", "quiz_draft")
            .limit(1)
            .maybeSingle();
          console.debug("draft", draft, "draftErr", draftErr);

          if (draft && draft.body) {
            try {
              const parsed = JSON.parse(draft.body);
              if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                setQuestions(parsed.questions);
                return;
              }
            } catch (e) {
              console.warn("Failed to parse draft.body", e);
            }
          }

          setQuestions(dbQuestions);
        } catch (err) {
          console.error("unexpected fetchQuestionsFromDb error", err);
        }
      }

      fetchQuestionsFromDb();
    }, []);

    // Keep a local-edit buffer in localStorage for UX only; server updates only on Save.
    useEffect(() => {
        localStorage.setItem("editorQuestions", JSON.stringify(questions));
    }, [questions]);

    useEffect(() => {
    const q = questions[selected];
    if (!q) return;

    if (q.slider) {
        const hasAllRanges = q.options.every((o) => typeof o.range === "number");
        if (!hasAllRanges) {
        const defaultMax = q.max ?? 5;
        const newOpts = q.options.map((o, idx) => ({
            ...o,
            range: typeof o.range === "number" ? o.range! : Math.round(((idx + 1) / q.options.length) * defaultMax),
        }));
        updateQuestion(selected, { options: newOpts });
        }
    }
    }, [selected, questions]);

    // Helpers
    const updateQuestion = (idx: number, patch: Partial<Question>) =>
        setQuestions((s) => s.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

    const updateOption = (qIdx: number, optIdx: number, patch: Partial<Option>) =>
        setQuestions((s) =>
        s.map((q, i) =>
            i !== qIdx ? q : { ...q, options: q.options.map((o, j) => (j === optIdx ? { ...o, ...patch } : o)) }
        )
        );

    const updateWeight = (qIdx: number, optIdx: number, weightIdx: number, value: number) =>
        setQuestions((s) =>
        s.map((q, i) =>
            i !== qIdx
            ? q
            : {
                ...q,
                options: q.options.map((o, j) =>
                    j !== optIdx
                    ? o
                    : {
                        ...o,
                        weights: (() => {
                            const w = (o.weights || Array(INDEXING.length).fill(0)).slice();
                            w[weightIdx] = Number(value) || 0;
                            return w;
                        })(),
                        }
                ),
                }
        )
        );

    // Toggle slider mode: initialize ranges (default to evenly-spaced values) or clear them.
    const toggleSlider = (qIdx: number, checked: boolean) =>
        setQuestions((s) =>
        s.map((q, i) => {
            if (i !== qIdx) return q;
            if (!checked) {
            return { ...q, slider: false, max: undefined, options: q.options.map((o) => ({ ...o, range: undefined })) };
            }
            const max = q.max ?? 5;
            const hasRanges = q.options.some((o) => typeof o.range === "number");
            const options = q.options.map((o, idx) => ({
            ...o,
            range: hasRanges ? o.range ?? 0 : Math.round(((idx + 1) / q.options.length) * max),
            }));
            return { ...q, slider: true, max, options };
        })
        );

    // Operations
    const addQuestion = () =>
        setQuestions((s) => [
        ...s,
        { text: "New question", options: [{ text: "Option 1", weights: Array(INDEXING.length).fill(0) }] },
        ]);

    const removeQuestion = (idx: number) =>
        setQuestions((s) => {
        const copy = s.slice();
        copy.splice(idx, 1);
        setSelected((prev) => Math.max(0, Math.min(copy.length - 1, prev)));
        return copy;
        });

    const addOption = (qIdx: number) =>
        setQuestions((s) =>
        s.map((q, i) =>
            i !== qIdx ? q : { ...q, options: [...q.options, { text: `Option ${q.options.length + 1}`, weights: Array(INDEXING.length).fill(0) }] }
        )
        );

    const removeOption = (qIdx: number, optIdx: number) =>
        setQuestions((s) => s.map((q, i) => (i !== qIdx ? q : { ...q, options: q.options.filter((_, j) => j !== optIdx) })));

    const importJson = (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result));
            const maybe = parsed?.questions || parsed;
            if (!Array.isArray(maybe)) throw new Error("No questions array found");
            setQuestions(maybe);
            setSelected(0);
        } catch {
            alert("Invalid JSON");
        }
        };
        reader.readAsText(file);
    };

    const exportJson = () => {
        const out = JSON.stringify(questions, null, 2);
        const blob = new Blob([out], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "questions.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
        alert("Copied to clipboard");
    };

    // Only persist to server when user presses Save
    const saveToFile = async () => {
        setSaving(true);
        const ok = await persistQuestions(questions);
        setSaving(false);
        if (ok) {
        setSavedAt(new Date().toLocaleString());
        alert("Saved to Supabase");
        } else {
        alert("Save failed. Check server logs.");
        }
    };

    // reset will re-fetch from DB (keeps UI label identical)
    const resetFromDb = async () => {
      if (!confirm("Reset to default from database? This will replace editor contents.")) return;
      // re-run the same fetch logic by reloading page-level data in localStorage and state
      localStorage.removeItem("editorQuestions");
      // simple hack: reload the window to ensure fresh DB state; alternatively call fetch logic again
      window.location.reload();
    };

    if (!questions) return <div className="p-8">Loading...</div>;
    return (
        <>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{conferenceName} Quiz Editor</h2>
                    <p className="text-sm text-slate-500">Edit the quiz questions that live in the database (Quiz page).</p>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                    className="px-4 py-2 bg-rose-500 text-white rounded cursor-pointer"
                    onClick={() => {
                        resetFromDb();
                    }}
                    >
                    Reset from file
                    </button>

                    <label className="px-4 py-2 bg-yellow-400 text-black rounded cursor-pointer">
                    Import
                    <input className="hidden" type="file" accept="application/json" onChange={(e) => importJson(e.target.files?.[0] || null)} />
                    </label>

                    <button className="px-4 py-2 bg-indigo-600 text-white rounded cursor-pointer" onClick={exportJson}>Export</button>

                    <button className="px-4 py-2 bg-kingmun-primary/90 text-white rounded cursor-pointer" onClick={saveToFile} disabled={saving}>
                    {saving ? "Saving…" : "Save progress"}
                    </button>
                </div>
                </div>

                <main className="flex gap-6">
                <aside className="w-72 bg-white border rounded p-3 overflow-auto max-h-[70vh]">
                    <h3 className="font-semibold mb-2">Questions</h3>
                    <ul>
                    {questions.map((q, i) => (
                        <li key={i} onClick={() => setSelected(i)} className={`p-2 rounded cursor-pointer mb-1 ${selected === i ? "bg-sky-100" : "hover:bg-slate-50"}`}>
                        <div className="flex justify-between items-start">
                            <div>
                            <div className="font-medium">{i + 1}. {q.text.slice(0, 60) || "Untitled"}</div>
                            <div className="text-xs text-slate-500">{q.options.length} options{q.slider ? " • slider" : ""}</div>
                            </div>
                            <div className="flex flex-col gap-1 ml-2">
                            <button title="Remove question" className="text-red-600 text-sm" onClick={(e) => { e.stopPropagation(); if (confirm("Remove question?")) removeQuestion(i); }}>
                                Remove
                            </button>
                            </div>
                        </div>
                        </li>
                    ))}
                    </ul>

                    <div className="mt-3">
                    <button className="w-full px-3 py-2 bg-green-600 text-white rounded" onClick={addQuestion}>+ Question</button>
                    </div>
                </aside>

                <section className="flex-1 bg-white border rounded p-4 overflow-auto max-h-[80vh] editor-card">
                    <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                        <h2 className="text-lg font-semibold">Editing Question #{selected + 1}</h2>
                        <span className="text-sm text-slate-500">{questions[selected]?.options?.length || 0} options</span>
                    </div>
                    <div className="text-sm text-slate-500">Indexing: {INDEXING.join(", ")}</div>
                    </div>

                    <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Question text</label>
                    <input value={questions[selected]?.text || ""} onChange={(e) => updateQuestion(selected, { text: e.target.value })} className="w-full border rounded p-2" />
                    <div className="mt-2 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!questions[selected]?.slider} onChange={(e) => toggleSlider(selected, e.target.checked)} />
                        Slider question
                        </label>
                        {questions[selected]?.slider && (
                        <label className="text-sm flex items-center gap-2">
                            Max:
                            <input type="number" min={1} value={questions[selected]?.max ?? 5} onChange={(e) => updateQuestion(selected, { max: Number(e.target.value) })} className="w-20 border rounded p-1" />
                        </label>
                        )}
                    </div>
                    </div>

                    <div>
                    <h3 className="font-semibold mb-2">Options</h3>
                    {(questions[selected]?.options ?? []).map((opt, oi) => (
                        <div key={oi} className="border rounded p-3 mb-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                            <input value={opt.text} onChange={(e) => updateOption(selected, oi, { text: e.target.value })} className="w-full border rounded p-2" />
                            </div>

                            <div className="ml-3 flex flex-col gap-2">
                            <button className="text-xs text-red-600" onClick={() => { if (confirm("Remove option?")) removeOption(selected, oi); }}>Remove</button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Weights</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {INDEXING.map((key, kidx) => (
                                <label key={key} className="text-xs flex items-center gap-2">
                                <span className="w-24 truncate">{key}</span>
                                <input type="number" value={(opt.weights?.[kidx] ?? 0) as number} onChange={(e) => updateWeight(selected, oi, kidx, Number(e.target.value))} className="w-24 border rounded p-1 text-right" />
                                </label>
                            ))}
                            </div>
                        </div>
                        </div>
                    ))}

                    <div className="mb-4">
                        {questions[selected]?.slider ?
                        <MultiRangeSlider
                            outerClassName="w-full my-20"
                            question={questions[selected]}
                            onChange={(updatedRanges: number[]) => {
                                setQuestions((questions) =>
                                questions.map((question, questionIndex) => 
                                    questionIndex !== selected ?
                                    question
                                    :
                                    {
                                        ...question,
                                        options: question.options.map((option, optionIndex)=> ({
                                        ...option,
                                        range: updatedRanges[optionIndex]
                                        }))
                                    }
                                )
                                )
                            }}
                        />
                        : 
                        <div className="text-sm text-slate-500">No range controls — this is not a slider question.</div>
                        }
                    </div>

                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => addOption(selected)}>+ Option</button>
                        <button className="px-3 py-1 bg-rose-500 text-white rounded" onClick={() => {
                        if (!confirm("Zero all weights for this question?")) return;
                        setQuestions((s) => s.map((q, i) => i !== selected ? q : { ...q, options: q.options.map((o) => ({ ...o, weights: Array(INDEXING.length).fill(0) })) }));
                        }}>Zero weights</button>
                    </div>
                    </div>

                    <div className="mt-6 text-sm text-slate-500">{savedAt ? `Last saved: ${savedAt}` : "Not yet saved to the database"}</div>
                </section>
                </main>

                <footer className="mt-6 text-sm text-slate-500">Edits are stored to localStorage. Click "Save to pageText.json" to persist to disk (dev server only).</footer>
            </div>
            <style jsx>
                {`
                input:focus-within{
                    background-color: #FFF;
                }
                `}
            </style>
        </>
    )
}