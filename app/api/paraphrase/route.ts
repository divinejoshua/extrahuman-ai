import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env["GEMINI_API_KEY"],
});

const humanizeSystemPrompt = `You are a humanizer. You are given a text and you need to humanize it.
You are not allowed to change the meaning of the text.
You are not allowed to add any new information to the text.
You are not allowed to remove any information from the text.
You are not allowed to change the structure of the text.
You are not allowed to change the formatting of the text.
You are not allowed to change the tone of the text.
You are not allowed to change the style of the text.
You are not allowed to change the vocabulary of the text.
You job is to make the text more human and natural by changing the words and phrases to make it more natural and human-like.
Therefore, the result should not have too much difference from the original text except that it should be more natural and human-like.
THE RESULT SHOULD BE EXACTLY 5 DISTINCT OPTIONS AS A FLAT JSON ARRAY OF STRINGS (NO OBJECTS, NO NUMBERING, NO EXPLANATIONS).
EACH OPTION SHOULD BE A DISTINCT VARIATION OF THE ORIGINAL TEXT.
EACH OPTION SHOULD BE NO MORE THAN 10 WORDS MORE OR LESS THAN THE NUMBER OF WORDS IN THE ORIGINAL TEXT.
FOLLOW THIS WRITING STYLE:
• SHOULD use clear, simple language.
• SHOULD be spartan and informative.
• SHOULD use short, impactful sentences.
• SHOULD use active voice; avoid passive voice.
• SHOULD focus on practical, actionable insights.
• SHOULD use bullet point lists in social media posts.
• SHOULD use data and examples to support claims when possible.
• SHOULD use "you" and "your" to directly address the reader.
• AVOID using em dashes (—) anywhere in your response. Use only commas, periods, or other standard punctuation.
If you need to connect ideas, use a period or a semicolon, but never an em dash.
• AVOID constructions like "...not just this, but also this".
• AVOID metaphors and clichés.
• AVOID generalizations.
• AVOID common setup language in any sentence, including: in conclusion, in closing, etc.
• AVOID output warnings or notes, just the output requested.
• AVOID unnecessary adjectives and adverbs.
• AVOID hashtags.
• AVOID semicolons.
• AVOID markdown.
• AVOID asterisks.
• AVOID these words: "can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark,
enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where,
revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm,
however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, remains to be seen, glimpse into, navigating, landscape, stark, testament,
in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"
# IMPORTANT: Review your response and ensure no em dashes!`;

const tonePrompts: Record<string, string> = {
  humanize:
    "Humanize the following text in its entirety. Each option must cover the COMPLETE text from start to finish, not just the beginning:",
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

    const contents = [
      {
        role: "user" as const,
        parts: [
          {
            text: `${tonePrompts[tone]}\n\nText to rewrite:\n\n${text}`,
          },
        ],
      },
    ];

    const config: Record<string, unknown> = {
      maxOutputTokens: 8192,
    };
    if (tone === "humanize") {
      config.systemInstruction = humanizeSystemPrompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config,
      contents,
    });

    const rawText = response.text ?? "";

    if (tone === "humanize") {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const options = JSON.parse(jsonMatch[0]) as string[];
        return NextResponse.json({ options });
      }
      return NextResponse.json({ result: rawText });
    }

    return NextResponse.json({ result: rawText });
  } catch (error: unknown) {
    console.error("Paraphrase error:", error);
    const msg =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
