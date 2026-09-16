import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageTitle, PROSE } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Research & Development",
  description:
    "Writeups from Kaggle competitions, machine learning work, and things Sara Abouroumia is figuring out in public.",
  path: "/research",
});

/**
 * This page absorbed what used to be the separate Blog tab.
 *
 * Two tabs for "things I wrote" is one tab too many on a portfolio this size,
 * and the split forced a false distinction: a Kaggle writeup is both research
 * and a blog post. Posts land here as MDX in content/research/, rendered in the
 * long-form layout the design specified for the blog.
 */
export default function ResearchPage() {
  return (
    <div>
      <PageTitle>Research &amp; Development</PageTitle>

      <p className={`${PROSE} mb-6 text-[16px] text-text-soft leading-[1.7]`}>
        Writeups from Kaggle competitions, notes from machine learning work, and
        whatever I am currently taking apart to understand.
      </p>

      <EmptyState>
        Nothing published yet. The first writeups are coming.
      </EmptyState>
    </div>
  );
}
