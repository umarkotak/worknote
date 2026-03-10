import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { ArrowRight, PanelsTopLeft, WandSparkles } from "lucide-react";

import AppLayout from "@/components/layouts/AppLayout";
import api from "@/lib/api";

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
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!cookies.auth_token) {
        router.push("/login");
        return;
      }

      const { data, error } = await api.getCurrentUser();
      if (error) {
        removeCookie("auth_token", { path: "/" });
        router.push("/login");
        return;
      }

      setUser(data);
      setIsLoading(false);
    };

    checkAuth();
  }, [cookies.auth_token, removeCookie, router]);

  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  return (
    <AppLayout user={user} onLogout={handleLogout} isLoading={isLoading} loadingText="Loading tools...">
      <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[1600px] p-2">
        <section className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
          <div className="border-b border-[#3c3c3c] bg-[radial-gradient(circle_at_top_left,_rgba(0,122,204,0.28),_transparent_40%),linear-gradient(135deg,_rgba(32,32,32,0.96),_rgba(18,18,18,0.96))] px-4 py-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9cdcfe]">Tools</p>
            <h1 className="mt-3 font-[var(--font-heading)] text-2xl text-[#f3f3f3]">Available tools</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#aeb6bf]">
              Simple list of implemented tools. Click any menu to open it.
            </p>
          </div>

          <div className="p-3">
            <div className="overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#1f1f1f]">
              {toolMenus.map((tool, index) => {
                const Icon = tool.icon;

                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className={`flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-[#2a2a2d] ${
                      index !== toolMenus.length - 1 ? "border-b border-[#303030]" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3c3c3c] bg-[#252526] text-[#9cdcfe]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#f1f3f5]">{tool.title}</p>
                        <p className="mt-1 text-sm text-[#9da1a6]">{tool.description}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm text-[#9cdcfe]">
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
    </AppLayout>
  );
}
