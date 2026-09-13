import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /**
       * Disallowed ahead of the routes existing, so there is no window where a
       * crawler finds them first. The reference flow in particular would
       * otherwise generate an unbounded set of crawlable near-duplicate pages,
       * one per invite token.
       */
      disallow: ["/admin/", "/keystatic", "/reference/"],
    },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
