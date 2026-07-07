import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerLogoUrl } from "@/lib/brand";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("business_name, is_seller").eq("id", user.id).single();

  if (profile && profile.is_seller === false) redirect("/shop");

  // Shared team logo — same source the public shop uses, so every seller sees the same mark.
  const logoUrl = await getSellerLogoUrl();

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar shop={profile?.business_name ?? "Fox Finds Reseller"} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 overflow-x-hidden md:overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-20 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
