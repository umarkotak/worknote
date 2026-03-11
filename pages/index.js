import { useEffect, useState } from "react";
import Link from "next/link";
import { useCookies } from "react-cookie";

import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Daily Log",
    description: "Capture what you did each day, what moved forward, and what needs attention tomorrow.",
    href: "/a/worklogs",
    status: "Live",
  },
  {
    title: "Job Hunting Tracker",
    description: "Track applications, interview stages, and follow-ups with one clean timeline.",
    href: "/a/applications",
    status: "Live",
  },
  {
    title: "My Journal",
    description: "Create video-based journals and keep your notes in one focused timeline.",
    href: "/a/journal",
    status: "Live",
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [cookies] = useCookies(["auth_token"]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !!cookies.auth_token;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="paper-kicker inline-flex rounded-md px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
              Prepare your future
            </p>
            <h1 className="mt-5 max-w-3xl font-[var(--font-heading)] text-5xl leading-[1.05] text-[var(--ink-strong)] sm:text-6xl">
              Build tomorrow with focused actions today.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              my future me is a focused workspace for personal growth: daily logs, career momentum, and my journal.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={isLoggedIn ? "/a/dashboard" : "/login"}>
                <Button className="h-11 w-full rounded-md px-6 text-sm font-semibold sm:w-auto">
                  {isLoggedIn ? "Continue" : "Get started"}
                </Button>
              </Link>
              <Link href="/a/worklogs">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-md px-6 text-sm font-semibold sm:w-auto"
                >
                  Open daily log
                </Button>
              </Link>
            </div>
          </div>

          <div className="paper-panel rounded-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success)]">Why this app</p>
            <div className="mt-5 space-y-3">
              <div className="paper-panel-muted rounded-lg px-4 py-3 text-sm text-foreground">Stay consistent with your daily life records</div>
              <div className="paper-panel-muted rounded-lg px-4 py-3 text-sm text-foreground">See job search progress clearly and early</div>
              <div className="paper-panel-muted rounded-lg px-4 py-3 text-sm text-foreground">Keep faith-centered reflection in your routine</div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-[var(--font-heading)] text-3xl text-[var(--ink-strong)] sm:text-4xl">Core features</h2>
            <p className="text-sm text-muted-foreground">Minimal tools, meaningful progress.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="paper-panel rounded-xl p-5 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--ink-strong)]">{feature.title}</h3>
                  <span className="paper-panel-muted rounded px-2 py-0.5 text-xs text-muted-foreground">
                    {feature.status}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                <Link href={feature.href} className="paper-link mt-5 inline-flex items-center gap-2 text-sm font-medium">
                  {feature.status === "Planned" ? "View roadmap" : "Open feature"}
                  <span aria-hidden="true">{"->"}</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-panel mt-16 rounded-2xl p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--warning)]">Start now</p>
          <h3 className="mt-3 max-w-2xl font-[var(--font-heading)] text-3xl text-[var(--ink-strong)] sm:text-4xl">
            Your future self grows from what you repeat daily.
          </h3>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={isLoggedIn ? "/a/dashboard" : "/login"}>
              <Button className="h-11 w-full rounded-md px-6 text-sm font-semibold sm:w-auto">
                {isLoggedIn ? "Go to dashboard" : "Create your routine"}
              </Button>
            </Link>
            <Link href="/a/applications">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-md px-6 text-sm font-semibold sm:w-auto"
                >
                  Open job tracker
                </Button>
            </Link>
          </div>
        </section>
    </main>
  );
}
