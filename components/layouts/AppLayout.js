import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Briefcase, BookOpen, ChevronDown, ClipboardList, FileText, LayoutDashboard, LogOut, Menu, Wrench } from "lucide-react";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";
import { Button } from "@/components/ui/button";
import { bodyFont, headingFont } from "@/lib/fonts";

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
  {
    title: "Tools",
    description: "Creative utilities and generators",
    href: "/a/tools",
    icon: Wrench,
  },
];

function isActiveRoute(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, logout } = useDashboardSession();
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

  if (isLoading || !user) {
    return (
      <div className={`${bodyFont.className} paper-shell flex min-h-screen items-center justify-center text-foreground`}>
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className={`${bodyFont.className} ${headingFont.variable} paper-shell min-h-screen text-foreground`}>
      <header className="paper-topbar sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-3 sm:px-4">
          <div className="flex w-[180px] items-center justify-start">
            <Link href="/a/dashboard" className="inline-flex items-center gap-2.5">
              <span className="paper-logo-badge inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold">
                mf
              </span>
              <span className="font-[var(--font-heading)] text-base tracking-tight text-[var(--ink-strong)]">my future me</span>
            </Link>
          </div>

          {/* Desktop nav - visible on xl screens */}
            <nav className="hidden xl:flex flex-1 justify-center items-center gap-1">
              {navMenus.map((item) => {
                const isActive = isActiveRoute(router.pathname, item.href);
                const Icon = item.icon;
                return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--surface-3)] text-primary"
                      : "text-muted-foreground hover:bg-[var(--surface-2)] hover:text-[var(--ink-strong)]"
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
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-[var(--surface-2)]"
              aria-expanded={isMenuOpen}
              aria-label="Open navigation menu"
            >
              <Menu className="h-3.5 w-3.5 text-primary" />
              Menu
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {isMenuOpen && (
              <div className="paper-panel absolute top-10 w-[min(94vw,560px)] overflow-hidden rounded-xl">
                <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Navigation
                </div>
                <div className="max-h-[60vh] overflow-y-auto py-1">
                  {navMenus.map((item) => {
                    const isActive = isActiveRoute(router.pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                          className={`block border-b border-border px-4 py-2.5 transition-colors last:border-b-0 ${
                            isActive ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-[var(--surface-1)] text-primary">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <div className="text-sm font-medium text-[var(--ink-strong)]">{item.title}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary transition-colors hover:bg-[var(--surface-2)]"
              aria-expanded={isUserMenuOpen}
              aria-label="Open user menu"
            >
              {userInitial}
            </button>

            {isUserMenuOpen && (
              <div className="paper-panel absolute right-0 top-10 w-56 rounded-xl p-1">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-[var(--ink-strong)]">{user?.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 h-8 w-full justify-start gap-2 rounded-md px-3 text-sm text-destructive hover:bg-[var(--danger-soft)] hover:text-destructive"
                  onClick={logout}
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
