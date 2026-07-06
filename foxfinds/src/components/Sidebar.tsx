"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Package, Tags, CalendarCheck, MessageCircle, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add", label: "Add a find", icon: PlusCircle },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/listings", label: "Listings", icon: Tags },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export default function Sidebar({ shop }: { shop: string }) {
  const path = usePathname();
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-line bg-paper-raised">
      <div className="flex items-center gap-2 border-b border-line px-5 py-5 font-display text-lg font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
        Fox Finds
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 px-3 text-xs text-ink-muted">
          <div className="font-medium text-ink-soft">{shop}</div>
        </div>
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-paper-sunk">
            <LogOut size={17} /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}