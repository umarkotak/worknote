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
          <section className="paper-panel overflow-hidden rounded-lg">
            <div className="border-b border-border bg-[var(--hero-wash)] px-4 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--warning)]">Prompt Generator</p>
                  <h1 className="mt-2 font-[var(--font-heading)] text-2xl text-[var(--ink-strong)]">Spritesheet Builder</h1>
                </div>
                <Link href="/a/tools" className="paper-link text-sm transition-colors">
                  Back to tools
                </Link>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Fill in the art direction once, then copy a tighter prompt that already includes animation, layout, and output constraints.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="placeholder:text-[var(--ink-faint)]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Art style</label>
                  <Input
                    value={form.artStyle}
                    onChange={(event) => setForm((current) => ({ ...current, artStyle: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Perspective</label>
                  <Input
                    value={form.perspective}
                    onChange={(event) => setForm((current) => ({ ...current, perspective: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mood</label>
                  <Input
                    value={form.mood}
                    onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Palette</label>
                  <Input
                    value={form.palette}
                    onChange={(event) => setForm((current) => ({ ...current, palette: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Frame size</label>
                  <Input
                    value={form.frameSize}
                    onChange={(event) => setForm((current) => ({ ...current, frameSize: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sheet layout</label>
                  <Input
                    value={form.grid}
                    onChange={(event) => setForm((current) => ({ ...current, grid: event.target.value }))}
                    className="placeholder:text-[var(--ink-faint)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Animation states</label>
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
                            ? "border-[color:var(--primary-edge)] bg-[var(--primary-soft)] text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quality requirements</label>
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
                            ? "border-[color:rgba(183,133,93,0.24)] bg-[rgba(229,203,186,0.62)] text-[var(--warning)]"
                            : "border-border bg-card text-muted-foreground hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Background handling</label>
                <Input
                  value={form.background}
                  onChange={(event) => setForm((current) => ({ ...current, background: event.target.value }))}
                  className="placeholder:text-[var(--ink-faint)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Negative constraints</label>
                <textarea
                  value={form.negatives}
                  onChange={(event) => setForm((current) => ({ ...current, negatives: event.target.value }))}
                  rows={4}
                  className="paper-editor w-full rounded-md px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>

          <section className="paper-panel overflow-hidden rounded-lg">
            <div className="border-b border-border px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Generated output</p>
                  <h2 className="mt-2 font-[var(--font-heading)] text-xl text-[var(--ink-strong)]">Prompt preview</h2>
                </div>
                <Button onClick={copyPrompt} className="rounded-md">
                  <Copy className="h-4 w-4" />
                  Copy prompt
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="paper-panel-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-primary">
                  <WandSparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold text-[var(--ink-strong)]">Ready-to-paste prompt</span>
                </div>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  rows={12}
                  className="paper-editor mt-3 w-full rounded-lg px-3 py-3 text-sm leading-6 text-foreground outline-none"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="paper-panel-muted rounded-xl p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">Coverage</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-[var(--warning)]">{form.animations.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">animation states selected</p>
                </div>
                <div className="paper-panel-muted rounded-xl p-4">
                  <p className="text-sm font-semibold text-[var(--ink-strong)]">Frame setup</p>
                  <p className="mt-3 text-lg text-foreground">{form.frameSize}</p>
                  <p className="mt-1 text-xs text-muted-foreground">per-frame render target</p>
                </div>
                <div className="paper-panel-muted rounded-xl p-4">
                  <p className="text-sm font-semibold text-[var(--ink-strong)]">Layout</p>
                  <p className="mt-3 text-lg text-foreground">{form.grid}</p>
                  <p className="mt-1 text-xs text-muted-foreground">sheet structure</p>
                </div>
              </div>

              <div className="paper-panel-muted rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prompt checklist</p>
                <div className="mt-3 grid gap-2 text-sm text-foreground md:grid-cols-2">
                  <div className="paper-panel-soft rounded-lg px-3 py-2">Subject and art style are explicit.</div>
                  <div className="paper-panel-soft rounded-lg px-3 py-2">Animation states are named clearly.</div>
                  <div className="paper-panel-soft rounded-lg px-3 py-2">Frame size and layout are included.</div>
                  <div className="paper-panel-soft rounded-lg px-3 py-2">Negative constraints reduce bad generations.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}
