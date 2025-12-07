"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/content-agent", label: "Content Agent", icon: MessageCircle },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  const activeLabel = useMemo(() => {
    const current = navItems.find((item) => pathname.startsWith(item.href));
    return current?.label || "Workspace";
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 via-amber-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-amber-100 dark:ring-white/10 animate-pulse mx-auto">
            <Image
              src="/NEVADA_Logo.png"
              alt="NEVADA logo"
              width={56}
              height={56}
              className="h-full w-full object-contain p-1.5"
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground">Loading NEVADA...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const NavList = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
              active
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/5"
            }`}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-emerald-50 dark:from-[#0b1016] dark:via-[#0d1622] dark:to-[#0b1a24]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 flex-col gap-6 border-r border-white/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white shadow ring-2 ring-amber-100 dark:ring-white/10">
              <Image
                src="/NEVADA_Logo.png"
                alt="NEVADA logo"
                width={40}
                height={40}
                className="h-full w-full object-contain p-1"
                priority
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                NEVADA
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                UMKM control
              </p>
            </div>
          </div>
          <NavList />
          <div className="mt-auto space-y-3">
            <div className="rounded-xl border border-white/60 dark:border-white/10 p-3 bg-gradient-to-br from-white/90 to-amber-50/70 dark:from-white/5 dark:to-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Logged in
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || user?.email || "UMKM Owner"}
              </p>
              {user?.umkm_id && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  UMKM ID: {user.umkm_id}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-white/70 dark:border-white/10 bg-white/80 dark:bg-[#0c121a]/80 backdrop-blur-xl px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-white/95 dark:bg-slate-950">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left">
                      NEVADA Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <NavList />
                </SheetContent>
              </Sheet>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  {activeLabel}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  Nusantara Enterprise Virtual Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-600 text-white">UMKM</Badge>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
