"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, Package, Tags, CalendarCheck, MessageCircle, Settings, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add", label: "Add a find", icon: PlusCircle },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/listings", label: "Listings", icon: Tags },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <div className="flex items-center gap-2 font-display text-lg font-semibold">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
      )}
      Fox Finds
    </div>
  );
}

export default function Sidebar({ shop, logoUrl }: { shop: string; logoUrl?: string | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== "/dashboard" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );

  const Footer = () => (
    <div className="border-t border-line p-3">
      <a
        href="/shop"
        target="_blank"
        rel="noreferrer"
        className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-paper-sunk"
      >
        <ExternalLink size={17} /> View shop
      </a>
      <div className="mb-2 px-3 text-xs text-ink-muted">
        <div className="font-medium text-ink-soft">{shop}</div>
      </div>
      <form action={signOut}>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-paper-sunk">
          <LogOut size={17} /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-line bg-paper-raised md:flex">
        <div className="border-b border-line px-5 py-5"><Brand logoUrl={logoUrl} /></div>
        <NavLinks />
        <Footer />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line bg-paper-raised px-4 py-3 md:hidden">
        <Brand logoUrl={logoUrl} />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="-mr-2 rounded-lg p-2 text-ink-soft hover:bg-paper-sunk">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-paper-raised shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Brand logoUrl={logoUrl} />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-2 rounded-lg p-2 text-ink-soft hover:bg-paper-sunk">
                <X size={22} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
