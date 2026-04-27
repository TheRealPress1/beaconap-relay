"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passphrase, setPassphrase] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passphrase) return;

    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      if (!res.ok) {
        toast.error("Incorrect passphrase");
        setPassphrase("");
        return;
      }

      const target = params.get("from") || "/";
      router.replace(target);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
            BeaconAP
          </p>
          <h1 className="font-display text-3xl tracking-tight text-text-primary">
            Relationship Intelligence
          </h1>
          <p className="text-sm text-text-secondary">
            Enter your passphrase to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passphrase" className="text-text-secondary">
              Passphrase
            </Label>
            <Input
              id="passphrase"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={pending}
              className="bg-bg-card text-text-primary"
            />
          </div>
          <Button
            type="submit"
            disabled={pending || !passphrase}
            className="w-full bg-accent-blue text-white hover:bg-accent-blue/90"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
