import { createAdminClient } from "@/lib/supabase/admin";

/** Returns a signed URL for the seller's uploaded logo, or null if none set. */
export async function getSellerLogoUrl(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("logo_path")
      .eq("is_seller", true)
      .not("logo_path", "is", null)
      .limit(1)
      .maybeSingle();
    if (!data?.logo_path) return null;
    const { data: s } = await admin.storage.from("item-photos").createSignedUrl(data.logo_path, 3600);
    return s?.signedUrl ?? null;
  } catch {
    return null;
  }
}