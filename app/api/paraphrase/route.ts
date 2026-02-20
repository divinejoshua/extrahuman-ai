import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env["GEMINI_API_KEY"],
});

const humanizeSystemPrompt = `You are a humanizer. Your job is to rewrite text so it sounds natural and human-written.

# ABSOLUTE RULES (override everything else):
1. OUTPUT LENGTH: Your rewrite MUST match the word count of the original text within ±5 words. This is non-negotiable. Do NOT shorten, condense, or summarize — rewrite every sentence fully.
2. FULL COVERAGE: Every paragraph in the input MUST appear rewritten in the output. Do NOT skip, merge, or omit any paragraph.
3. FORMAT: Output plain text only. No JSON, no numbering, no labels, no explanations — just the rewritten text.

# WHAT TO CHANGE:
- Swap words and phrases for more natural, human-sounding alternatives.
- Rephrase stiff or robotic sentences to flow more naturally.
- Use active voice where possible.
- Use "you" and "your" to directly address the reader where it fits naturally.

# WHAT NOT TO CHANGE:
- Do not change the meaning of any sentence.
- Do not add new information.
- Do not remove any information or shorten any sentence.
- Do not change the paragraph structure or order.

# STYLE:
• Use clear, direct language.
• Use active voice; avoid passive voice.
• AVOID using em dashes (—). Use commas, periods, or colons instead.
• AVOID constructions like "not just this, but also this".
• AVOID metaphors and clichés.
• AVOID common filler phrases like: in conclusion, in closing, in summary, moreover, furthermore.
• AVOID hashtags, markdown, and asterisks.
• AVOID these words: "can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, harness, exciting, groundbreaking, cutting-edge, remarkable, remains to be seen, glimpse into, navigating, landscape, stark, testament, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"

# REMINDER: Count the words in your output before finishing. It MUST be within ±5 words of the original word count. If it is shorter, expand sentences — add natural detail, context, or rephrase concisely-written sentences into fuller ones. Never submit a shorter rewrite.`;

const tonePrompts: Record<string, string> = {
  humanize:
    "Humanize the following text.",
  formal:
    "Rewrite the following text in a formal, professional tone. Use proper grammar, avoid contractions, and maintain a polished style suitable for business or academic contexts.",
  informal:
    "Rewrite the following text in a casual, conversational tone. Use contractions, simple words, and make it feel like you're talking to a friend.",
  concise:
    "Rewrite the following text to be as concise as possible. Remove unnecessary words and filler while preserving the core meaning.",
  creative:
    "Rewrite the following text in a more creative and engaging way. Use vivid language, metaphors, or interesting phrasing while keeping the original meaning.",
  academic:
    "Rewrite the following text in an academic tone. Use scholarly language, precise terminology, and a structured approach suitable for research or essays.",
};

export async function POST(req: NextRequest) {
  try {
    const { text, tone } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide some text to paraphrase." },
        { status: 400 }
      );
    }

    if (!tone || !tonePrompts[tone]) {
      return NextResponse.json(
        { error: "Invalid tone selected." },
        { status: 400 }
      );
    }

    const wordCount = text.trim().split(/\s+/).length;
    const paragraphCount = text.split(/\n\s*\n/).filter((p: string) => p.trim()).length;

    let userPrompt = `${tonePrompts[tone]}\n\nText to rewrite:\n\n${text}`;
    if (tone === "humanize") {
      userPrompt += `\n\n---\nTARGET WORD COUNT: ${wordCount} words (±5 words). The original has ${paragraphCount} paragraph(s) — all must be present and fully rewritten. Do NOT shorten any sentence or paragraph. Your output must be ${wordCount} words.`;
    }

    const contents = [
      {
        role: "user" as const,
        parts: [{ text: userPrompt }],
      },
    ];

    const config: Record<string, unknown> = {
      maxOutputTokens: 1000000,
      systemInstruction:
        tone === "humanize"
          ? humanizeSystemPrompt
          : "Output plain text only. No markdown, no asterisks, no bullet points, no bold, no headers, no numbered lists, no escape sequences — just the rewritten text.",
    };

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      config,
      contents,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const chunkText = chunk.text ?? "";
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("Paraphrase error:", error);
    const msg =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
