import { NextResponse } from "next/server";
import { getAnthropic, VISION_MODEL, extractJSON } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import type { Analysis } from "@/types";

export const maxDuration = 60;

const MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Media = (typeof MEDIA)[number];

const SYSTEM = `You are a reselling expert who identifies secondhand and vintage items for resale.
Given a photo, identify the item and return ONLY a JSON object (no prose, no markdown) with:
{
  "title": "concise, keyword-rich product title",
  "category": "e.g. Handbags, Vinyl Records, Kitchenware",
  "brand": "brand or maker, or null if unknown",
  "condition": "one of: New, Like New, Good, Fair, For Parts",
  "description": "2-4 sentence resale description noting materials, era, and visible condition",
  "keywords": ["6-10 search keywords"],
  "price_low": number, "price_high": number, "suggested_price": number
}
Base prices on realistic US secondhand resale value in whole dollars. If you cannot identify the item, still return best-guess values.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { image?: string; media_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, media_type } = body;
  if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
  const mt: Media = MEDIA.includes(media_type as Media) ? (media_type as Media) : "image/jpeg";

  try {
    const msg = await getAnthropic().messages.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mt, data: image } },
            { type: "text", text: "Identify this item for resale. Return only the JSON object." },
          ],
        },
      ],
    });

    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const analysis = extractJSON<Analysis>(text);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("analyze error", err);
    return NextResponse.json({ error: "Could not analyze the image. Try again." }, { status: 502 });
  }
}
