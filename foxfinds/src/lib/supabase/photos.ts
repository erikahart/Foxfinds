import type { SupabaseClient } from "@supabase/supabase-js";

/** Batch-create signed URLs for private item photos. Returns path → url. */
export async function signedPhotoUrls(
  supabase: SupabaseClient,
  paths: (string | null)[],
): Promise<Record<string, string>> {
  const clean = paths.filter((p): p is string => Boolean(p));
  if (clean.length === 0) return {};
  const { data } = await supabase.storage.from("item-photos").createSignedUrls(clean, 3600);
  const map: Record<string, string> = {};
  data?.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
  return map;
}
