import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/format";
import ReserveBox from "@/components/ReserveBox";
import ChatBox from "@/components/ChatBox";
import { ArrowLeft } from "lucide-react";
import { getSellerLogoUrl } from "@/lib/brand";
import ShopGallery from "@/components/ShopGallery";
import FulfillmentNotice from "@/components/FulfillmentNotice";
import DeliveryChecker from "@/components/DeliveryChecker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("items")
    .select("id,title,category,brand,condition,description,suggested_price,image_path,status")
    .eq("id", id)
    .eq("status", "listed")
    .single();

  if (!item) notFound();

  let photo: string | null = null;
  if (item.image_path) {
    const { data: signed } = await admin.storage.from("item-photos").createSignedUrl(item.image_path, 3600);
    photo = signed?.signedUrl ?? null;
  }

  // Additional photos for the gallery
  let extraUrls: string[] = [];
  const { data: extras } = await admin
    .from("item_photos").select("storage_path").eq("item_id", id).order("position", { ascending: true });
  const extraPaths = (extras ?? []).map((e) => (e as { storage_path: string }).storage_path).filter((p) => p !== item.image_path);
  if (extraPaths.length) {
    const { data: signedExtras } = await admin.storage.from("item-photos").createSignedUrls(extraPaths, 3600);
    extraUrls = (signedExtras ?? []).map((s) => s.signedUrl).filter((u): u is string => !!u);
  }
  const galleryUrls = [photo, ...extraUrls].filter((u): u is string => !!u);

  const { data: active } = await admin
    .from("reservations")
    .select("id")
    .eq("item_id", id)
    .in("status", ["pending", "confirmed"]);
  const reserved = (active ?? []).length > 0;
  const logoUrl = await getSellerLogoUrl();

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-5 font-display text-xl font-semibold">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
          )}
          Fox Finds
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/shop" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Back to the shop
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <ShopGallery urls={galleryUrls} title={item.title} />

          <div>
            {item.category && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">{item.category}</p>}
            <h1 className="mt-1 font-display text-3xl font-semibold">{item.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-display text-3xl font-semibold">{money(item.suggested_price)}</span>
              {item.condition && <span className="rounded-full bg-paper-sunk px-2.5 py-0.5 text-xs text-ink-muted">{item.condition}</span>}
            </div>
            {item.description && <p className="mt-4 whitespace-pre-line text-ink-soft">{item.description}</p>}

            <FulfillmentNotice className="mt-6" />

            <div className="mt-3">
              <DeliveryChecker />
            </div>

            <div className="mt-4">
              <ReserveBox itemId={item.id} itemTitle={item.title} alreadyReserved={reserved} />
            </div>

            <div className="mt-4">
              <ChatBox itemId={item.id} itemTitle={item.title} photoUrl={photo} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
