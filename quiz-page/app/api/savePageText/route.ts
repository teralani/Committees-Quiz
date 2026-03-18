import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const questions = body?.questions;
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid payload, expected { questions: [...] }" }, { status: 400 });
    }

    // Try common locations — adapt to how you run the dev server.
    const candidates = [
      path.join(process.cwd(), "quiz-page", "public", "pageText.json"),
      path.join(process.cwd(), "public", "pageText.json"),
    ];

    let filePath: string | null = null;
    let json: any = null;

    for (const p of candidates) {
      try {
        const raw = await fs.readFile(p, "utf8");
        json = JSON.parse(raw);
        filePath = p;
        break;
      } catch {}
    }

    if (!filePath || !json) {
      return NextResponse.json({ error: "pageText.json not found in expected locations" }, { status: 500 });
    }

    // Update quiz questions efficiently
    if (Array.isArray(json)) {
      const quizIndex = json.findIndex((p: any) => p?.name === "Quiz");
      if (quizIndex >= 0) {
        json[quizIndex].questions = questions;
      } else if (!json[1]) {
        json[1] = { questions };
      } else {
        json[1].questions = questions;
      }
    }

    await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("savePageText error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}