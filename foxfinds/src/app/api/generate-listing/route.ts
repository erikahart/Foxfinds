import { NextResponse } from "next/server";
import { getAnthropic, VISION_MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { MARKETPLACES } from "@/lib/marketplaces";
import type { Item, Marketplace } from "@/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, marketplace } = (await req.json()) as {
    itemId: string; marketplace: Marketplace;
  };
  const spec = MARKETPLACES[marketplace];
  if (!spec) return NextResponse.json({ error: "Unknown marketplace" }, { status: 400 });

  // Fetch the item (RLS guarantees it belongs to this user).
  const { data: item, error } = await supabase
    .from("items").select("*").eq("id", itemId).single();
  if (error || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const it = item as Item;

  const prompt = `Write a ${spec.name} listing for this resale item.
Marketplace style: ${spec.note}
Title must be <= ${spec.titleMax} characters.
${spec.tagMax ? `Provide up to ${spec.tagMax} tags.` : "Do not provide tags."}

Item:
- Title: ${it.title}
- Brand: ${it.brand ?? "unknown"}
- Category: ${it.category ?? "unknown"}
- Condition: ${it.condition ?? "unknown"}
- Description: ${it.description ?? ""}
- Keywords: ${it.keywords.join(", ")}
- Suggested price: $${it.suggested_price ?? it.price_high ?? "?"}

Return ONLY JSON: {"title": string, "description": string, "price": number, "tags": string[]}`;

  try {
    const msg = await getAnthropic().messages.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    const draft = JSON.parse(text.slice(start, end + 1));

    const { data: saved, error: insErr } = await supabase
      .from("listings")
      .insert({
        item_id: it.id, user_id: user.id, marketplace,
        title: String(draft.title ?? it.title).slice(0, spec.titleMax),
        description: draft.description ?? it.description,
        price: draft.price ?? it.suggested_price,
        tags: Array.isArray(draft.tags) ? draft.tags.slice(0, spec.tagMax || 0) : [],
        status: "draft",
      })
      .select().single();
    if (insErr) throw insErr;

    return NextResponse.json({ listing: saved });
  } catch (err) {
    console.error("generate-listing error", err);
    return NextResponse.json({ error: "Could not generate the listing." }, { status: 502 });
  }
}
