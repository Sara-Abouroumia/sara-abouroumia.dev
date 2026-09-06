# Sara Abouroumia portfolio — stack, architecture, and build order (rev. 2)

## Context

The design is finished. `Portfolio.dc.html` is the output of a long design conversation and it
settles the look, the copy, the token palette, the page set, and the behaviour of every flow. It is
a prototype on Claude Design's runtime: all state in `localStorage`, a sign-in that accepts any
credentials, a `?admin=1` query param that grants owner rights, and a world map with invented
visitor data. It runs — `support.js` self-loads React, ReactDOM and Babel from unpkg, so serving the
project folder over any local HTTP server gives a fully clickable demo.

This plan covers building the **real, public portfolio** with the prototype as the visual spec. It
does not re-implement the prototype; that artifact already exists and serves its purpose as a
reference.

**What changed since rev. 1 of this plan** — everything below is now in the prototype and was
missing from the earlier exploration:

- **Products marketplace** (`/products`) — a catalogue of working website demos businesses can
  request, with a multi-select "interest tray" that funnels into one inquiry form, a per-product
  demo view, category filters, and owner-side add/delete.
- **Product inquiries** — a second moderation queue with `new → contacted → archived` status,
  merged into the same owner Review page as references, with a mailto reply action.
- **Owner sign-in via footer link** — the `?admin=1` toggle was replaced by an explicit "Owner sign
  in" screen (single account), a Sign out button in the nav, and owner-only controls that appear
  in-place (Review tab, "+ New post", "+ New product", Delete links).
- **Blog authoring** — an in-page editor (title, cover, summary, body) with Publish / Save as
  draft; drafts visible only to the owner.
- **The assistant is now Mochi, an original chibi pink cat** (`assistant.js`, element
  `<site-assistant>`), not Romario the duck. `duck.js` no longer exists. She peeks in from the right
  screen edge and is coaxed out over three taps; there is no egg.
- Drawer breakpoint is **940px**, not 720 — the nav gained Products and Review and no longer fits
  at tablet widths.
- The visitor map is a background behind the About header, not a page.
- Footer was rebuilt: name/role column, page links, icon links (email, LinkedIn, CV), copyright
  and last-updated row, and the discreet owner sign-in link.

**Decisions already made (2026-09-06):**

| Question | Choice |
|---|---|
| Scope | The real deployed site, not a reference build |
| Blog authoring | MDX in git + Keystatic editor from day one |
| Visitor map | Real country-level visitor counts, not decorative |
| References | Keep **both** invite-only and the uninvited screening flow |
| Owner auth | GitHub OAuth with an email allowlist |
| Products | Real feature, not decoration — inquiries are leads and must never be lost |
| Product demos | Each is a separately deployed site on a subdomain; the portfolio links out |
| Assistant | Port `assistant.js` as-is; do not rewrite in React |

Three of these (real map data, keeping the screening flow, a public inquiry endpoint) are the more
expensive options and this plan carries their full cost — two public write endpoints need bot
defence, real geo data needs a privacy notice and caching discipline, and inquiries are commercial
leads that make the site a lead-generation page (see the Vercel Hobby caveat under Cost).

---

## The one structural change the prototype cannot tell you

The prototype switches pages with `state.page` / `state.mode` / `state.productView` /
`state.blogView` and `<sc-if>` blocks. That is an artifact of the design runtime. The real site
needs real URLs:

```
/                         About (+ approved references, "Now" note, map header)
/experience               Experience
/projects                 Projects
/products                 Products catalogue (filters, tray)
/products/[slug]          Product detail ("demo view": framed screenshot, features, pick)
/products/request         Inquiry form (reads picks from client state / URL)
/products/request/sent    Confirmation
/research                 Research
/blog                     Blog index
/blog/[slug]              Post
/contact                  Contact
/reference                Uninvited screening flow           → noindex
/reference/[token]        Invited referee, personalised      → noindex
/reference/preview        Owner preview of the referee view  → noindex, auth
/admin                    Redirects to /admin/review         → noindex, auth
/admin/review             Inquiries + references queues      → noindex, auth
/admin/products           Add / edit / archive products      → noindex, auth
/admin/sign-in            Owner sign-in                      → noindex
/keystatic                Blog editor                        → noindex, auth
/api/beacon               Visitor geo counter
/api/auth/[...all]        Better Auth handler
```

