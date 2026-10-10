# Portfolio

A personal portfolio with two modes in one page. By default it is a scrolling
document over a live 3D starfield. A control-bar toggle turns it into physics
mode: an infinite canvas where the cards, chips and headings become rigid
bodies you can pan, zoom, drag and throw. Both modes read the same content and
the same DOM, and the page is fully readable with JavaScript disabled.

Next.js (App Router), React, TypeScript, Tailwind, three.js, matter-js, pnpm.

## Running it

Node 20.9 or newer, and pnpm (the version is pinned in `package.json`).

```bash
pnpm install     # also installs the git hooks, via the prepare script
pnpm dev
```

`pnpm dev` starts two processes side by side:

- Next on <http://localhost:3000>
- the live-presence websocket server on port 3001

Presence is optional. With its server stopped the site behaves exactly as it
does with it running, minus the cursors — so `pnpm dev:next` alone is fine.

## Configuration

Copy `.env.example` to `.env.local`. Everything has a working default for
local development.

| Variable                    | Default                 | Used for                                 |
| --------------------------- | ----------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Vercel domain, or local | Canonical URL, sitemap, robots, OG image |
| `NEXT_PUBLIC_PRESENCE_URL`  | unset (presence off)    | The presence websocket, in production    |
| `NEXT_PUBLIC_PRESENCE_PORT` | `3001`                  | The presence websocket, in development   |

## Deploying

Vercel needs no configuration: Next is detected, and `NEXT_PUBLIC_SITE_URL`
falls back to the project's production domain, so it is only required for a
custom domain. Every route prerenders to static output.

`server/presence.mjs` does **not** run on Vercel — it is a long-lived
WebSocket server, and serverless functions cannot hold a socket open. With
`NEXT_PUBLIC_PRESENCE_URL` unset, presence stays off and the site behaves
exactly as it does with the server stopped: no cursors, nothing else missing,
no failing connection attempts. To have it, deploy that one file to a host
that keeps a process alive (Fly, Railway, Render, a VPS) and point
`NEXT_PUBLIC_PRESENCE_URL` at it.

## Content

There is no copy in the components. Everything — text, links, icon names,
image paths and alt text — lives in `src/modules/portfolio/content/*.json`,
typed in `types.ts`. Editing those four files changes the site.

The checked-in content is a placeholder: it reads `Your Name`, points at
`example.com` and uses stock images. Replace it before deploying.

## Scripts

| Script           | What it does                            |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Next plus the presence server           |
| `pnpm build`     | Production build (several minutes)      |
| `pnpm lint`      | oxlint; a warning fails it              |
| `pnpm format`    | oxfmt, including Tailwind class sorting |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit`      |
| `pnpm dev:next`  | Next only                               |
| `pnpm dev:ws`    | The presence server only                |

`pnpm typecheck` runs `next typegen` first on purpose: without it `tsc` cannot
see Next's generated route types and fails on a clone that has never been built.

## Hooks

Husky is installed by `pnpm install`. `pre-commit` formats and lints the staged
files; `pre-push` runs lint, format check and typecheck across the repo.
`pnpm build` is not a hook — it takes minutes — so run it yourself before
calling work done.

## Layout

```
src/app/         route composition, metadata, robots, sitemap, OG image
src/modules/     one folder per feature, each with its own public index.ts
  space/         the three.js starfield
  portfolio/     content, sections and the control bar
  physics/       the matter-js canvas, camera and engine
  presence/      live cursors over a websocket
  mode/          which mode is running
  theme/         light and dark
  shared/        Icon, Reveal, Section, hooks
src/styles/      design tokens
server/          the presence websocket server
```

A module is imported only through its index (`@/modules/physics`), never its
internals — enforced by lint, not convention.

## Rules

Every rule an agent or a contributor needs is in two files:

- [AGENTS.md](AGENTS.md) — working rules, architecture, quality gates, git
- [DESIGN.md](DESIGN.md) — tokens, themes, motion, layout, physics, presence
