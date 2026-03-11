import { useEffect, useState } from "react";
import Link from "next/link";
import { useCookies } from "react-cookie";

import { Button } from "@/components/ui/button";
import { bodyFont, headingFont } from "@/lib/fonts";

export default function LandingLayout({ children }) {
  const [cookies] = useCookies(["auth_token"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && Boolean(cookies.auth_token);

  return (
    <div className={`${bodyFont.className} ${headingFont.variable} paper-shell min-h-screen text-foreground`}>
      <header className="paper-topbar sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="paper-logo-badge inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold">
              mf
            </span>
            <span className="font-[var(--font-heading)] text-xl tracking-tight text-[var(--ink-strong)]">my future me</span>
          </Link>
          <Link href={isLoggedIn ? "/a/dashboard" : "/login"}>
            <Button className="h-9 rounded-md px-4 text-sm font-medium">
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Button>
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>my future me</p>
          <p>A minimalist space for intentional growth.</p>
        </div>
      </footer>
    </div>
  );
}