Nav items become `<Link>` with `aria-current="page"`, not `<button>`. Everything else — tokens,
type scale, spacing, the cat — ports across close to as-is.

**Delete on sight:** the `?admin=1` grant and the `sara-portfolio-owner` localStorage flag
(`componentDidMount`, around `Portfolio.dc.html:800-806`), and the `signIn` that accepts any
non-empty credentials (`signIn =`, ~line 929). They are prototype scaffolding and an auth bypass.
The **shape** of that flow is right (footer link → sign-in page → land on Review → Sign out in nav);
only the check moves to the server.

---

## Stack

Versions verified against the npm registry on 2026-09-06.

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router + TypeScript strict | **16.3.4** | Current LTS line. |
| Styling | Tailwind CSS | **4.3.3** | Prototype's custom properties lift straight into `@theme inline`. |
| Theme | `next-themes` | 0.4.6 | Is the anti-FOUC inline script; don't hand-roll one. |
| Fonts | `next/font/google` | — | Self-hosts Lora + Inter, kills the CDN round-trip and CLS. |
| Blog content | MDX + `gray-matter` + `rehype-pretty-code` | 0.14.5 | Real syntax highlighting, zero client JS. |
| Blog editor | `@keystatic/core` + `@keystatic/next` | 0.6.9 / 5.0.5 | Browser editor that commits MDX to GitHub. |
| Products content | **Keystatic collection** (`content/products/*.yaml`) | — | Same editor, same commit flow; no DB row for catalogue data. |
| Database | Neon Postgres + Drizzle ORM | drizzle 0.45.2 | References, invites, **inquiries**, visit counts, rate limits. |
| Auth | Better Auth, GitHub OAuth + allowlist | **1.7.2** | Pin and watch it. |
| Email | Resend | — | Contact form, inquiry alerts, reference alerts. |
| Bot defence | Cloudflare Turnstile + honeypot | — | Required by the uninvited reference flow **and** the inquiry form. |
| Dialogs / drawer | `@radix-ui/react-dialog` | — | Focus trap, Escape, scroll lock — for the mobile drawer only. |
| Client state | `zustand` (tiny) or React context | — | For the products interest tray only; nothing else needs it. |
| Lint/format | Biome | 2.5.12 | One binary, one config. |
| E2E | Playwright | — | Three specs, not a suite. |

**Skip:** Upstash, Vitest initially, Sentry, Contentlayer, a headless CMS, Stripe (products are
inquiry-based, not checkout — do not add a payment rail to a portfolio).

### Next 16 gotchas that will bite on day one

- `middleware.ts` → `proxy.ts`. Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- `next lint` removed. Use Biome.
- `next/dynamic` with `ssr: false` throws in a Server Component — the cat's import lives in a
  `'use client'` wrapper.
- `params` / `searchParams` are async.
- `NextRequest.geo` / `.ip` removed — use `geolocation(request)` from `@vercel/functions`.

### Tailwind v4 dark mode — the one way that works

```css
:root { --color-bg:#ffffff; --color-accent:#2c4a6e; /* light set */ }
.dark { --color-bg:#14161a; --color-accent:#7fa8d1; /* dark set */ }
@theme inline { --color-bg: var(--color-bg); --color-accent: var(--color-accent); }
@custom-variant dark (&:where(.dark, .dark *));
```

Both palettes are final in the `theme()` method (`Portfolio.dc.html:~995-1021`) — 14 tokens each:
`bg, panel, border, text, textSoft, muted, mutedLight, accent, accentHover, accentFg, inputBg,
successBg, successBorder, successText`. Lift the hex values verbatim; `--muted-light` is `#6b6860`
light / `#9c988c` dark specifically so small text clears 4.5:1. Add `suppressHydrationWarning` to
`<html>` and set `colorScheme` in metadata.

