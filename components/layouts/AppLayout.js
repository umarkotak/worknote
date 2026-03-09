import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Inter, Space_Grotesk } from "next/font/google";
import { Briefcase, BookOpen, ChevronDown, ClipboardList, FileText, LayoutDashboard, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const navMenus = [
  {
    title: "Dashboard",
    description: "Quick start and overview",
    href: "/a/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Daily Log",
    description: "Track daily actions",
    href: "/a/worklogs",
    icon: FileText,
  },
  {
    title: "Job Hunting",
    description: "Manage applications and logs",
    href: "/a/applications",
    icon: Briefcase,
  },
  {
    title: "My Journal",
    description: "Video journals and notes",
    href: "/a/journal",
    icon: BookOpen,
  },
  {
    title: "Clipboard",
    description: "Save and reuse snippets",
    href: "/a/clipboards",
    icon: ClipboardList,
  },
];

export default function AppLayout({
  user,
  onLogout,
  isLoading = false,
  loadingText = "Loading...",
  children,
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const centerMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (centerMenuRef.current && !centerMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  const userInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className={`${bodyFont.className} min-h-screen bg-[#1e1e1e] text-[#d4d4d4] flex items-center justify-center`}>
        <div className="text-sm text-[#9da1a6]">{loadingText}</div>
      </div>
    );
  }

  return (
    <div
      className={`${bodyFont.className} ${headingFont.variable} min-h-screen bg-background text-foreground`}
      style={{
        "--background": "#1e1e1e",
        "--foreground": "#d4d4d4",
        "--card": "#252526",
        "--card-foreground": "#d4d4d4",
        "--popover": "#252526",
        "--popover-foreground": "#d4d4d4",
        "--primary": "#007acc",
        "--primary-foreground": "#ffffff",
        "--secondary": "#2d2d30",
        "--secondary-foreground": "#d4d4d4",
        "--muted": "#2a2a2d",
        "--muted-foreground": "#9da1a6",
        "--accent": "#2d2d30",
        "--accent-foreground": "#d4d4d4",
        "--destructive": "#f48771",
        "--border": "#3c3c3c",
        "--input": "#3c3c3c",
        "--ring": "#007acc",
      }}
    >
      <header className="sticky top-0 z-40 border-b border-[#3c3c3c] bg-[#1e1e1e]/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-3 sm:px-4">
          <div className="flex w-[180px] items-center justify-start">
            <Link href="/a/dashboard" className="inline-flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#3c3c3c] bg-[#252526] text-xs font-semibold text-[#9cdcfe]">
                mf
              </span>
              <span className="font-[var(--font-heading)] text-base tracking-tight text-[#e8e8e8]">my future me</span>
            </Link>
          </div>

          {/* Desktop nav - visible on xl screens */}
          <nav className="hidden xl:flex flex-1 justify-center items-center gap-1">
            {navMenus.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#2d2d30] text-[#9cdcfe]"
                      : "text-[#9da1a6] hover:bg-[#2d2d30] hover:text-[#d4d4d4]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button - hidden on xl screens */}
          <div ref={centerMenuRef} className="relative flex flex-1 justify-center xl:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[#3c3c3c] bg-[#252526] px-3 text-xs font-medium text-[#d4d4d4] transition-colors hover:bg-[#2d2d30]"
              aria-expanded={isMenuOpen}
              aria-label="Open navigation menu"
            >
              <Menu className="h-3.5 w-3.5 text-[#9cdcfe]" />
              Menu
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute top-10 w-[min(94vw,560px)] overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#252526] shadow-2xl shadow-black/40">
                <div className="border-b border-[#3c3c3c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9da1a6]">
                  Navigation
                </div>
                <div className="max-h-[60vh] overflow-y-auto py-1">
                  {navMenus.map((item) => {
                    const isActive = router.pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={`block border-b border-[#303030] px-4 py-2.5 transition-colors last:border-b-0 ${
                          isActive ? "bg-[#2d2d30]" : "hover:bg-[#2d2d30]"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#3c3c3c] bg-[#1f1f1f] text-[#9cdcfe]">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <div className="text-sm font-medium text-[#e8e8e8]">{item.title}</div>
                            <div className="mt-0.5 text-xs text-[#9da1a6]">{item.description}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div ref={userMenuRef} className="relative flex w-[180px] justify-end">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3c3c3c] bg-[#252526] text-xs font-semibold text-[#9cdcfe] transition-colors hover:bg-[#2d2d30]"
              aria-expanded={isUserMenuOpen}
              aria-label="Open user menu"
            >
              {userInitial}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-10 w-56 rounded-xl border border-[#3c3c3c] bg-[#252526] p-1 shadow-2xl shadow-black/40">
                <div className="border-b border-[#3c3c3c] px-3 py-2">
                  <p className="truncate text-sm font-medium text-[#e8e8e8]">{user?.name || "User"}</p>
                  <p className="truncate text-xs text-[#9da1a6]">{user?.email || ""}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 h-8 w-full justify-start gap-2 rounded-md px-3 text-sm text-[#f48771] hover:bg-[#3a1717] hover:text-[#ffb4a5]"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

export { bodyFont, headingFont };
