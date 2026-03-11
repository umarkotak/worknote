import Link from "next/link";
import { ArrowRight, PanelsTopLeft, WandSparkles } from "lucide-react";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";

const toolMenus = [
  {
    id: "spritesheet-prompt",
    title: "Spritesheet Prompt Builder",
    description: "Generate a production-ready prompt for sprite sheet art and animation states.",
    href: "/a/tools/spritesheet",
    icon: WandSparkles,
  },
  {
    id: "spritesheet-player",
    title: "Spritesheet Player",
    description: "Upload, slice, reorder, and preview sprite animation frames from a sheet.",
    href: "/a/tools/spritesheet-player",
    icon: PanelsTopLeft,
  },
];

export default function ToolsLandingPage() {
  useDashboardSession();

  return (
    <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[1600px] p-2">
        <section className="paper-panel overflow-hidden rounded-lg">
          <div className="border-b border-border bg-[var(--hero-wash)] px-4 py-5">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Tools</p>
            <h1 className="mt-3 font-[var(--font-heading)] text-2xl text-[var(--ink-strong)]">Available tools</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Simple list of implemented tools. Click any menu to open it.
            </p>
          </div>

          <div className="p-3">
            <div className="paper-panel-muted overflow-hidden rounded-xl">
              {toolMenus.map((tool, index) => {
                const Icon = tool.icon;

                return (
                  <Link
                     key={tool.id}
                     href={tool.href}
                     className={`flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-[var(--surface-2)] ${
                       index !== toolMenus.length - 1 ? "border-b border-border" : ""
                     }`}
                   >
                     <div className="flex min-w-0 items-center gap-3">
                       <span className="paper-logo-badge inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary">
                         <Icon className="h-4 w-4" />
                       </span>
                       <div className="min-w-0">
                         <p className="text-sm font-semibold text-[var(--ink-strong)]">{tool.title}</p>
                         <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                       </div>
                     </div>
                     <span className="inline-flex items-center gap-2 text-sm text-primary">
                       Open
                       <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
  );
}
