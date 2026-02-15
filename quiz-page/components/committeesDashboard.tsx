"use client"
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Committee = {
  id: string;
  conference_id: string;
  name: string;
  acronym: string;
  description: string;
  difficulty: string;
  topics: string[];
  img_url: string;
  position: number;
  created_at?: string;
  updated_at?: string;
};

const ALLOWED_SLUGS = ['edumun', 'pacmun', 'seattlemun', 'kingmun'];

export default function CommitteesDashboard() {

  const stored = typeof window !== "undefined" ? (localStorage.getItem("slug_dashboard") ?? "kingmun") : "kingmun";
  
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<number>(0);
  const [conferenceSlug, setConferenceSlug] = useState<string>(stored);
  const [availableConferences, setAvailableConferences] = useState<{name: string, slug: string, id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);


  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    async function fetchCommittees() {
      setLoading(true);
      try {
        // Fetch conferences list and committees simultaneously
        const [conferencesResult, committeesResult] = await Promise.all([
          supabase
            .from("conferences")
            .select("id, name, slug")
            .order("name", { ascending: true }),
          supabase
            .from("conferences")
            .select(`
              id,
              committees (
                id,
                conference_id,
                name,
                acronym,
                description,
                difficulty,
                topics,
                img_url,
                position,
                created_at,
                updated_at
              )
            `)
            .eq("slug", conferenceSlug)
            .maybeSingle()
        ]);

        // Update available conferences
        if (!conferencesResult.error && conferencesResult.data) {
          const mapped = conferencesResult.data.map((c: any) => ({ 
            name: c.name, 
            slug: c.slug,
            id: c.id 
          }));
          const allowed = mapped
            .filter((c) => ALLOWED_SLUGS.includes(c.slug))
            .sort((a, b) => ALLOWED_SLUGS.indexOf(a.slug) - ALLOWED_SLUGS.indexOf(b.slug));
          const others = mapped
            .filter((c) => !ALLOWED_SLUGS.includes(c.slug))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
          setAvailableConferences([...allowed, ...others]);
        }

        // Process committees data
        const { data: confData, error: confErr } = committeesResult;
        if (confErr || !confData) {
          console.error("Conference not found", confErr);
          setCommittees([]);
          return;
        }

        const committeesData = (confData.committees || []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
        setCommittees(committeesData);
      } catch (err) {
        console.error("Unexpected fetchCommittees error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommittees();
  }, [conferenceSlug]);

  const updateCommittee = (idx: number, patch: Partial<Committee>) => {
    setCommittees((s) => s.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const updateTopic = (committeeIdx: number, topicIdx: number, value: string) => {
    setCommittees((s) =>
      s.map((c, i) =>
        i !== committeeIdx
          ? c
          : {
              ...c,
              topics: c.topics.map((t, j) => (j === topicIdx ? value : t)),
            }
      )
    );
  };

  const addCommittee = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    const conference = availableConferences.find(c => c.slug === conferenceSlug);
    if (!conference) return;

    // Find the next available position (max + 1)
    const nextPosition = committees.length > 0 ? Math.max(...committees.map(c => c.position ?? 0)) + 1 : 0;

    const newCommittee: Partial<Committee> = {
      conference_id: conference.id,
      name: "New Committee",
      acronym: "NEW",
      description: "Description",
      difficulty: "Introductory",
      topics: ["Topic 1"],
      img_url: "",
      position: nextPosition,
    };

    const { data, error } = await supabase
      .from("committees")
      .insert([newCommittee])
      .select()
      .single();

    if (error) {
      console.error("Error adding committee:", error);
      alert("Failed to add committee");
      return;
    }

    if (data) {
      // Insert and sort by position
      setCommittees((s) => [...s, data].slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    }
  };

  const removeCommittee = async (idx: number) => {
    if (!confirm("Remove this committee?")) return;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    const committee = committees[idx];

    const { error } = await supabase
      .from("committees")
      .delete()
      .eq("id", committee.id);

    if (error) {
      console.error("Error deleting committee:", error);
      alert("Failed to delete committee");
      return;
    }

    // Remove from local state and reindex positions
    let updated = committees.slice();
    updated.splice(idx, 1);
    // Reassign positions to be continuous (0, 1, 2, ...)
    updated = updated.map((c, i) => ({ ...c, position: i }));
    setCommittees(updated);

    // Update all positions in DB
    for (const c of updated) {
      await supabase
        .from("committees")
        .update({ position: c.position })
        .eq("id", c.id);
    }

    setSelectedCommittee((prev) => Math.max(0, Math.min(updated.length - 1, prev)));
  };

  const addTopic = (committeeIdx: number) => {
    setCommittees((s) =>
      s.map((c, i) =>
        i !== committeeIdx ? c : { ...c, topics: [...c.topics, "New Topic"] }
      )
    );
  };

  const removeTopic = (committeeIdx: number, topicIdx: number) => {
    setCommittees((s) =>
      s.map((c, i) =>
        i !== committeeIdx
          ? c
          : { ...c, topics: c.topics.filter((_, j) => j !== topicIdx) }
      )
    );
  };

  const saveCommittees = async () => {
    setSaving(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setSaving(false);
      return;
    }
    
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    try {
      // Update all committees
      const updates = committees.map((committee) => ({
        id: committee.id,
        name: committee.name,
        acronym: committee.acronym,
        description: committee.description,
        difficulty: committee.difficulty,
        topics: committee.topics,
        img_url: committee.img_url,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("committees")
          .update(update)
          .eq("id", update.id);

        if (error) {
          console.error("Error updating committee:", error);
          alert("Failed to update committees");
          setSaving(false);
          return;
        }
      }

      setSavedAt(new Date().toLocaleString());
      localStorage.setItem("slug_committees", conferenceSlug);
      alert("Committees saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save committees");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveCommittees();
      }
    };
    document.addEventListener("keydown", handler, false);
    return () => {
      document.removeEventListener("keydown", handler, false);
    };
  }, [saveCommittees]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-kingmun-primary mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading {conferenceSlug.toUpperCase()} committees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between w-full max-md:justify-center">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="min-w-20">
            <h2 className="text-2xl font-bold">Committees Editor</h2>
            <p className="text-sm text-slate-500">Edit committees in the database.</p>
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
                localStorage.setItem("slug_dashboard", e.target.value)
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
            className="px-4 py-2 bg-kingmun-primary/90 text-white rounded cursor-pointer"
            onClick={saveCommittees}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {savedAt && (
            <span className="text-sm text-gray-600">
              Last saved at {savedAt}
            </span>
          )}
        </div>
      </div>

      <main className="flex gap-6 flex-wrap">
        <aside className="w-72 bg-white border rounded p-3 overflow-auto max-h-[70vh]">
          <h3 className="font-semibold mb-2">Committees ({committees.length})</h3>
          <ul>
            {committees.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((committee, i) => (
              <li
                key={committee.id}
                onClick={() => setSelectedCommittee(i)}
                className={`p-2 rounded cursor-pointer mb-1 w-63 ${
                  selectedCommittee === i ? "bg-sky-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{committee.acronym}</div>
                    <div className="text-xs text-slate-500 text-wrap">{committee.name}</div>
                    <div className="text-xs text-slate-400">{committee.difficulty}</div>
                  </div>
                  <button
                    title="Remove committee"
                    className="text-red-600 text-xs ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCommittee(i);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <button className="w-full px-3 py-2 bg-green-600 text-white rounded" onClick={addCommittee}>
              + Committee
            </button>
          </div>
        </aside>

        <section className="flex-1 min-w-96 bg-white border rounded p-4 overflow-auto max-h-[80vh]">
          {committees[selectedCommittee] && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-4">
                  Editing: {committees[selectedCommittee]?.acronym}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Acronym</label>
                    <input
                      value={committees[selectedCommittee]?.acronym || ""}
                      onChange={(e) =>
                        updateCommittee(selectedCommittee, { acronym: e.target.value })
                      }
                      className="w-full border rounded p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      value={committees[selectedCommittee]?.name || ""}
                      onChange={(e) =>
                        updateCommittee(selectedCommittee, { name: e.target.value })
                      }
                      className="w-full border rounded p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={committees[selectedCommittee]?.description || ""}
                      onChange={(e) =>
                        updateCommittee(selectedCommittee, { description: e.target.value })
                      }
                      className="w-full border rounded p-2 min-h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <select
                      value={committees[selectedCommittee]?.difficulty || "Introductory"}
                      onChange={(e) =>
                        updateCommittee(selectedCommittee, { difficulty: e.target.value })
                      }
                      className="w-full border rounded p-2"
                    >
                      <option value="Introductory">Introductory</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      value={committees[selectedCommittee]?.img_url || ""}
                      onChange={(e) =>
                        updateCommittee(selectedCommittee, { img_url: e.target.value })
                      }
                      className="w-full border rounded p-2"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <img src={committees[selectedCommittee]?.img_url || ""} alt="Preview" style={{maxWidth: '100%', display: committees[selectedCommittee]?.img_url ? 'block' : 'none'}} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Topics</label>
                    {committees[selectedCommittee]?.topics.map((topic, ti) => (
                      <div key={ti} className="flex gap-2 mb-2">
                        <input
                          value={topic}
                          onChange={(e) => updateTopic(selectedCommittee, ti, e.target.value)}
                          className="flex-1 border rounded p-2"
                        />
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                          onClick={() => removeTopic(selectedCommittee, ti)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      onClick={() => addTopic(selectedCommittee)}
                    >
                      + Topic
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-slate-500">
                {savedAt ? `Last saved: ${savedAt}` : "Not yet saved"}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
