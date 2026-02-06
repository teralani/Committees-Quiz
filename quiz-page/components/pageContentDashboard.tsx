"use client"
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState, useCallback } from "react"

const ALLOWED_SLUGS = ['kingmun', 'edumun', 'pacmun', 'seattlemun'];

type contentData = {
    key: string,
    title: string,
    img: string | null,
    body: string,
}

export default function PageDashboard () {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("slug_page") ?? "kingmun") : "kingmun";
    const [conferenceSlug, setConferenceSlug] = useState<string>(stored);
    const [loading, setLoading] = useState(true);  
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [availableConferences, setAvailableConferences] = useState<{name: string, slug: string}[]>([]);
    const [content, setContent] = useState<contentData[]>([])
    const [published, setPublished] = useState<boolean>(false);
    const [toast, setToast] = useState<string | null>(null);
    const [toastVisible, setToastVisible] = useState<boolean>(false);

    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
        }
        const supabase = createBrowserClient(supabaseUrl, supabaseKey);

        async function fetchPageContent() {
            setLoading(true)
            try {
                const [conferencesResult, pageContentResult] = await Promise.all([
                    supabase
                        .from("conferences")
                        .select("id, name, slug, published")
                        .order("name", { ascending: true }),
                    supabase
                        .from('page_sections')
                        .select(`
                        id,
                        key,
                        title,
                        img,
                        body,
                        position,
                        page_id,
                        pages!inner (
                            name,
                            conferences!inner (
                            slug
                            )
                        )
                        `)
                        .eq('pages.name', 'Home')
                        .eq('pages.conferences.slug', conferenceSlug)
                        .order('position', { ascending: true })
                ]);

                // Update available conferences (filtered to allowed slugs only)
                if (!conferencesResult.error && conferencesResult.data) {
                    const filtered = conferencesResult.data
                    .filter((c: any) => ALLOWED_SLUGS.includes(c.slug))
                    .map((c: any) => ({ name: c.name, slug: c.slug }));
                    setAvailableConferences(filtered);
                    const match = conferencesResult.data.find((c: any) => c.slug === conferenceSlug);
                    setPublished(match?.published ?? false)
                }

                // Process quiz data
                const { data: confData, error: confErr } = pageContentResult;
                if (confErr || !confData) {
                    console.error("Conference not found", confErr);
                    setContent([]);
                    return;
                }

                const dbContent: contentData[] = (confData || []).map((r: any) => ({
                    key: r.key ?? "",
                    title: r.title ?? "",
                    img: r.img ?? "",
                    body: r.body ?? "",
                }));
                setContent(dbContent);

            } catch (err) {
                console.error("unexpected fetchPageContent error", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPageContent()

    }, [conferenceSlug])

    const updateCard = (idx: number, patch: Partial<contentData>) => {
        setContent((s) => s.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    }

    const saveProgress = useCallback(async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/savePageContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conferenceSlug,
                    content,
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                console.error('Save failed:', result.error);
                alert(`Save failed: ${result.error || 'Unknown error'}`);
                return;
            }

            const now = new Date().toLocaleTimeString();
            setSavedAt(now);
            console.log(`Saved ${result.updated} sections at ${now}`);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save changes. Check console for details.');
        } finally {
            setSaving(false);
        }
    }, [conferenceSlug, content])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                saveProgress();
            }
        };
        document.addEventListener("keydown", handler, false);
        return () => {
            document.removeEventListener("keydown", handler, false);
        };
    }, [saveProgress])

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
    <div className="min-h-screen max-w-6xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Page Content Editor</h2>
                    <p className="text-sm text-slate-500">Edit various text on the page.</p>
                </div>
                <div>
                    <label htmlFor="conference-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Conference
                    </label>
                    <select
                        id="conference-select"
                        value={conferenceSlug}
                        onChange={(e) => setConferenceSlug(e.target.value)}
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

            <div className="flex gap-2 items-center">
                <button
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
                onClick={(e) => console.log(content)}
                >
                Print
                </button>
                <button
                className="px-4 py-2 bg-violet-500 text-white rounded cursor-pointer"
                onClick={async () => {
                    try {
                        const resp = await fetch('/api/togglePublish', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ conferenceSlug }),
                        });
                        const j = await resp.json();
                        if (!resp.ok) {
                            console.error('Toggle publish failed', j);
                            alert(`Publish toggle failed: ${j.error || 'Unknown error'}`);
                            return;
                        }
                        setPublished(Boolean(j.published));
                        const msg = j.published ? 'Site published' : 'Site unpublished';
                        setToast(msg);
                        // Mount hidden then make visible on next tick to trigger slide-in
                        setToastVisible(false);
                        setTimeout(() => setToastVisible(true), 10);
                        // Hide after 2.6s then clear after animation finishes
                        setTimeout(() => setToastVisible(false), 2600);
                        setTimeout(() => setToast(null), 3000);
                    } catch (err) {
                        console.error('Toggle publish error', err);
                        alert('Failed to toggle publish. See console for details.');
                    }
                }}
                >
                {published? "Unpublish Website" : "Publish Website"}
                </button>
                <button
                className="px-4 py-2 bg-indigo-500 text-white rounded cursor-pointer"
                onClick={(e) => window.open(`https://committees-quiz.vercel.app/${conferenceSlug}`)}
                >
                Go to Site
                </button>
                {toast && (
                    <div className={`fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg toast ${toastVisible ? 'visible' : ''}`}>
                        {toast}
                    </div>
                )}
                <button className="px-4 py-2 bg-kingmun-primary/90 text-white rounded cursor-pointer" onClick={saveProgress} disabled={saving}>
                {saving ? "Saving…" : "Save progress"}
                </button>

                {savedAt && (
                    <span className="text-sm text-gray-600">
                        Last saved at {savedAt}
                    </span>
                )}
            </div>
        </div>
        <main>
            <section className="flex-1 bg-white border rounded p-4 overflow-auto max-h-[80vh] editor-card">
                {(content ?? []).map((card, cardi) => (
                    <div key={cardi} className="border rounded p-2 mb-3 bg-gray-100">
                        <div className="">
                            <label className="block text-sm font-medium mb-1">Card Title</label>
                            <input className="border rounded-sm p-2 text-lg font-bold" onChange={(e) => updateCard(cardi, {title: e.target.value})} value={card?.title || ""} />
                        </div>
                        <div className="w-full my-4">
                            <label className="block text-sm font-medium mb-1">Text Body (max. 350 characters)</label>
                            <textarea maxLength={350} className="w-full field-sizing-content min-h-10 max-h-40 resize-none border rounded-sm p-2" onChange={(e) => updateCard(cardi, {body: e.target.value})} value={card?.body || ""} />
                        </div>
                        <div className="w-full my-4">
                            <label className="block text-sm font-medium mb-1">Image File Name</label>
                            <textarea className="w-full field-sizing-content min-h-10 max-h-40 resize-none border rounded-sm p-2" onChange={(e) => updateCard(cardi, {img: e.target.value})} value={card?.img || ""} />
                        </div>

                    </div>
                ))}
            </section>
        </main>
    </div>
    <style jsx>{`
        input:focus-within,textarea:focus-within {
            background-color: #fff
        }
        .toast {
            transform: translateX(120%);
            opacity: 0;
            transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 320ms ease;
            z-index: 60;
        }
        .toast.visible {
            transform: translateX(0%);
            transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 320ms ease;
            opacity: 1;
        }
    `}</style>
    </>
    )
}