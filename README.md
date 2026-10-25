# sara-abouroumia.dev

Source for [sara-abouroumia.dev](https://sara-abouroumia.dev), the personal site of Sara Abouroumia: M.S. researcher at Istanbul Technical University working on AI for cybersecurity, with a background in full-stack and cloud engineering.

## Stack

- **Next.js 16** (App Router, TypeScript strict), every route statically prerendered
- **Tailwind CSS 4**, with the colour tokens and both themes in `src/app/globals.css`
- **MDX** for notes, highlighted at build time by Shiki
- **Resend** for the contact form, sent from a Server Action
- **Biome** for linting and formatting
- Deployed on **Vercel**

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (also typechecks) |
| `npm run lint` | Biome lint and format check |
| `npm run format` | Apply Biome formatting |

The contact form needs `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` (see `.env.example`). Without them the form says so and shows the email address instead.

## Where things live

| To change | Edit |
| --- | --- |
| Name, role, links, nav | `src/content/site.ts` |
| Bio and the "Now" panel | `src/content/about.ts` |
| Experience | `src/content/experience.ts` |
| Education and coursework | `src/content/education.ts` |
| Skills | `src/content/skills.ts` |
| Notes | `src/content/notes/*.mdx` |
| Resume PDF | `public/Sara_Abouroumia_Resume.pdf` |

Content is typed TypeScript, not a CMS, so a typo in a field name is a build error rather than a blank space on the live site.

### Writing a note

Copy `src/content/notes/writing-a-note.mdx`, rename it (the filename becomes the URL under `/notes/`), and edit the frontmatter. Every note needs a `category`: `lecture`, `study`, `paper` or `finding`, which sets its label on the card and the filter it appears under; `tags` are free-form topics. Notes with `draft: true` render locally and on preview deployments but never in production, the RSS feed, or the sitemap. The template itself shows every element a note can use.

## Design reference

`design/` holds the original clickable prototype the site was built from. It is a spec, not part of the build, and `docs/BUILD_PLAN.md` describes the architecture and the phases still to come.
