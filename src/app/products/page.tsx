import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageTitle, PROSE } from "@/components/section";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Products",
  description:
    "Working website demos, built and ready to adapt for your business.",
  path: "/products",
});

export default function ProductsPage() {
  return (
    <div>
      <PageTitle>Products</PageTitle>

      <p className={`${PROSE} mb-6 text-[16px] text-text-soft leading-[1.7]`}>
        Working website demos, built and ready to adapt. Open any one to try it,
        tick the ones that fit your business, and send them over in a single
        request.
      </p>

      {/* The store is deliberately empty rather than seeded with placeholders.
          A catalogue of demos that do not exist is a promise the site cannot
          keep, and the first real entry has to be a deployed site on its own
          subdomain before it can be listed here. */}
      <EmptyState>
        <p className="text-[15px] text-text-soft">
          The first demos are being built.
        </p>
        <p className="mt-1.5">
          If you have something specific in mind,{" "}
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent("Website enquiry")}`}
            className="text-accent underline hover:text-accent-hover"
          >
            tell me about it
          </a>{" "}
          and I will build to it directly.
        </p>
      </EmptyState>
    </div>
  );
}
