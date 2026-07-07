"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Item, ItemStatus } from "@/types";
import { money } from "@/lib/format";
import { ArrowLeft, Check, Trash2, Loader2 } from "lucide-react";
import ItemPhotos from "@/components/ItemPhotos";
import CoverPhoto from "@/components/CoverPhoto";
import { CATEGORIES } from "@/lib/categories";
import ShareAndPost from "@/components/ShareAndPost";

const inp =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";

const STATUSES: { key: ItemStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "listed", label: "Listed" },
  { key: "sold", label: "Sold" },
];

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<Item | null>(null);
  const [soldPrice, setSoldPrice] = useState("");
  const [extraCats, setExtraCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("items").select("*").eq("id", id).single();
      if (!active) return;
      if (error || !data) { setError("Couldn't load this item."); setLoading(false); return; }
      const it = data as Item;
      setItem(it);
      setSoldPrice(it.sold_price != null ? String(it.sold_price) : "");
      setExtraCats((it.categories ?? []).filter((c) => c && c !== it.category));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id, supabase]);

  function set<K extends keyof Item>(key: K, value: Item[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!item) return;
    setSaving(true); setError(null);
    const isSold = item.status === "sold";
    const cats = Array.from(
      new Set([item.category, ...extraCats].filter((c): c is string => !!c && c.trim() !== "")),
    );
    const { error } = await supabase.from("items").update({
      title: item.title,
      category: item.category,
      categories: cats,
      brand: item.brand,
      condition: item.condition,
      description: item.description,
      price_low: item.price_low,
      price_high: item.price_high,
      suggested_price: item.suggested_price,
      cost: item.cost,
      source_unit: item.source_unit,
      status: item.status,
      sold_price: isSold ? (soldPrice ? Number(soldPrice) : item.suggested_price) : null,
    }).eq("id", item.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/inventory");
    router.refresh();
  }

  async function remove() {
    if (!item) return;
    if (!confirm("Delete this find? This can't be undone.")) return;
    setSaving(true); setError(null);
    if (item.image_path) await supabase.storage.from("item-photos").remove([item.image_path]);
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/inventory");
    router.refresh();
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-ink-muted"><Loader2 className="animate-spin" size={18} /> Loading&hellip;</div>;
  }
  if (!item) {
    return (
      <div>
        <p className="mb-4 text-ember">{error ?? "Item not found."}</p>
        <Link href="/inventory" className="text-sm underline">Back to inventory</Link>
      </div>
    );
  }

  const profit = (soldPrice ? Number(soldPrice) : item.suggested_price ?? 0) - (item.cost ?? 0);

  return (
    <>
      <Link href="/inventory" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Inventory
      </Link>

      {error && <p className="mb-4 rounded-lg bg-ember-tint px-4 py-2.5 text-sm text-ember">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
        <div>
          <CoverPhoto itemId={item.id} initialPath={item.image_path} />
          <ItemPhotos itemId={item.id} />
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Status</div>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => set("status", s.key)}
                  className={`rounded-lg border px-3.5 py-1.5 text-sm ${
                    item.status === s.key ? "border-ink bg-ink text-paper" : "border-line hover:bg-paper-sunk"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {item.status === "sold" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Sold price</span>
                  <input className={inp} type="number" placeholder={String(item.suggested_price ?? "")} value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} />
                </label>
                <div>
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Profit</span>
                  <div className={`font-display text-2xl font-semibold ${profit >= 0 ? "text-moss" : "text-ember"}`}>{money(profit)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
            <Field label="Title"><input className={inp} value={item.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><CategoryField value={item.category ?? ""} onChange={(v) => set("category", v)} /></Field>
              <Field label="Brand"><input className={inp} value={item.brand ?? ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            </div>
            <CategoryTags primary={item.category ?? ""} extras={extraCats} onChange={setExtraCats} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Condition"><input className={inp} value={item.condition ?? ""} onChange={(e) => set("condition", e.target.value)} /></Field>
              <Field label="Cost"><input className={inp} type="number" value={item.cost ?? 0} onChange={(e) => set("cost", Number(e.target.value))} /></Field>
              <Field label="Source unit"><input className={inp} value={item.source_unit ?? ""} onChange={(e) => set("source_unit", e.target.value)} /></Field>
            </div>
            <Field label="Description">
              <textarea className={`${inp} min-h-[92px] resize-y`} value={item.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Price low"><input className={inp} type="number" value={item.price_low ?? 0} onChange={(e) => set("price_low", Number(e.target.value))} /></Field>
              <Field label="Suggested"><input className={inp} type="number" value={item.suggested_price ?? 0} onChange={(e) => set("suggested_price", Number(e.target.value))} /></Field>
              <Field label="Price high"><input className={inp} type="number" value={item.price_high ?? 0} onChange={(e) => set("price_high", Number(e.target.value))} /></Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Save changes
            </button>
            <button onClick={remove} disabled={saving} className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ember hover:bg-ember-tint disabled:opacity-60">
              <Trash2 size={16} /> Delete
            </button>
          </div>

          <ShareAndPost itemId={item.id} title={item.title} price={item.suggested_price} description={item.description} />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function CategoryField({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const isStandard = value === "" || CATEGORIES.includes(value);
  return (
    <select className={inp} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Uncategorized</option>
      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      {!isStandard && <option value={value}>{value} (current — pick a standard category)</option>}
    </select>
  );
}

function CategoryTags({
  primary, extras, onChange,
}: { primary: string; extras: string[]; onChange: (v: string[]) => void }) {
  const options = CATEGORIES.filter((c) => c !== primary);
  function toggle(c: string) {
    onChange(extras.includes(c) ? extras.filter((x) => x !== c) : [...extras, c]);
  }
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">Also tagged</div>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => {
          const on = extras.includes(c);
          return (
            <button
              type="button"
              key={c}
              onClick={() => toggle(c)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                on ? "border-fox bg-fox-tint text-ink" : "border-line bg-paper text-ink-soft hover:border-line-strong"
              }`}
            >
              {on ? "✓ " : ""}{c}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">Primary category is set above; tap any others this item also fits.</p>
    </div>
  );
}
