"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";


const SWATCHES = [
  { name: "bg", box: "bg-bg" },
  { name: "panel", box: "bg-panel" },
  { name: "border", box: "bg-border" },
  { name: "text", box: "bg-text" },
  { name: "text-soft", box: "bg-text-soft" },
  { name: "muted", box: "bg-muted" },
  { name: "muted-light", box: "bg-muted-light" },
  { name: "accent", box: "bg-accent" },
  { name: "accent-hover", box: "bg-accent-hover" },
  { name: "accent-fg", box: "bg-accent-fg" },
  { name: "input-bg", box: "bg-input-bg" },
  { name: "success-bg", box: "bg-success-bg" },
  { name: "success-border", box: "bg-success-border" },
  { name: "success-text", box: "bg-success-text" },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9" />;


  return (
    <main className="min-h-screen bg-bg p-10">
      <div className="mb-8 flex gap-2">
        {["light", "dark", "system"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={
              theme === t
                ? "rounded bg-accent px-3 py-1.5 text-sm text-accent-fg"
                : "rounded border border-border px-3 py-1.5 text-sm text-muted"
            }
          >
            {t}
          </button>
        ))}
      </div>
      <h1 className="mb-8 text-2xl font-semibold text-text">Token check</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {SWATCHES.map((s) => (
          <div key={s.name} className="rounded border border-border p-2">
            <div className={`mb-2 h-12 rounded border border-border ${s.box}`} />
            <code className="text-xs text-muted">{s.name}</code>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-text">Body text on page background</p>
        <p className="text-text-soft">Soft text, used for paragraphs</p>
        <p className="text-sm text-muted">Muted, used for dates and meta</p>
        <p className="text-sm text-muted-light">
          Muted-light small text — must clear 4.5:1 in both themes
        </p>

        <button
          type="button"
          className="rounded bg-accent px-4 py-2 text-accent-fg hover:bg-accent-hover"
        >
          Accent button
        </button>

        <div className="rounded border border-success-border bg-success-bg p-4 text-success-text">
          Success message styling
        </div>

        <div className="rounded bg-panel p-4 text-text-soft">
          Panel background — the footer and the &ldquo;Now&rdquo; note use this
        </div>

        <input
          type="text"
          placeholder="Input background"
          className="w-full max-w-sm rounded border border-border bg-input-bg px-3 py-2 text-text"
        />
      </div>
    </main>
  );
}
