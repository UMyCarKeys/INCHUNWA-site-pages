# Inchunwa Project Website

A high-performance, zero-maintenance static website for the Inchunwa Project — a community-rooted Southeastern Tribal tattoo revitalization project and podcast.

> *"To be marked, branded, or tattooed in chahta anumpa (Choctaw) is Inchunwa."*

---

## Architecture: The "Static Sovereignty" Model

This site uses a **database-free static architecture** designed for maximum security, performance, and true content ownership. There is no server-side runtime, no database, and no recurring platform costs beyond a domain name.

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Astro](https://astro.build) v6 | Static site generation with zero client-side JS by default |
| **CMS** | [Decap CMS](https://decapcms.org) v3 | Git-based, code-free content management dashboard at `/admin` |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com) | Global CDN, free SSL, automatic deploys on push |
| **Content** | Markdown + YAML frontmatter | Episode data, staff bios, testimonials, page content |
| **Styling** | Vanilla CSS with custom properties | Design token system, fluid typography, no framework dependency |
| **Interactivity** | Vanilla JS + Astro View Transitions | Persistent audio player, series filtering, mobile menu |

### Why This Architecture

- **Zero recurring costs** — Cloudflare Pages free tier; only cost is the annual domain
- **No attack surface** — No database, no server, no login system on the public site. Pre-built HTML served from CDN
- **Instant loads** — Static HTML + CSS served from 300+ edge locations. Sub-second page loads even on slow connections
- **True ownership** — All content lives as files in this repository. You own the code, the content, and the data entirely
- **Non-technical editing** — Decap CMS provides a GUI for uploading episodes and editing pages without touching code

---

## Project Structure

```
/
├── public/
│   ├── admin/              # Decap CMS dashboard (config.yml + entry point)
│   ├── fonts/              # Self-hosted WOFF2 web fonts (production)
│   ├── _headers            # Cloudflare security headers
│   ├── _redirects          # RSS feed aliases (/podcast, /feed, /rss)
│   ├── robots.txt          # Search engine directives + sitemap reference
│   └── favicon.svg         # Brand favicon
├── src/
│   ├── components/
│   │   ├── global/         # Header, Footer, Navigation, MobileMenu, AudioPlayer, SkipLink
│   │   ├── home/           # Hero, LatestEpisodes, MissionTeaser, CallToAction
│   │   ├── episodes/       # EpisodeCard, SeriesNav (client-side filter)
│   │   ├── about/          # StaffCard, StaffGrid, TestimonialCard
│   │   ├── support/        # DonationCTA
│   │   ├── contact/        # SocialLinks
│   │   └── ui/             # Button, Card, Tag, SectionHeading, Pagination, MotifDivider
│   ├── content/
│   │   ├── episodes/       # Markdown files — one per podcast episode (EP10–EP25)
│   │   ├── series/         # Series 2, 3, 4 metadata
│   │   ├── staff/          # Team member bios
│   │   ├── testimonials/   # Community quotes
│   │   ├── funders/        # Supporter logos and links
│   │   └── pages/          # CMS-editable page content (home, about, support, contact)
│   ├── content.config.ts   # Zod schema definitions for all 6 content collections
│   ├── layouts/
│   │   ├── BaseLayout.astro    # HTML shell: <head>, meta, OG tags, fonts, view transitions
│   │   ├── PageLayout.astro    # Standard page wrapper: header + main + footer + audio player
│   │   └── EpisodeLayout.astro # Episode detail page wrapper
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── about.astro         # About (mission, vision, staff, testimonials)
│   │   ├── episodes/
│   │   │   ├── index.astro     # Episode archive with series filtering
│   │   │   └── [...id].astro   # Dynamic episode detail pages (getStaticPaths)
│   │   ├── contact.astro       # Contact form, social links, email
│   │   ├── support.astro       # Donation options, funders
│   │   ├── rss.xml.ts          # Podcast RSS feed (Apple/Spotify/Google compatible)
│   │   └── 404.astro           # Custom 404 page
│   └── styles/
│       ├── global.css          # Design tokens, CSS reset, utility classes
│       ├── typography.css      # Font declarations, prose styles
│       └── animations.css      # Scroll-triggered entrances, keyframes, micro-interactions
├── astro.config.mjs            # Astro configuration (static output, sitemap)
├── tsconfig.json               # TypeScript strict mode
└── package.json
```

---

## Content Collections

All content is managed through **6 typed collections** defined in `src/content.config.ts` with Zod schema validation:

| Collection | Schema Fields | Purpose |
|-----------|--------------|---------|
| `episodes` | title, description, pubDate, series, seasonNumber, episodeNumber, duration, audioUrl, audioLength, explicit, tags, transcript, draft | Podcast episode data. Audio hosted on Buzzsprout |
| `series` | title, description, order | Podcast series/seasons grouping |
| `staff` | name, role, bio, photo, email, socialLinks, order | Team member profiles |
| `testimonials` | author, role, quote, featured, order | Community testimonials |
| `funders` | name, logo, url, active, order | Supporter organizations |
| `pages` | title, description, updatedDate | CMS-editable page body content |

Content files are Markdown with YAML frontmatter. Decap CMS at `/admin` provides a GUI for editing all collections without code.

---

## Podcast Integration

### Audio

Episodes link directly to Buzzsprout-hosted MP3 files. The persistent audio player at the bottom of every page:

- Survives page navigation via Astro's `transition:persist` directive
- Controls: play/pause, 15-second skip forward/back, progress scrubber, volume, minimize
- State persisted in `sessionStorage`
- Triggered by `CustomEvent('play-episode')` dispatched from play buttons site-wide
- Reattaches event listeners after view transitions via `astro:after-swap`

### RSS Feed

`/rss.xml` generates a fully compliant podcast RSS feed with:

- **iTunes namespace** — author, owner, image, categories (Society & Culture, Arts > Visual Arts, Health & Fitness > Mental Health), explicit flags, episode types, duration
- **Podcast Index namespace** — `podcast:locked`
- **Content namespace** — `content:encoded` with rendered markdown show notes
- **Enclosures** — audio URL, file size, MIME type for each episode

Convenience redirects: `/podcast`, `/feed`, `/rss` all 301 to `/rss.xml`.

---

## Design System

### Brand Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Pink | `#eaa8a3` | `--color-pink` | Accents, highlights, dividers |
| Black | `#1f0300` | `--color-black` | Primary text, dark backgrounds |
| Dark Red | `#9a0201` | `--color-dark-red` | CTAs, links, headings |
| White | `#fdfafa` | `--color-white` | Page backgrounds |
| Light Red | `#b90100` | `--color-light-red` | Hover states, active states |

### Typography

- **Display**: Bitter (serif) — headings, logo
- **Body**: Source Sans 3 (sans-serif) — body copy, navigation, UI
- Fluid scale using `clamp()` from `--text-xs` (0.75rem) to `--text-4xl` (3.75rem)

### Motion

- Scroll-triggered fade-up entrances via `IntersectionObserver` (one-shot, disconnects after triggering)
- Staggered child animations with incremental `transition-delay`
- Micro-interactions: button lift on hover, card elevation, link color transitions
- SVG motif dividers with geometric patterns
- All motion respects `prefers-reduced-motion: reduce`

---

## Performance

- **Build output**: ~350KB total (22 pages)
- **Build time**: <1 second
- **Zero client-side JS by default** — Astro ships no JavaScript unless a component explicitly opts in
- **Static HTML** — pre-rendered at build time, served from Cloudflare's edge CDN
- **Font strategy**: Google Fonts (dev) / self-hosted WOFF2 (production) with `font-display: swap`
- **Lazy loading**: images below the fold, Google Form iframe via `IntersectionObserver`

---

## Security

- **No database** — zero SQL injection, zero data breach risk
- **No server runtime** — no RCE, no SSRF, no session hijacking
- **Cloudflare headers** (`public/_headers`):
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Immutable asset caching** — fonts and built assets cached for 1 year

---

## SEO & Accessibility

- Unique `<title>` and `<meta name="description">` per page
- Open Graph and Twitter Card meta tags
- Canonical URLs
- Auto-generated `sitemap-index.xml` via `@astrojs/sitemap`
- RSS autodiscovery `<link>` in `<head>`
- `robots.txt` with sitemap reference
- Skip-to-content link
- ARIA landmarks (`<main>`, `<nav>`, `<footer>`)
- Labeled audio controls and form inputs
- `focus-visible` outlines on all interactive elements
- `<html lang="en">`

---

## Development

### Prerequisites

- Node.js >= 22.12.0

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview production build locally
```

### Content Management (Decap CMS)

For local CMS development:

```bash
npx decap-server     # Start local CMS backend (in a separate terminal)
npm run dev          # Start dev server
```

Then visit `http://localhost:4321/admin/` to manage content through the GUI.

---

## Deployment (Cloudflare Pages)

1. Connect this repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variable: `NODE_VERSION=22`
5. Add custom domain and configure DNS (CNAME records from GoDaddy, or transfer nameservers to Cloudflare)

Every push to `main` triggers an automatic rebuild and deploy.

---

## Content Workflow

1. Staff logs into `/admin` (Decap CMS)
2. Edits content through the GUI (episodes, staff, pages)
3. CMS commits changes to this GitHub repository
4. Cloudflare Pages detects the push and auto-rebuilds (1-2 minutes)
5. Updated site is live on the CDN

No developer needed for routine content updates.

---

## License

All code and content in this repository is the property of the Inchunwa Project. All rights reserved.
