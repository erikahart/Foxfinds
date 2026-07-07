import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("business_name, is_seller, logo_path").eq("id", user.id).single();

  if (profile && profile.is_seller === false) redirect("/shop");

  let logoUrl: string | null = null;
  if (profile?.logo_path) {
    try {
      const admin = createAdminClient();
      const { data: s } = await admin.storage.from("item-photos").createSignedUrl(profile.logo_path, 3600);
      logoUrl = s?.signedUrl ?? null;
    } catch { /* ignore */ }
  }

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar shop={profile?.business_name ?? "My shop"} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 overflow-x-hidden md:overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-20 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
