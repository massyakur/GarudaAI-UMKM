"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to login. Please check your credentials.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-[#0c1017] dark:via-[#0b1622] dark:to-[#0b1a24] px-4">
      <div className="max-w-5xl w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-amber-100 dark:ring-white/10">
              <Image
                src="/NEVADA_Logo.png"
                alt="NEVADA logo"
                width={56}
                height={56}
                className="h-full w-full object-contain p-1"
                priority
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">
                NEVADA / UMKM
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Nusantara Enterprise Virtual Assistant & Data Analytics
              </p>
            </div>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white">
            Finance, inventory, and analytics in one confident interface.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
            Sign in to manage products, customers, transactions, and to see your
            revenue pulse. Every action calls the FastAPI backend—no Supabase or
            Clerk required.
          </p>
          <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Connected
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  FastAPI Gateway
                </p>
              </div>
              <Lock className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Authenticates with `/api/v1/login`, stores JWT locally, and
              attaches it to every request. Base URL comes from
              `NEXT_PUBLIC_API_URL`.
            </p>
          </div>
        </div>

        <Card className="p-6 shadow-xl bg-white/90 dark:bg-slate-950/90 border-white/70 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-white shadow ring-2 ring-amber-100 dark:ring-white/10">
              <Image
                src="/NEVADA_Logo.png"
                alt="NEVADA logo"
                width={48}
                height={48}
                className="h-full w-full object-contain p-1.5"
                priority
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">
                Welcome back
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Sign in to NEVADA
              </h2>
              <p className="text-sm text-muted-foreground">
                Use your registered email and password to access the dashboard.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Login failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.id"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            New to NEVADA? Access is provisioned by the ops team.{" "}
            <Link href="/" className="text-amber-700 dark:text-amber-300">
              Back to overview
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
