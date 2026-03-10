import Link from "next/link";
import { useCookies } from "react-cookie";

import { Button } from "@/components/ui/button";
import { bodyFont, headingFont } from "@/lib/fonts";

export default function LandingLayout({ children }) {
  const [cookies] = useCookies(["auth_token"]);
  const isLoggedIn = Boolean(cookies.auth_token);

  return (
    <div
      className={`${bodyFont.className} ${headingFont.variable} min-h-screen bg-[#1e1e1e] text-[#d4d4d4]`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(86, 156, 214, 0.18), transparent 30%), radial-gradient(circle at 85% 0%, rgba(78, 201, 176, 0.12), transparent 28%)",
      }}
    >
      <header className="sticky top-0 z-30 border-b border-[#3c3c3c] bg-[#1e1e1e]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3c3c3c] bg-[#252526] text-xs font-semibold text-[#9cdcfe]">
              mf
            </span>
            <span className="font-[var(--font-heading)] text-xl tracking-tight text-[#e8e8e8]">my future me</span>
          </Link>
          <Link href={isLoggedIn ? "/a/dashboard" : "/login"}>
            <Button className="h-9 rounded-md border border-[#3c3c3c] bg-[#007acc] px-4 text-sm font-medium text-white hover:bg-[#0e639c]">
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Button>
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-[#3c3c3c] px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 text-sm text-[#9da1a6] sm:flex-row sm:items-center sm:justify-between">
          <p>my future me</p>
          <p>A minimalist space for intentional growth.</p>
        </div>
      </footer>
    </div>
  );
}
