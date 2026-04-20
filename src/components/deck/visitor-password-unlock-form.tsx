"use client";

import { useState } from "react";
import { uiStrings } from "@/content/strings.de-ch";
import { cn } from "@/lib/utils";

export function VisitorPasswordUnlockForm({
  onSuccess,
  showHint = false,
  className,
}: {
  onSuccess?: () => void;
  showHint?: boolean;
  className?: string;
}) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/visitor-unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 503) {
        setError(uiStrings.visitorPasswordConfigError);
        return;
      }
      if (res.status === 401) {
        setError(uiStrings.visitorPasswordError);
        return;
      }
      if (!res.ok) {
        setError(uiStrings.visitorPasswordError);
        return;
      }
      setPassword("");
      onSuccess?.();
    } catch {
      setError(uiStrings.visitorPasswordNetworkError);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {showHint ? (
        <p className="font-sans text-[13px] font-semibold leading-snug text-foreground/85">
          {uiStrings.visitorPasswordModeHint}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 font-sans text-xs font-extrabold uppercase tracking-wide">
        <span>{uiStrings.visitorPasswordLabel}</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder={uiStrings.visitorPasswordPlaceholder}
          aria-label={uiStrings.visitorPasswordPlaceholder}
          className="cursor-text border-[3px] border-foreground bg-background px-3 py-2.5 font-medium normal-case placeholder:text-foreground/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
      </label>
      {error ? (
        <p className="font-sans text-sm font-bold text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || password.length === 0}
        onClick={() => void submit()}
        className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm disabled:opacity-45"
      >
        {pending ? uiStrings.visitorPasswordSubmitting : uiStrings.visitorPasswordSubmit}
      </button>
    </div>
  );
}
