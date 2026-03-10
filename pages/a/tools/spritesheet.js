import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "react-toastify";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const animationPresets = [
  "idle",
  "walk",
  "run",
  "jump",
  "attack",
  "hurt",
  "death",
];

const detailPresets = [
  "clean silhouette",
  "consistent top-down readability",
  "clear frame-to-frame spacing",
  "game-ready white background",
];

const initialForm = {
  subject: "forest ranger with lantern",
  artStyle: "hand-painted pixel art",
  perspective: "3/4 side view",
  mood: "adventurous and warm",
  palette: "earthy greens, amber glow, muted leather browns",
  frameSize: "128x128",
  grid: "7 columns x 1 row per animation strip",
  animations: ["idle", "walk", "attack"],
  details: ["clean silhouette", "game-ready white background"],
  background: "white background",
  negatives: "no text, no UI, no watermark, no extra limbs, no motion blur",
};

function toggleArrayValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function SpritesheetPromptPage() {
  useDashboardSession();
  const [form, setForm] = useState(initialForm);

  const generatedPrompt = useMemo(() => {
    const animations = form.animations.length ? form.animations.join(", ") : "idle";
    const details = form.details.length ? form.details.join(", ") : "clean silhouette";

    return [
      `Create a ${form.artStyle} sprite sheet of ${form.subject}.`,
      `Use a ${form.perspective} camera angle with a ${form.mood} tone.`,
      `Render the sheet at ${form.frameSize} per frame, arranged as ${form.grid}.`,
      `Include these animation states: ${animations}.`,
      `Keep the color direction focused on ${form.palette}.`,
      `Production requirements: ${details}, ${form.background}.`,
      `Negative constraints: ${form.negatives}.`,
    ].join(" ");
  }, [form]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success("Prompt copied");
    } catch (error) {
      toast.error(error.message || "Failed to copy prompt");
    }
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[1600px] p-2">
        <div className="grid gap-2 xl:grid-cols-[0.78fr_1.22fr]">
          <section className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
            <div className="border-b border-[#3c3c3c] bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.2),_transparent_38%),linear-gradient(180deg,_rgba(30,30,30,0.98),_rgba(37,37,38,0.98))] px-4 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#f7be4a]">Prompt Generator</p>
                  <h1 className="mt-2 font-[var(--font-heading)] text-2xl text-[#f3f3f3]">Spritesheet Builder</h1>
                </div>
                <Link href="/a/tools" className="text-sm text-[#9cdcfe] transition-colors hover:text-white">
                  Back to tools
                </Link>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#aeb6bf]">
                Fill in the art direction once, then copy a tighter prompt that already includes animation, layout, and output constraints.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Art style</label>
                  <Input
                    value={form.artStyle}
                    onChange={(event) => setForm((current) => ({ ...current, artStyle: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Perspective</label>
                  <Input
                    value={form.perspective}
                    onChange={(event) => setForm((current) => ({ ...current, perspective: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Mood</label>
                  <Input
                    value={form.mood}
                    onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Palette</label>
                  <Input
                    value={form.palette}
                    onChange={(event) => setForm((current) => ({ ...current, palette: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Frame size</label>
                  <Input
                    value={form.frameSize}
                    onChange={(event) => setForm((current) => ({ ...current, frameSize: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Sheet layout</label>
                  <Input
                    value={form.grid}
                    onChange={(event) => setForm((current) => ({ ...current, grid: event.target.value }))}
                    className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Animation states</label>
                <div className="flex flex-wrap gap-2">
                  {animationPresets.map((preset) => {
                    const isActive = form.animations.includes(preset);

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, animations: toggleArrayValue(current.animations, preset) }))}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "border-[#007acc] bg-[#0f2f45] text-[#dff3ff]"
                            : "border-[#3c3c3c] bg-[#1f1f1f] text-[#9da1a6] hover:bg-[#2d2d30]"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Quality requirements</label>
                <div className="flex flex-wrap gap-2">
                  {detailPresets.map((preset) => {
                    const isActive = form.details.includes(preset);

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, details: toggleArrayValue(current.details, preset) }))}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "border-[#f59e0b] bg-[#3c2a0b] text-[#ffe0a3]"
                            : "border-[#3c3c3c] bg-[#1f1f1f] text-[#9da1a6] hover:bg-[#2d2d30]"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Background handling</label>
                <Input
                  value={form.background}
                  onChange={(event) => setForm((current) => ({ ...current, background: event.target.value }))}
                  className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3] placeholder:text-[#6f767d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Negative constraints</label>
                <textarea
                  value={form.negatives}
                  onChange={(event) => setForm((current) => ({ ...current, negatives: event.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-3 py-2 text-sm text-[#f3f3f3] outline-none transition focus:ring-2 focus:ring-[#007acc]/60"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
            <div className="border-b border-[#3c3c3c] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9cdcfe]">Generated output</p>
                  <h2 className="mt-2 font-[var(--font-heading)] text-xl text-[#f3f3f3]">Prompt preview</h2>
                </div>
                <Button onClick={copyPrompt} className="rounded-md bg-[#007acc] text-white hover:bg-[#0e639c]">
                  <Copy className="h-4 w-4" />
                  Copy prompt
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-xl border border-[#3c3c3c] bg-[linear-gradient(180deg,_rgba(0,122,204,0.12),_rgba(31,31,31,0.95))] p-4">
                <div className="flex items-center gap-2 text-[#9cdcfe]">
                  <WandSparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold text-[#eaf6ff]">Ready-to-paste prompt</span>
                </div>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  rows={12}
                  className="mt-3 w-full rounded-lg border border-[#3c3c3c] bg-[#171717] px-3 py-3 text-sm leading-6 text-[#f3f3f3] outline-none"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                  <div className="flex items-center gap-2 text-[#9cdcfe]">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold text-[#e8e8e8]">Coverage</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-[#f7be4a]">{form.animations.length}</p>
                  <p className="mt-1 text-xs text-[#9da1a6]">animation states selected</p>
                </div>
                <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                  <p className="text-sm font-semibold text-[#e8e8e8]">Frame setup</p>
                  <p className="mt-3 text-lg text-[#f3f3f3]">{form.frameSize}</p>
                  <p className="mt-1 text-xs text-[#9da1a6]">per-frame render target</p>
                </div>
                <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                  <p className="text-sm font-semibold text-[#e8e8e8]">Layout</p>
                  <p className="mt-3 text-lg text-[#f3f3f3]">{form.grid}</p>
                  <p className="mt-1 text-xs text-[#9da1a6]">sheet structure</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#9da1a6]">Prompt checklist</p>
                <div className="mt-3 grid gap-2 text-sm text-[#d4d4d4] md:grid-cols-2">
                  <div className="rounded-lg border border-[#313131] bg-[#252526] px-3 py-2">Subject and art style are explicit.</div>
                  <div className="rounded-lg border border-[#313131] bg-[#252526] px-3 py-2">Animation states are named clearly.</div>
                  <div className="rounded-lg border border-[#313131] bg-[#252526] px-3 py-2">Frame size and layout are included.</div>
                  <div className="rounded-lg border border-[#313131] bg-[#252526] px-3 py-2">Negative constraints reduce bad generations.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}