---

## Content model

Three kinds of content, three homes. Getting this split right is most of the architecture.

**1. Typed content modules (git, TypeScript, Zod-validated)** — things that change a few times a
year and have no editor need: `content/experience.ts`, `content/projects.ts`,
`content/education.ts`, `content/skills.ts`, `content/now.ts` (the "Now" note on About),
`content/site.ts` (name, role, location, email, LinkedIn, resume path). Source of truth is the CV
PDF; derive "Last updated" from git rather than hardcoding it.

**2. Keystatic collections (git, YAML/MDX, browser editor)** — things Sara edits herself without a
deploy:

- `blog` — MDX posts. `draft: true` filtered when `VERCEL_ENV === 'production'`, so drafts show on
  preview deploys: that is the owner-only draft view from the prototype, for free.
- `products` — one YAML per demo: `name, slug, category, pitch, stack[], priceFrom, demoUrl,
  features[], cover (image), status: listed | hidden, order`. This replaces the prototype's
  `seedProducts()` / `addProduct` / localStorage and the `/admin/products` route becomes a Keystatic
  collection page. Categories are derived from the data, as the prototype does.

**3. Postgres (Neon)** — things written by strangers or that must survive independently of a deploy:
references, invites, inquiries, visit counts, rate limits.

**Conditional sections:** render the Recommendations block only when there is ≥1 approved
reference; render Research only when there is ≥1 entry. Empty states belong in the admin, not on a
credibility page.

---

## Data model

```
invites(id, token_hash, invitee_name, invitee_email, created_at, expires_at, used_at)

references(id, invite_id?, name, relationship, context, text,
           status pending|approved, consent_at, consent_version, created_at)

inquiries(id, name, business, email, message, product_slugs TEXT[],
          products_snapshot JSONB,
          status new|contacted|archived, source_path, created_at, contacted_at, archived_at)

visit_counts(country_code CHAR(2), day DATE, count INT, PRIMARY KEY (country_code, day))

rate_limits(key, window_start, count)
```

