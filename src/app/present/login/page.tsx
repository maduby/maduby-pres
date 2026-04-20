"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { uiStrings } from "@/content/strings.de-ch";

function PresentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextPath = searchParams.get("next") || "/present";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/present/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(uiStrings.presenterLoginError);
        setPending(false);
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/present");
      router.refresh();
    } catch {
      setError(uiStrings.presenterLoginNetworkError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md border-[3px] border-foreground bg-background p-6 brutal-shadow">
        <h1 className="font-heading text-xl font-bold md:text-2xl">
          {uiStrings.presenterLoginTitle}
        </h1>
        <p className="mt-2 font-sans text-sm font-semibold text-foreground/75">
          {uiStrings.presenterLoginHint}
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5 font-sans text-xs font-extrabold uppercase tracking-wide">
            {uiStrings.presenterLoginPasswordLabel}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="border-[3px] border-foreground bg-background px-3 py-2 font-medium normal-case"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p
              className="font-sans text-sm font-bold text-red-700 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-4 py-3 font-sans text-sm font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm disabled:opacity-50"
          >
            {pending ? uiStrings.presenterLoginSubmitting : uiStrings.presenterLoginSubmit}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-10">
      <p className="border-[3px] border-foreground bg-background px-6 py-4 font-heading text-lg font-bold text-foreground brutal-shadow">
        {uiStrings.presenterLoginSubmitting}
      </p>
    </div>
  );
}

export default function PresentLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PresentLoginForm />
    </Suspense>
  );
}
