import type { ReactNode } from "react";

/**
 * The dashed placeholder from the design, for a section that is genuinely
 * empty rather than broken.
 *
 * Used only where absence is the honest answer and the reader benefits from
 * being told so (a store with no items, a journal with no entries). It has no
 * place on a page whose job is credibility: the About page renders
 * Recommendations only once one exists, rather than advertising that none do.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[3px] border border-border border-dashed px-6 py-8 text-center text-[14px] text-muted-light">
      {children}
    </div>
  );
}
