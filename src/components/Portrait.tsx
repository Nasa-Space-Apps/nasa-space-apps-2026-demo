import type { PortraitLayer, Theme } from "@/lib/themes";
import jackson from "@/lib/portraits/jackson";

/**
 * Flat 2D portraits in the style of the Primer interview cards: one blue family in a few flat tones over a light grey square, no outlines, no
 * gradients. Each portrait is a stack of flat shapes traced from the person's photo (`scripts/portrait`: silhouettes and shading planes follow
 * the real light; eyes, brows and lips are drawn over them), stored in `lib/portraits/<id>.ts` on a 400×400 grid and painted back to front with
 * the tones of `theme.portrait`. To add a person: generate their file and add it here.
 */
const PORTRAITS: Record<string, PortraitLayer[]> = { jackson };

export default function Portrait({ id, theme, label }: { id: string; theme: Theme; label: string }) {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} style={{ display: "block", width: "100%", height: "auto", borderRadius: theme.radiusSm, background: theme.portrait.bg }}>
      {PORTRAITS[id]?.map(([tone, d], i) => (
        <path key={i} fill={theme.portrait[tone]} fillRule="evenodd" d={d} />
      ))}
    </svg>
  );
}