- **Invite tokens:** 32 random bytes, store `sha256(token)`, set `used_at` on submit. Revocable.
- **References:** `pending | approved`. **Hard-delete rejections.**
- **Inquiries:** keep `archived` rows (they are business records, and the inquirer consented to be
  contacted about a service), but schedule a purge at 24 months and say so in the privacy notice.
  `product_slugs` is an array of Keystatic slugs, not FKs — the catalogue is in git, not the DB.
  It stays indexed and queryable (`WHERE 'salon-booking' = ANY(product_slugs)` answers "which demo
  draws the most interest"). `products_snapshot` captures `{slug, name, priceFrom}[]` at submission
  time so the record still reads correctly after the catalogue is renamed or repriced. Both columns,
  not one.
- **Never store an IP or per-visitor lat/long.** Country code and a counter, nothing else.

### GDPR

Publishing third parties' names and opinions makes Sara a data controller; collecting business
contact details for follow-up makes her one twice over.

- Referee form: explicit consent checkbox with wording + version stored.
- Inquiry form: a one-line notice ("Sara will reply by email about the demos you picked; your
  details are not shared") is sufficient — contract/legitimate-interest basis — but state the
  retention period.
- Removal path in the privacy notice; honour it.
- Visitor map: legitimate interest, no cookie banner needed (nothing read/written on device).
- Privacy notice names the processors: Vercel, Neon, Resend, Cloudflare, GitHub (auth).

---

## Feature-specific notes

### Products marketplace + inquiries

This is the one feature with a commercial purpose, so it gets the most careful treatment.

**Catalogue.** Server-rendered from the Keystatic `products` collection. Filter chips are
`<Link href="/products?category=Booking">` so filtered views are shareable and crawlable; read
`searchParams` on the server. Cards link to `/products/[slug]`. "Open demo" is an external
`<a target="_blank" rel="noopener">` to `demoUrl` — each demo is its own deployed site
(`salon.saraabouroumia.dev` or similar), **not** an iframe. The prototype's framed "browser window"
detail view stays as the design for `/products/[slug]`: URL bar showing the real demo host, a
`next/image` screenshot, the features list, and the pick button.

**Interest tray.** The multi-select is client state that must survive navigation between
`/products`, `/products/[slug]` and `/products/request`: a small zustand store persisted to
`sessionStorage` under one key. Sticky bar at the bottom of the products routes only; hidden when
empty. Tray shows count + names, Clear, and "Request info" → `/products/request`.

**Inquiry form.** `/products/request` is a Server Action (`submitInquiry`) with Turnstile +
honeypot + DB rate limit (same helper as the reference form). Picks are posted as hidden fields
from the store; the server re-validates each slug against the collection so a stale or forged slug
cannot land in the DB. On success: insert row, email Sara via Resend (subject
`New inquiry: Salon booking site, Clinic appointments`), `revalidatePath('/admin/review')`, clear
the store, redirect to `/sent`. The confirmation page reuses the animated check from the reference
thank-you.

**Owner queue.** `/admin/review` shows inquiries above references, exactly as the prototype:
`new` outlined in accent, meta line (`email · wants X, Y`), optional message, actions
**Reply by email** (`mailto:` with prefilled subject, as prototyped — this is intentionally not an
in-app composer), **Mark contacted**, **Archive**. Both status changes are Server Actions that
re-check the session. The nav "Review (n)" badge counts `new` inquiries + `pending` references,
fetched in the root layout for the signed-in owner only.

**Owner catalogue editing** happens in Keystatic at `/keystatic` (products collection), not a
custom form. The prototype's "+ New product" and "Delete" become a link to Keystatic and a
`status: hidden` toggle.

### References — both flows ship

Invite-only: owner generates a link at `/admin/review` → `/reference/[token]` → personalised
greeting, name pre-filled. Keep the owner's **"Preview referee view"** as `/reference/preview?name=X`
behind auth — it is the same page component rendered with a synthetic invite and a "Exit preview"
link instead of "Back to the portfolio".

Uninvited: `/reference` → gate ("Have you worked with Sara?" Yes / No) → clarifying fields → form.
Turnstile + honeypot + rate limit; email on submission; consent checkbox.

The About page "Write Sara a reference →" link points at `/reference`. The cat's "I'll put in a good
word" action does the same.

### Owner auth

Better Auth, GitHub provider, allowlist on `session.user.email`. Routes:

- Footer "Owner sign in" → `/admin/sign-in` (one button: Continue with GitHub). Prototype copy
  about "single account, httpOnly cookie" becomes true rather than a disclaimer.
- Success → `/admin/review`. Signed-in state adds **Review (n)** to the nav and drawer, **Sign out**
  in the utility group, and owner-only affordances in place (Keystatic links on Blog and Products).
- `proxy.ts` redirects `/admin/*` and `/keystatic` when unauthenticated — a convenience only. **Every
  Server Action and route handler re-checks the session.** Middleware is not the boundary
  (CVE-2025-29927).
- Keystatic needs its own GitHub App for commits; the Better Auth OAuth app is separate.

### Visitor map — real data

Build-time pre-render of `countries-110m` through `geoNaturalEarth1()` into inline SVG paths from a
Server Component; only the country dots are dynamic. `/api/beacon` reads `geolocation(request)`,
upserts `visit_counts` inside `after()`. Cache the About page; `revalidateTag('map')` daily via a
cron, `revalidatePath('/')` when a reference is approved. Reuse the projection and the per-theme
land/dot colours from `VisitorMap.html`. `aria-hidden` on the map; a scrim behind the `h1` so the
name always clears contrast against land fill. Neon scale-to-zero: the About page must never query
on request.

### Blog — MDX + Keystatic

`content/blog/*.mdx`, `generateStaticParams`, `remark-gfm` + `rehype-pretty-code` + `rehype-slug`,
RSS at `app/blog/rss.xml/route.ts`. Derive **reading time** from the MDX word count at build
(`reading-time` or ten lines of your own) and show it in the post meta line, as the prototype's
"4 min read" does. Related posts wait for V2 — they need a tag taxonomy and enough posts for
relationships to exist. The prototype's post layout (cover, serif title, byline,
640px measure) is the `/blog/[slug]` template. Owner sees Keystatic's editor instead of the
prototype's inline one; the "Draft — only you can see this" label maps onto preview deployments.

### Mochi, the assistant

**`assistant.js` is finished and does not need to be built.** It is a complete, dependency-free
`<site-assistant>` custom element. Integration, not creation.

What the file already contains (symbol references — line numbers drift):

| Piece | Where |
|---|---|
| Copy: `QUIPS`, `TIPS` (per-page comment), `HELP` (per-page question) | top of file |
| `ACTIVITIES` — wave / groom / look on an 8–14s idle timer; independent blinking | after `HELP` |
| Per-theme palettes `LIGHT` / `DARK` — coat, inner ear, snout, **eyes: sun-yellow ↔ night-blue** | after `ACTIVITIES` |
| Peek intro: head + paw from the right edge, `stir` nag every 2.8s, three taps → `wake()` | `.bed` markup, `setPeek()`, `nudge()`, `wake()` |
| Artwork: chibi head, bunny ears (right one resting at 72°), slit pupils, cat mouth, whiskers | `.cat` SVG |
| Rig: single rAF loop driving body/head/ears/tail/paw/pupils/blush/tongue/blink | `tick` |
| Theme-aware lighting (gradient stop swap, dimmed speculars, cool rim light) | `applyTheme()` |
| Speech bubbles: viewport-fixed, clamped 10px inside edges, tail tracks the anchor | `place()` |
| Help balloon with 5 actions incl. "I need a website like these" → products | `openHelp()` |
| Outbound seam: `duck-nav` `{page}` and `duck-reference` window events | `emit()` |

**Integration steps:**

1. Copy the file unchanged to `src/components/assistant/site-assistant.js`. Do not rewrite it in
   React — it is imperative rAF animation mutating SVG attributes directly.
2. `'use client'` wrapper `<Mochi />`: `import('./site-assistant.js')` in a `useEffect`, render
   `<site-assistant theme={resolvedTheme} page={pageKey} />`. `theme` from `next-themes`; `page`
   from `usePathname()` mapped onto `TIPS` keys (`/` → `about`, `/blog/*` → `writing`,
   `/products/*` → `products`, `/admin/*` → `review`). React 19 sets unknown props on custom
   elements as attributes, so `attributeChangedCallback` fires.
3. Rewire the seam: listen for `duck-nav` → `router.push(routeFor(detail.page))`;
   `duck-reference` → `router.push('/reference')`. (Event names are historical; renaming them is
   optional and touches two lines in each file.)
4. Mount in the root layout so she survives navigation. Guards: `ssr:false` inside the client
   wrapper; hide below 640px (she overlaps the drawer trigger); `inert` + `aria-hidden` on the
   host so she is out of the tab order — except the balloon's action buttons, which should stay
   reachable, so scope `inert` to the artwork only; persist `awake` and `hidden` in `localStorage`
   so a returning visitor is not asked to coax her out again; leave the
   `prefers-reduced-motion` branch intact (she should appear already out, no idle motion).
5. CSP: the shadow root injects an inline `<style>` — allow `'unsafe-inline'` for styles or use a
   nonce. Decide when writing security headers.
6. Later, if wanted: a Fuse.js index over `content/*` so typing at her jumps to a section; an LLM
   route only if people actually type.

#### Mochi as a site guide — the layered design

The character file is the dumbest layer and stays that way. Intelligence lives above it, in code
that has no DOM and no React so it can be unit-tested and, later, exposed to an LLM as tools.

```
content/*.ts, content/blog, content/products   source of truth (already exists)
        │
search index (Fuse.js over typed fields)        V2 — not V1
        │
assistant brain  (pure functions)               suggest(route, ctx) · react(event) · intents
        │
<Mochi /> wrapper (React, client)               state machine, persistence, a11y, router seam
        │
site-assistant.js (custom element)              artwork, rAF rig, balloon, peek intro
```

**State machine (V1).** `peeking → out → idle → talking → hidden`, driven by `useReducer`.
`talking` carries `{ text, actions? }`. Do not add `searching` / `responding` until there is a text
input; do not reach for XState — five states and one payload is a reducer.

**Voice.** Mochi is Sara's assistant, not Sara. Third person, always: "She's done more backend than
anything" — never "I've focused on backend". Rules: ≤ 2 lines, no "I think", no exclamation-mark
enthusiasm, one unsolicited message per route per session.

**Route goals** (the brain's `suggest(route)` reads these):

| Route | Goal | Example line |
|---|---|---|
| `/` | orient | "Quick overview here. Projects and Research go deeper." |
| `/experience` | short version | "Backend first, ML on the side. The volunteering is further down." |
| `/projects` | discovery | "Kayseri Social Run is the one she built solo." |
| `/products` | **convert** | "Running a salon? Start with the booking demo." → filter chip |
| `/blog` | learning | "Newer posts are more detailed than the older ones." |
| `/research` | depth | "Working notes, not tutorials." |
| `/contact` | convert | "LinkedIn is usually fastest." |
| owner routes | operate | "Two new inquiries, one reference waiting." |

**Event reactions** (`react(event)`) — trigger on **completion**, never on elapsed time:

- `tray:first-pick` → "Tick anything else that fits — one form covers all of them."
- `inquiry:sent` / `contact:sent` / `reference:sent` → confirmation line, then quiet.
- `cv:downloaded` → "Same content source as the site, so it won't drift."
- `post:read-to-end` → related post, if one exists.
- `auth:signed-in` → switch to owner persona; badge counts in the greeting.

No "you've been reading for two minutes" nudges.

**Intents (V1, five, no NLP).** The help balloon's actions map onto these:
`show-projects`, `find-a-website` (→ `/products`), `write-reference` (→ `/reference`),
`contact`, `dismiss`. Each is `intent → route (+ optional filter param)`.

**Owner persona.** When `session` is present the brain swaps `TIPS`/`HELP` for an operator set:
counts from the two queues, links to `/admin/review` and `/keystatic`, no sales copy. Cheap, and it
makes the owner view feel finished.

**Persistence rules** (`localStorage`, one key `mochi:v1`):
- `awake: true` after the first coax-out — a returning visitor never taps three times again.
- `hidden: true` after "go nap" — persists across sessions; the corner badge brings her back.
- `seen: { [route]: true }` per session (`sessionStorage`) to enforce one tip per route.

**Search and palette (V2).** Fuse.js over the typed content modules — structured fields (tags,
stack, category) beat prose search and give facets for free; Pagefind only once the blog is large.
Surface it as a ⌘K palette that is *also* reachable from a visible control (recruiters and salon
owners do not press ⌘K). The avatar can open the palette ("Looking for something specific?") but
should not grow a text box of its own; avatar = suggest/react/navigate, palette = search.

**LLM (V3, optional).** An "Ask Sara" route handler with the content modules as context and the
brain's functions registered as tools (`navigate`, `search`, `suggest`). Because the brain is pure
and already works, the LLM is an enhancement that can fail closed. Build it only if analytics show
people trying to type at her.

**Accessibility.** `aria-live="polite"` on the bubble; balloon actions are real buttons in the tab
order; artwork `inert` + `aria-hidden`; reduced-motion → appears already out, no idle motion,
text only.

**Roadmap.** V1: persistent avatar, state machine, route tips, event reactions, five intents, owner
persona, persistence. V2: Fuse index, palette, related-post recommendations. V3: LLM layer.

### Nav, drawer, footer

- Desktop nav ≥ 941px: About · Experience · Projects · Products · Research · Blog · Contact ·
  [Review (n)] · Resume ↓ · theme toggle · [Sign out]. Below 941px: wordmark + theme toggle +
  hamburger; drawer lists the same items plus Resume and Sign out. Use Radix Dialog for the drawer
  (focus trap, Escape, scroll lock, focus return, `aria-expanded` on the trigger).
- Theme toggle: three-state system / light / dark with `aria-label` + `aria-pressed`, not a label
  naming the target state.
- Footer (from the prototype): three columns — name + role + location; Pages links; Elsewhere icon
  buttons (email, LinkedIn, CV) + email text — then a bottom row with © year, derived "Last updated",
  and the "Owner sign in" link (hidden when signed in).
- Drop `white-space: nowrap` on the About `h1` and role line; they overflow at 320px.

---

## Cross-cutting

**Security.** One helper, `requireOwner()` in `lib/auth.ts`, returns the session or throws; **every**
Server Action and route handler under `/admin`, every mutation (approve, reject, mark contacted,
archive, create invite), and the Keystatic route call it first. Code-review rule: an action without
`await requireOwner()` is a bug. `proxy.ts` redirects are a convenience on top, never the boundary
(CVE-2025-29927). Two public write endpoints (`/reference`,
`/products/request`) plus contact: all three get Turnstile + honeypot + DB rate limit + Resend alert.
Server-side validation of product slugs against the collection. Headers in `next.config.ts`: CSP,
HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

**Analytics event model.** One typed `track(event, props)` in `lib/analytics.ts`, backed by
`@vercel/analytics` custom events. Eight events, no more until one is missed:

```
demo_opened        { slug }
tray_pick          { slug, count }
inquiry_sent       { count }
contact_sent       {}
cv_downloaded      {}
reference_started  { invited: boolean }
mochi_action       { intent }
palette_opened     {}          (V2)
```

The same bus feeds Mochi's `react(event)` — one emitter, two consumers — and `mochi_action` counts
are the evidence that gates the V3 LLM decision. No dashboard; Vercel's panel is enough.

**SEO.** `generateMetadata` per route; `sitemap.ts` including `/products/[slug]` and `/blog/[slug]`;
`robots.ts`; JSON-LD `Person` (+ `sameAs`), `BlogPosting` per post, and **`Service`/`Offer` per
product** so demos can surface for "salon booking website" queries. `noindex` on `/reference/*`,
`/admin/*`, `/keystatic`, `/products/request*`.

**Forms.** `<form action={serverAction}>`; actions return typed `{ ok, error }`; `useActionState`
for pending; the prototype's disabled-until-valid buttons map onto `isPending` + client validation.
`error.tsx` per segment, `global-error.tsx`, `not-found.tsx`.

**Email.** `from: noreply@herdomain` with `replyTo: visitorEmail`. Templates: contact, inquiry
alert, reference alert, plus the mailto reply is the owner's outbound path (no in-app send).

**CI.** typecheck, Biome, `next build`, Playwright. Secret scanning + CodeQL + Dependabot.

---

## Cost

| Item | Cost |
|---|---|
| Domain (Resend prerequisite; also the demo subdomains live under it) | ~$13/yr |
| Vercel Hobby, Neon Free, Resend Free, Turnstile, GitHub Actions | $0 |
| Each product demo: its own Vercel project on the same Hobby account | $0, but counts toward the 200-project and bandwidth limits |

**Caveat that is now real:** Vercel Hobby forbids commercial use. A portfolio is fine; a Products
page that generates paid work is closer to the line. If inquiries convert, move to Vercel Pro
($20/mo) or self-host on a €5 VPS with Coolify. Plan for it; don't be surprised by it.

---

## Build order

**Phase 1 — publishable. Ship this before touching anything below it.** Next 16.3 + TS strict,
real routes, Tailwind v4 tokens, `next-themes`, `next/font`, typed content modules, MDX blog +
reading time + RSS, **Products catalogue from Keystatic YAML with external demo links and detail
pages — no tray, no form**, contact form → Resend, `track()` with the event list, metadata +
sitemap + robots + JSON-LD, error pages, security headers, analytics, domain, footer. No DB, no
auth, no map, no references, no inquiries, no cat. The temptation will be to "just add the inquiry
form quickly" — don't; it is a public write endpoint and needs Phase 2's defences.

**Phase 2 — the two write flows.** Neon + Drizzle + Better Auth (GitHub + allowlist),
`requireOwner()`, sign-in page
and Sign out, `/admin/review` with both queues, **interest tray + inquiry form + inquiry
actions**, both referee flows + preview, Turnstile + honeypot + rate limiting, consent capture,
email alerts, cached reads with revalidation on approve.

**Phase 3 — authoring and polish.** Keystatic for blog + products, visitor beacon + pre-rendered
map, **Mochi V1** (avatar + brain: route tips, event reactions, five intents, owner persona,
persistence), OG images via `next/og`, three Playwright specs, CodeQL + Dependabot, first two
product demos actually deployed on subdomains.

**Phase 4 — Mochi V2 (only if the blog has grown).** Fuse index over content modules, ⌘K palette
with a visible trigger, related-post recommendations.

---

## Verification

1. `next build` + `tsc --noEmit`.
2. Theme toggle on every route, reload each; no flash; `--muted-light` text ≥ 4.5:1 both themes;
   Mochi's eyes switch yellow ↔ blue.
2b. Mochi: coax her out, reload → she is already out; "go nap", reload → badge only; visit
   `/products` twice in one session → one tip, not two; sign in → greeting shows queue counts;
   brain functions (`suggest`, `react`) have unit tests with no DOM.
3. Responsive at 320 / 940 / 941 / desktop: no horizontal scroll on the About header; nav never
   wraps; drawer traps focus, closes on Escape, returns focus; Mochi hidden below 640.
4. **Playwright spec 1 (references):** owner signs in → generates invite → opens token URL →
   submits with consent → appears in `/admin/review` → approve → appears on `/` → token reused
   is rejected.
5. **Playwright spec 2 (products):** pick two demos on `/products`, open a detail page (tray
   persists), request info → row in `inquiries` with both slugs, email sent, appears as `new` in
   `/admin/review` with badge count 1 → Mark contacted → badge 0 → Archive → hidden. Forged slug in
   the POST is rejected.
6. **Playwright spec 3 (auth boundary):** signed-out request to `/admin/review`, to the approve
   action, and to the inquiry status action all reject — test the actions directly. Grep the
   codebase: every file under `app/admin/**/actions.ts` and every mutating action contains
   `requireOwner()`.
7. Geo beacon on a preview deployment: `visit_counts` increments, no IP anywhere.
8. Email: contact + inquiry land in inbox, Reply goes to the visitor.
9. Cold start after 5+ min idle: `/` and `/products` fast (served from cache, no Neon query).
10. Lighthouse on `/`, one post, one product; curl `sitemap.xml`, `robots.txt`, `rss.xml`;
    `noindex` on `/reference/*`, `/admin/*`, `/products/request*`.

## Critical files

- `Portfolio.dc.html` — the visual and behavioural spec. `theme()` (~995) holds both token sets;
  `renderVals()` (~1023 onward) enumerates every piece of state the real routes replace;
  `seedProducts()` (~853) is the first six catalogue entries and their feature copy;
  `seedPosts()` (~838) two sample posts; `componentDidMount` (~800) contains the auth bypass to
  delete and the `duck-nav` / `duck-reference` listeners to rewire.
- `assistant.js` — port as-is. Copy in `TIPS` / `HELP` / `QUIPS`; palettes in `LIGHT` / `DARK`;
  seam in `emit()` and `openHelp()`.
- `VisitorMap.html` — reuse the projection and theme colours; discard the iframe and CDN fetches.
- `assets/Sara_Abouroumia_Resume.pdf` — source of truth for the content modules.
- `support.js`, `image-slot.js` — design-tool runtime. Not ported; `image-slot` becomes
  `next/image` (product covers and blog covers are Keystatic image fields).
