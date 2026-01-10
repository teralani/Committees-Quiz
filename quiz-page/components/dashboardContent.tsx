"use client"
import { useEffect, useState } from "react";
import pageContentImport from "@/public/pageText.json";
import committees from "@/public/committees.json"
import MultiRangeSlider from "@/components/multiRangeBar";

const persistQuestions = async (questions: any) => {
  try {
    const res = await fetch("/api/savePageText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    return res.ok;
  } catch (err) {
    console.error("persistQuestions error:", err);
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

const initialData = (pageContentImport as any)[1]?.questions as Question[] || [];

const INDEXING = (committees as Array<{name:string, acronym:string, description:string, difficulty:string, topics:Array<string>}>).map((committee => committee.acronym))


export default function DashboardContent() {
    const [selected, setSelected] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>(
        () => initialData || JSON.parse(localStorage.getItem("editorQuestions") || "null") 
    );

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
        // If JSON didn’t include ranges, keep numeric weights but create default ranges
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
            // If options already have ranges, don't overwrite; otherwise distribute upper bounds
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
        alert("Saved to public/pageText.json");
        } else {
        alert("Save failed. Check server logs.");
        }
    };

    

    if (!questions) return <div className="p-8">Loading...</div>;
    return (
        <>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Quiz Editor</h2>
                    <p className="text-sm text-slate-500">Edit the quiz questions that live in public/pageText.json → "Quiz".</p>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                    className="px-4 py-2 bg-rose-500 text-white rounded"
                    onClick={() => {
                        if (!confirm("Reset to default pageText.json from disk? This will replace editor contents.")) return;
                        setQuestions((pageContentImport as any)[1]?.questions || []);
                    }}
                    >
                    Reset from file
                    </button>

                    <label className="px-4 py-2 bg-yellow-400 text-black rounded cursor-pointer">
                    Import
                    <input className="hidden" type="file" accept="application/json" onChange={(e) => importJson(e.target.files?.[0] || null)} />
                    </label>

                    <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={exportJson}>Export</button>

                    <button className="px-4 py-2 bg-kingmun-primary/90 text-white rounded" onClick={saveToFile} disabled={saving}>
                    {saving ? "Saving…" : "Save to pageText.json"}
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
                    {questions[selected].options.map((opt, oi) => (
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
                            // Update your JSON data here
                        
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

                    <div className="mt-6 text-sm text-slate-500">{savedAt ? `Last saved: ${savedAt}` : "Not yet saved to public/pageText.json"}</div>
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