"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import MultiRangeSlider from "@/components/multiRangeBar";
import { createBrowserClient } from "@supabase/ssr";

const persistQuestions = async (questions: any, conference: string) => {
  try {
    const res = await fetch("/api/saveQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions, conference }),
    });
    if (!res.ok) {
      console.error("Save failed:", await res.text());
      return false;
    }
    const parsed = await res.json();
    if (parsed?.ok) return true;
    console.error("Save response error:", parsed);
    return false;
  } catch (err) {
    console.error("persistQuestions unexpected error:", err);
    return false;
  }
};
type Option = {
  text: string;
  weights?: number[];
  range?: number;
  clientId?: string;
};
type Question = {
  text: string;
  options: Option[];
  slider?: boolean;
  max?: number;
};

const formatUpdatedAt = () => new Date().toLocaleString();

const STORAGE_KEY = "slug_quiz";

const ALLOWED_SLUGS = [ 'edumun', 'pacmun', 'seattlemun', 'kingmun'];

const createOptionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `opt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const withOptionId = (option: Option): Option => ({
  ...option,
  clientId: option.clientId ?? createOptionId(),
});

const normalizeSliderOptions = (options: Option[], max: number) => {
  const nextOptions = options.map(withOptionId);
  const hasAnyRange = nextOptions.some((option) => typeof option.range === "number");

  if (!hasAnyRange) {
    return nextOptions.map((option, index) => ({
      ...option,
      range: Math.round(((index + 1) / (nextOptions.length || 1)) * max),
    }));
  }

  let lastKnownRange: number | null = null;

  return nextOptions.map((option, index) => {
    if (typeof option.range === "number") {
      lastKnownRange = option.range;
      return option;
    }

    const nextKnownRange = nextOptions
      .slice(index + 1)
      .find((candidate) => typeof candidate.range === "number")?.range;

    let range: number;
    if (typeof lastKnownRange === "number" && typeof nextKnownRange === "number" && nextKnownRange > lastKnownRange) {
      range = Math.round((lastKnownRange + nextKnownRange) / 2);
    } else if (typeof lastKnownRange === "number") {
      range = Math.min(max, lastKnownRange + 1);
    } else if (typeof nextKnownRange === "number") {
      range = Math.max(0, nextKnownRange - 1);
    } else {
      range = Math.round(((index + 1) / (nextOptions.length + 1)) * max);
    }

    lastKnownRange = range;
    return { ...option, range };
  });
};

const appendSliderOption = (options: Option[], max: number, indexingLength: number) => {
  const nextOptions = options.map(withOptionId);
  const lastRange = [...nextOptions].reverse().find((option) => typeof option.range === "number")?.range;
  const range = typeof lastRange === "number" ? Math.min(max, lastRange + 1) : Math.round((nextOptions.length + 1) / 2);

  return [
    ...nextOptions,
    withOptionId({
      text: `Option ${nextOptions.length + 1}`,
      weights: Array(indexingLength).fill(0),
      range,
    }),
  ];
};

export default function DashboardContent() {
    const [selected, setSelected] = useState<number>(-1);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [conferenceSlug, setConferenceSlug] = useState<string>("kingmun");
    const [availableConferences, setAvailableConferences] = useState<{name: string, slug: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [indexing, setIndexing] = useState<string[]>([]);
    const [slugHydrated, setSlugHydrated] = useState(false);
    const selectedRef = useRef<number>(0);

    useEffect(() => {
      const storedSlug = localStorage.getItem(STORAGE_KEY);
      if (storedSlug) {
        setConferenceSlug(storedSlug);
      }
      setSlugHydrated(true);
    }, []);

    useEffect(() => {
      if (!slugHydrated) {
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
      }
      const supabase = createBrowserClient(supabaseUrl, supabaseKey);
      let cancelled = false;

      async function fetchQuestionsFromDb() {
        setLoading(true);
        try {
          const [conferencesResult, quizDataResult, committeesResult] = await Promise.all([
            supabase
              .from("conferences")
              .select("id, name, slug")
              .order("name", { ascending: true }),
            supabase
              .from("conferences")
              .select(`
                id,
                pages (
                  id,
                  name,
                  quiz_questions (
                    id,
                    text,
                    slider,
                    max,
                    position,
                    question_options (
                      id,
                      text,
                      range,
                      position,
                      option_weights (
                        weight,
                        weight_index
                      )
                    )
                  )
                )
              `)
              .eq("slug", conferenceSlug)
              .maybeSingle(),
            supabase
              .from("conferences")
              .select(`
                id,
                committees (
                  acronym,
                  position
                )
              `)
              .eq("slug", conferenceSlug)
              .maybeSingle()
          ]);

          console.log(quizDataResult)

          if (!conferencesResult.error && conferencesResult.data) {
            const mapped = conferencesResult.data.map((c: any) => ({ name: c.name, slug: c.slug }));
            const allowed = mapped
                .filter((c) => ALLOWED_SLUGS.includes(c.slug))
                .sort((a, b) => ALLOWED_SLUGS.indexOf(a.slug) - ALLOWED_SLUGS.indexOf(b.slug));
            const others = mapped
                .filter((c) => !ALLOWED_SLUGS.includes(c.slug))
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
            const filtered = [...allowed, ...others];
            setAvailableConferences(filtered);

            const conferenceExists = filtered.some((c) => c.slug === conferenceSlug);
            if (!conferenceExists && filtered.length > 0) {
              const fallbackSlug = filtered[0].slug;
              setConferenceSlug(fallbackSlug);
                localStorage.setItem(STORAGE_KEY, fallbackSlug);
              return;
            }
          }

          if (!committeesResult.error && committeesResult.data) {
            const rawCommittees = (committeesResult.data.committees || []);
            console.log("Committees from Supabase (raw):", rawCommittees);
            const committees = rawCommittees
              .slice()
              .sort((a: any, b: any) => {
                const posA = (typeof a.position === 'number') ? a.position : 9999;
                const posB = (typeof b.position === 'number') ? b.position : 9999;
                return posA - posB;
              });
            const acronyms = committees.map((c: any) => c.acronym);
            setIndexing(acronyms);
          } else {
            setIndexing([]);
          }

          const { data: confData, error: confErr } = quizDataResult;
          if (confErr) {
            console.error("Failed to load conference quiz data", confErr);
            setQuestions([]);
            return;
          }

          if (!confData) {
            console.warn(`Conference slug \"${conferenceSlug}\" was not found.`);
            setQuestions([]);
            return;
          }

          const page = confData.pages?.find((p: any) => p.name === "Quiz");
          if (!page) {
            console.info(`No Quiz page found for conference \"${conferenceSlug}\".`);
            setQuestions([]);
            return;
          }

          const dbQuestions: Question[] = (page.quiz_questions || [])
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
            .map((qq: any) => {
              const options = (qq.question_options || [])
                .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                .map((opt: any) => {
                  const weightsData = (opt.option_weights || [])
                    .sort((a: any, b: any) => (a.weight_index ?? 0) - (b.weight_index ?? 0));
                  
                  const weights = weightsData.map((w: any) => Number(w?.weight ?? 0));
                  const committeeCount = committeesResult.data?.committees?.length || weights.length || 1;
                  const padded = Array.from({ length: committeeCount }, (_, i) => weights[i] ?? 0);

                  return {
                    text: opt.text ?? "",
                    range: typeof opt.range === "number" ? opt.range : undefined,
                    weights: padded,
                    clientId: createOptionId(),
                  };
                });

              return {
                text: qq.text ?? "",
                slider: !!qq.slider,
                max: typeof qq.max === "number" ? qq.max : undefined,
                options,
              };
            });

          if (!cancelled) {
            setQuestions(dbQuestions);
          }
        } catch (err) {
          console.error("unexpected fetchQuestionsFromDb error", err);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }
      fetchQuestionsFromDb();
      return () => {
        cancelled = true;
      };
    }, [conferenceSlug, slugHydrated]);

    useEffect(() => {
        if (indexing.length > 0 && questions.length > 0) {
        setQuestions((prevQuestions) => {
          let hasChanges = false;
          const nextQuestions = prevQuestions.map((q) => {
            let questionChanged = false;
            const nextOptions = q.options.map((opt) => {
              const currentWeights = opt.weights || [];
              if (currentWeights.length !== indexing.length) {
                questionChanged = true;
                hasChanges = true;
                const resized = Array.from({ length: indexing.length }, (_, i) => currentWeights[i] ?? 0);
                return { ...opt, weights: resized };
              }
              return opt;
            });

            return questionChanged ? { ...q, options: nextOptions } : q;
          });

          return hasChanges ? nextQuestions : prevQuestions;
        });
        }
    }, [indexing.length]);

    useEffect(() => {
        if (questions.length > 0) {
            localStorage.setItem("editorQuestions", JSON.stringify(questions));
        }
    }, [questions]);

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
                            const w = (o.weights || Array(indexing.length).fill(0)).slice();
                            w[weightIdx] = Number(value) || 0;
                            return w;
                        })(),
                        }
                ),
                }
        )
        );

    const toggleSlider = (qIdx: number, checked: boolean) =>
        setQuestions((s) =>
        s.map((q, i) => {
            if (i !== qIdx) return q;
            if (!checked) {
            return { ...q, slider: false, max: undefined, options: q.options.map((o) => ({ ...o, range: undefined })) };
            }
            const max = q.max ?? 5;
            const options = normalizeSliderOptions(q.options, max);
            return { ...q, slider: true, max, options };
        })
        );

    const addQuestion = () =>
        setQuestions((s) => [
        ...s,
      { text: "New question", options: [withOptionId({ text: "Option 1", weights: Array(indexing.length).fill(0) })] },
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
            i !== qIdx
              ? q
              : {
                  ...q,
                  options: q.slider
                    ? appendSliderOption(q.options, q.max ?? 5, indexing.length)
                    : [...q.options, withOptionId({ text: `Option ${q.options.length + 1}`, weights: Array(indexing.length).fill(0) })],
                }
        )
        );

    const removeOption = (qIdx: number, optIdx: number) =>{
        if (confirm("Remove option?")) {setQuestions((s) => s.map((q, i) => (i !== qIdx ? q : { ...q, options: q.options.filter((_, j) => j !== optIdx) })))}
    }
        

    const importJson = (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result));
            const maybe = parsed?.questions || parsed;
            if (!Array.isArray(maybe)) throw new Error("No questions array found");
            setQuestions(
              maybe.map((question: Question) => ({
                ...question,
                options: question.slider
                  ? normalizeSliderOptions((question.options || []) as Option[], question.max ?? 5)
                  : (question.options || []).map(withOptionId),
              }))
            );
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

    const saveToFile = useCallback(async () => {
      setSaving(true);
      const ok = await persistQuestions(questions, conferenceSlug);
      setSaving(false);
      if (ok) {
        localStorage.removeItem("editorQuestions");
        const updatedAt = formatUpdatedAt();
        setSavedAt(updatedAt);
        alert(`Website updated on ${updatedAt}. The quiz page now will display the updated quiz data.`);
        localStorage.setItem(STORAGE_KEY, conferenceSlug)
      } else {
        alert("Save failed. Check server logs.");
      }
    }, [conferenceSlug, questions]);

    const saveToFileRef = useRef(saveToFile);
    useEffect(() => {
      saveToFileRef.current = saveToFile;
    }, [saveToFile]);

    useEffect(() => {
      selectedRef.current = selected;
    }, [selected]);

    const handleSliderChange = useCallback((updatedRanges: number[]) => {
      const selectedIndex = selectedRef.current;
      setQuestions((prevQuestions) => {
        let hasChanges = false;
        const nextQuestions = prevQuestions.map((question, questionIndex) => {
          if (questionIndex !== selectedIndex) return question;

          let questionChanged = false;
          const nextOptions = question.options.map((option, optionIndex) => {
            const nextRange = updatedRanges[optionIndex];
            if (option.range === nextRange) return option;
            questionChanged = true;
            hasChanges = true;
            return {
              ...option,
              range: nextRange,
            };
          });

          return questionChanged ? { ...question, options: nextOptions } : question;
        });

        return hasChanges ? nextQuestions : prevQuestions;
      });
  }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
        saveToFileRef.current();
            }
        };
        document.addEventListener("keydown", handler, false);
        return () => {
            document.removeEventListener("keydown", handler, false);
        };
  }, [])

    const resetFromDb = async () => {
      if (!confirm("Reset to default from database? This will replace editor contents.")) return;
      localStorage.removeItem("editorQuestions");
      window.location.reload();
    };


    const printDebug = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
      }
      const supabase = createBrowserClient(supabaseUrl, supabaseKey);
      const {data, error} = await supabase
        .from('conferences')
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
        .eq('slug', conferenceSlug).eq('pages.name', 'Quiz')

      console.log(data)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-kingmun-primary mb-4"></div>
                    <p className="text-xl font-semibold text-gray-700">Loading {conferenceSlug.toUpperCase()} quiz data...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-6 flex items-center justify-between w-full max-md:justify-center">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="min-w-20">
                        <h2 className="text-2xl font-bold">Quiz Editor</h2>
                        <p className="text-sm text-slate-500 mr-19">Edit the quiz questions and options.</p>
                    </div>
                    <div>
                        <label htmlFor="conference-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Conference
                        </label>
                        <select
                            id="conference-select"
                            value={conferenceSlug}
                            onChange={(e) => {
                                setConferenceSlug(e.target.value);
                              localStorage.setItem(STORAGE_KEY, e.target.value)
                            }}
                            className="px-3 py-2 border border-gray-300 rounded cursor-pointer bg-white"
                        >
                            {availableConferences.map((conf) => (
                                <option key={conf.slug} value={conf.slug}>
                                    {conf.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap ml-10 gap-2 items-center">
                    <button
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-700 text-white rounded cursor-pointer"
                    onClick={() => {
                        resetFromDb();
                    }}
                    >
                    Reset All Changes
                    </button>
                    <button
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-700 text-white rounded cursor-pointer"
                    onClick={(e) => window.open(`https://committees-quiz.vercel.app/${conferenceSlug}/quiz`)}
                    >
                    Go to Site
                    </button>
                    <button className="px-4 py-2 bg-kingmun-primary/90 hover:bg-kingmun-primary text-white rounded cursor-pointer" onClick={saveToFile} disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
                </div>

                <main className="flex gap-6 flex-wrap">
                <aside className="w-72 bg-white border rounded p-3 overflow-auto max-h-[70vh]">
                    <h3 className="font-semibold mb-2">Questions</h3>
                    <ul>
                    { questions.map((q, i) => (
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
                {selected < 0 && questions.length > 0 && <section className="flex-1 flex-col flex justify-center min-w-96 bg-white border rounded p-4 overflow-auto max-h-[80vh] editor-card">
                  <h1 className="text-3xl text-black font-bold text-center">Select a question to edit</h1>
                  <p className="text-center mt-2">Click a question from the list in the left panel to start editing.</p>  
                </section>}
                {selected < 0 && questions.length <= 0 && <section className="flex-1 flex-col flex justify-center min-w-96 bg-white border rounded p-4 overflow-auto max-h-[80vh] editor-card">
                  <h1 className="text-3xl text-black font-bold text-center">Create a question to edit</h1>
                  <p className="text-center mt-4">Click the <span className="bg-green-600 text-white py-1 px-2 rounded-md mx-1 text-sm">+ Question</span> button in the left panel to start editing.</p>  
                </section>}
                {selected>=0 && <section className="flex-1 min-w-96 bg-white border rounded p-4 overflow-auto max-h-[80vh] editor-card">
                    <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-left">Editing Question #{selected + 1}</h2>
                        <div className="text-sm text-slate-500">
                          <p className="text-sm text-slate-500">{questions[selected]?.options?.length || 0} options</p>
                          <p>Indexing: {indexing.join(", ")}</p></div>
                        </div>
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
                            Slider max:
                            <input type="number" min={1} value={questions[selected]?.max ?? 5} onChange={(e) => updateQuestion(selected, { max: Number(e.target.value) })} className="w-20 border rounded p-1" />
                        </label>
                        )}
                    </div>
                    </div>

                    <div>
                    <h3 className="font-semibold mb-2">Options</h3>
                    {(questions[selected]?.options ?? []).map((opt, oi) => (
                      <div key={opt.clientId ?? oi} className="rounded p-3 mb-3 shadow-md hover:bg-neutral-50">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                            <input spellCheck="true" value={opt.text} onChange={(e) => updateOption(selected, oi, { text: e.target.value })} className="w-full border rounded p-2" />
                            </div>

                            <div className="ml-3 flex flex-col gap-2">
                            <button className="text-xs text-red-600 cursor-pointer" onClick={() => { if (confirm("Remove option?")) removeOption(selected, oi); }}>Remove</button>
                            </div>
                        </div>

                        <div>
                            <div>Weights</div>
                            {indexing.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">No committees loaded. Please ensure committees are added to this conference in the Committees tab.</p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {indexing.map((key, kidx) => (
                                  <label key={key} className="text-xs flex items-center gap-2">
                                    <span className="w-24 truncate">{key}</span>
                                    <input type="number" value={(opt.weights?.[kidx] ?? 0) as number} onChange={(e) => updateWeight(selected, oi, kidx, Number(e.target.value))} className="w-24 border rounded p-1 text-right" />
                                  </label>
                                ))}
                              </div>
                            )}
                        </div>
                        </div>
                    ))}

                    <div className="mb-4">
                        {questions[selected]?.slider ?
                        <>
                          <h1 className="text-xl font-bold mt-10">How to use the slider:</h1>
                          <p>If the slider input falls within a certain "class", the question answer will correspond to that class. Choose the upper bound for each class.</p>
                          <MultiRangeSlider
                              outerClassName="w-full my-20"
                              question={questions[selected]}
                              onChange={handleSliderChange}
                          />
                        </>
                        : 
                        <div className="text-sm text-slate-500">No range controls — this is not a slider question.</div>
                        }
                    </div>

                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => addOption(selected)}>+ Option</button>
                        <button className="px-3 py-1 bg-rose-500 text-white rounded" onClick={() => {
                        if (!confirm("Zero all weights for this question?")) return;
                        setQuestions((s) => s.map((q, i) => i !== selected ? q : { ...q, options: q.options.map((o) => ({ ...o, weights: Array(indexing.length).fill(0) })) }));
                        }}>Zero weights</button>
                    </div>
                    </div>

                    <div className="mt-6 text-sm text-slate-500">{savedAt ? `Last updated on ${savedAt}` : "Not yet saved to the database"}</div>
                </section>}
                </main>

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