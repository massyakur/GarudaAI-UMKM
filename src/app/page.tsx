"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, ScanLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-[#0c1117] dark:via-[#0b1622] dark:to-[#0c1c26]">
      <header className="flex items-center justify-between px-6 sm:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-white shadow-lg">
            <Image
              src="/NEVADA_Logo.png"
              alt="NEVADA logo"
              width={40}
              height={40}
              priority
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
              NEVADA
            </p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Nusantara Enterprise Virtual Assistant & Data Analytics
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">
              Launch Console <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="px-6 sm:px-12 pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-center">
          <div className="space-y-6">
            <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Made for UMKM momentum
            </Badge>
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-semibold leading-tight text-slate-900 dark:text-white">
                Bring every receipt, sale, and insight into one calm workspace.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                NEVADA automates bookkeeping, visualises cashflow, and keeps
                product, customer, and transaction data tidy so UMKM founders
                can focus on growth—not spreadsheets.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Sign in to workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">See capabilities</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 pt-4" id="features">
              <Card className="p-4 shadow-sm border-dashed border-amber-200 dark:border-amber-700/50">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-amber-600" />
                  <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Receipt OCR
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">
                  Upload struk, auto-extract details, confirm, and post to
                  transactions.
                </p>
              </Card>
              <Card className="p-4 shadow-sm border-dashed border-emerald-200 dark:border-emerald-700/50">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Analytics
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">
                  Revenue, product velocity, payment mix, and growth pulses in
                  one dashboard.
                </p>
              </Card>
              <Card className="p-4 shadow-sm border-dashed border-sky-200 dark:border-sky-700/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    Content Agent
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">
                  Brief AI for promos, captions, and customer updates using your
                  live numbers.
                </p>
              </Card>
            </div>
          </div>

          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50 to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-none shadow-xl">
            <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-400/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-48 w-48 bg-amber-400/25 blur-3xl" />
            <div className="relative p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                    Live Snapshot
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    NEVADA Control Room
                  </h3>
                </div>
                <Badge variant="secondary" className="bg-white/80 backdrop-blur">
                  BETA
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Revenue (30d)", value: "Rp 125.4J", accent: "from-emerald-500 to-teal-400" },
                  { label: "Pending payouts", value: "Rp 8.2J", accent: "from-amber-500 to-orange-400" },
                  { label: "Avg ticket", value: "Rp 210K", accent: "from-sky-500 to-cyan-400" },
                  { label: "Repeat buyers", value: "34%", accent: "from-indigo-500 to-purple-400" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-white/5 backdrop-blur p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className={`text-2xl font-semibold bg-gradient-to-r ${item.accent} bg-clip-text text-transparent`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/60 dark:border-slate-800 bg-slate-900 text-white p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Credit Pulse
                  </p>
                  <h4 className="text-lg font-semibold">KUR readiness check</h4>
                  <p className="text-sm text-slate-200/80">
                    Snapshot your eligibility with one tap from the dashboard.
                  </p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/login">Preview</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
