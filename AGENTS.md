<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Personal portfolio: server-rendered content that becomes draggable, throwable rigid bodies on a pan/zoom infinite canvas, with a static mode that is the plain document. Stack is Next.js (App Router), React, TypeScript, pnpm.

This file is the single source of rules for every agent. `CLAUDE.md` only imports it and adds Claude Code specifics. Visual and motion rules live in [DESIGN.md](DESIGN.md) — read it before touching any UI, CSS or animation.

## Working rules

- Smallest change that fully solves the task. No unrequested features, abstractions, dependencies or config "for later". Reuse what the repo already has before adding anything.
- Never cut validation, error handling, accessibility or anything the user asked for in the name of brevity.
- Comment only the "why" the code cannot show.
- Verify UI work in a real browser before calling it done, in both themes and at phone width.
- The site has two modes in one page. The default is a scrolling portfolio over a live 3D starfield; a control-bar toggle switches to physics mode, an infinite canvas you pan, zoom and throw things on. Both read from the same content and the same DOM.
- Physics mode is a camera over the document. The canvas is always screen-width: horizontal camera position is derived from the zoom, not panned, and the side walls are repositioned onto the screen edges every camera change. World coordinates are the page’s own layout coordinates, so nothing jumps when it starts. The camera is composed into each body’s transform rather than a wrapper, so React never re-renders during the simulation. `main` is hidden with `visibility: hidden` and each body opts back in, so the canvas shows only the physical objects.
- Module-based structure. Each feature is a folder in `src/modules/` (`space`, `portfolio`, `physics`, `presence`, `mode`, `theme`, `shared`) with its own `components/`, `lib/`, `constants.ts` and an `index.ts` that is its public API. Import another module only through its index (`@/modules/physics`), never its internals. `src/app/` only composes modules.
- Live presence (Figma-style cursors) runs over a plain `ws` server in `server/presence.mjs`, started alongside Next by `pnpm dev`. It is in-memory and anonymous: no accounts, no database, nothing survives a restart. The site works normally when it is not running.
- Everyone shares one coordinate space: the document’s layout coordinates, which are also the physics world’s. That is why a cursor from a phone in physics mode lands correctly on a laptop that is scrolling. Convert only in `src/modules/presence/lib/coords.ts`.
- Prefer a library over hand-rolling: three.js via `@react-three/fiber` and `@react-three/drei` for the starfield, `matter-js` for physics, `@use-gesture/react` for pan/pinch/wheel, `lucide-react` plus `@icons-pack/react-simple-icons` for icons, `next-themes` for theming. Reach for one before writing an engine.
- No hardcoded content in components. All copy, links, icon names and image paths live in `src/modules/portfolio/content/*.json`, are typed in `src/modules/portfolio/types.ts` and are read through `@/modules/portfolio`. Fixed value sets (body kinds, themes) and every tuning number are constants in the owning module's `constants.ts`; never repeat them as literals.
- Tailwind first. Style with utilities built from the tokens (`bg-surface`, `text-muted`, `shadow-lift`, `rounded-card`); write CSS only for what a utility cannot express. Canvas-only styles use the `physics:` variant.
- Physics pins bodies with `position: fixed`, so no ancestor of a `[data-physics]` element may have a transform, filter or backdrop-filter: that would become its containing block and the body would fly off-screen. `Reveal` drops its transform once settled for exactly this reason.
- Content must be readable with JavaScript disabled. Scroll reveals start visible and only hide once JS confirms the element is off-screen.
- Test in a real browser before calling UI work done: both themes, phone width, and physics on and off. Drive it with the `agent-browser` skill, or Chrome over CDP when a test needs low-level pointer events (`agent-browser`'s `move`/`down`/`up` do not dispatch in this environment).
- Run `pnpm lint`, `pnpm format:check`, `pnpm exec tsc --noEmit` and `pnpm build` before calling work done. The production build takes several minutes; run it in the background.

## Skills

Use the skill that matches the task instead of improvising. All of these are installed in `.claude/skills/` and pinned in `skills-lock.json`; the install column is for reinstalling or for other agents (swap `-a claude-code` for your agent).

| Skill | Use it when | Install | Source |
|---|---|---|---|
| `find-skills` | Looking for a skill that might already cover a task | `npx skills add vercel-labs/skills --skill find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md) |
| `grill-me` | Turning a loose idea into a committed plan before building; run it in a fresh conversation | `npx skills add mattpocock/skills --skill grill-me` | [aihero.dev](https://www.aihero.dev/skills-grill-me) |
| `ponytail` | Any coding task: write, fix, refactor, review. Backs the working rules above | `npx skills add DietrichGebert/ponytail --skill ponytail`; optional Claude Code plugin in `CLAUDE.md` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/main/skills/ponytail) |
| `agent-browser` | Driving a browser: open the dev server, click, screenshot, test a flow | `npm i -g agent-browser && agent-browser install`, then `agent-browser skills get core` | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser/blob/main/skills/agent-browser/SKILL.md) |
| `frontend-design`, `webapp-testing` | Building new UI; testing the running app. The same repo also has `theme-factory`, `canvas-design`, `skill-creator` and others | `npx skills add anthropics/skills --skill <name>` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills) |
| `vercel-react-best-practices` | Writing or reviewing React/Next.js code for performance: waterfalls, bundle size, re-renders | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `emil-design-eng`, `animate`, `review-animations`, `find-animation-opportunities`, `mobile-native`, `break-ui`, `prototype` | Motion and interaction polish: easing, duration, which properties to animate, native feel on mobile, stress-testing UI with edge-case content | `npx skills@latest add emilkowalski/skills` | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| `design-taste-frontend` (taste-skill) | Keeping generated UI from looking generic; `redesign-skill` for auditing existing screens | `npx skills add Leonxlnx/taste-skill --skill design-taste-frontend` | [tasteskill.dev](https://www.tasteskill.dev/) |
| `hairline-create` | Drawing a standalone interactive figure or diagram as one HTML file | `npx skills add lucasmarkes/hairline` | [hairline](https://hairline.lucasmarkes.com/skill) |
| `nextjs-turbopack`, `react-patterns`, `react-performance`, `frontend-a11y`, `seo`, `e2e-testing`, `make-interfaces-feel-better`, `verification-loop` | Next.js/React structure, render performance, accessibility, the SEO and Lighthouse targets, Playwright end-to-end tests, and a build/lint/test check before calling work done | `npx skills add affaan-m/ecc --skill <name>`, or from a clone `./install.sh --target claude --skills <name>` | [affaan-m/ecc](https://github.com/affaan-m/ecc) |

The multi-skill sources (anthropics, emilkowalski, taste-skill, ECC) hold far more than is listed; only the ones this project needs are picked. Do not run a full install such as `npx ecc-universal setup` — ECC alone ships about 300 skills plus agents and hooks, almost all for other stacks. Add another skill from those repos only when a task calls for it, and list it here.

When a design skill's advice conflicts with [DESIGN.md](DESIGN.md), DESIGN.md wins.
