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
- The site has two modes in one page. The default is a scrolling portfolio over a live 3D starfield; a control-bar toggle switches to physics mode, an infinite canvas you pan, zoom and throw things on. Both read from the same content and the same DOM.
- Physics mode is a camera over the document. The canvas is always screen-width: horizontal camera position is derived from the zoom, not panned, and the side walls are repositioned onto the screen edges every camera change. World coordinates are the page’s own layout coordinates, so nothing jumps when it starts. The camera is composed into each body’s transform rather than a wrapper, so React never re-renders during the simulation. `main` is hidden with `visibility: hidden` and each body opts back in, so the canvas shows only the physical objects.
- Module-based structure. Each feature is a folder in `src/modules/` (`space`, `portfolio`, `physics`, `presence`, `mode`, `theme`, `shared`) with its own `components/`, `lib/`, `constants.ts` and an `index.ts` that is its public API. Import another module only through its index (`@/modules/physics`), never its internals. `src/app/` only composes modules.
- Live presence (Figma-style cursors) runs over a plain `ws` server in `server/presence.mjs`, started alongside Next by `pnpm dev`. It is in-memory and anonymous: no accounts, no database, nothing survives a restart. The site works normally when it is not running.
- Everyone shares one coordinate space: the document’s layout coordinates, which are also the physics world’s. That is why a cursor from a phone in physics mode lands correctly on a laptop that is scrolling. Convert only in `src/modules/presence/lib/coords.ts`.
- Prefer a library over hand-rolling: three.js via `@react-three/fiber` and `@react-three/drei` for the starfield, `matter-js` for physics, `@use-gesture/react` for pan/pinch/wheel, `lucide-react` plus `@icons-pack/react-simple-icons` for icons, `next-themes` for theming. Reach for one before writing an engine.
- No hardcoded content in components. All copy, links, icon names and image paths live in `src/modules/portfolio/content/*.json`, are typed in `src/modules/portfolio/types.ts` and are read through `@/modules/portfolio`. Fixed value sets (body kinds, themes) and every tuning number are constants in the owning module's `constants.ts`; never repeat them as literals. The one split: `physics/constants.ts` holds the structural and camera numbers, `physics/lib/feel.ts` holds the material feel (gravity, restitution, friction, density, throw clamp, shake) and imports from it.
- Tailwind first. Style with utilities built from the tokens (`bg-surface`, `text-muted`, `shadow-lift`, `rounded-card`); write CSS only for what a utility cannot express. Canvas-only styles use the `physics:` variant.
- Physics pins bodies with `position: fixed`, so no ancestor of a `[data-physics]` element may have a transform, filter or backdrop-filter: that would become its containing block and the body would fly off-screen. `Reveal` drops its transform once settled for exactly this reason. A `backdrop-blur` surface is fine on the body element itself — `ProjectCard` does exactly that — but never on a section that wraps bodies.
- Content must be readable with JavaScript disabled. Scroll reveals start visible and only hide once JS confirms the element is off-screen.
- Test in a real browser before calling UI work done: both themes, phone width, and physics on and off. Drive it with the `agent-browser` skill. Its `move`/`down`/`up` do not dispatch in this environment, so a test that needs real pointer events — dragging and throwing a body is the only such test here — needs Chrome started with `--remote-debugging-port=9222` and driven over CDP directly. There is no committed helper for that yet; write one if you do it twice.
- Several review agents can share the repo, but only one can hold the dev server. Give the others a static review, or start the server yourself and tell them the port.
- Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck` and `pnpm build` before calling work done. The production build takes several minutes; run it in the background. `pnpm typecheck` runs `next typegen` first: without it `tsc` cannot see Next's generated route types (`LayoutProps`, `PageProps`) and fails on a clone that has never been built.

## Quality gates and git hooks

- Husky installs the hooks from the `prepare` script on `pnpm install`. On a fresh clone, install before committing or there are no hooks.
- `pre-commit` runs `lint-staged`: `oxlint --fix` then `oxfmt` on staged JS/TS, `oxfmt` on staged JSON, CSS, Markdown and YAML. It restages what it fixed, so a commit can differ from what you staged — re-read the diff after committing.
- `pre-push` runs the whole-repo gates: `oxlint`, `oxfmt --check`, `pnpm typecheck`. `pnpm build` is deliberately not a hook because it takes minutes; run it yourself.
- Never pass `--no-verify` and never unset `core.hooksPath` to get a commit through. A failing hook is a bug to fix, not a gate to route around.
- `.github/workflows/ci.yml` runs the same gates on every push and pull request, and is the only place `pnpm build` runs automatically. It is the backstop for a push that skipped the hooks, not a substitute for running them.
- Hooks are plain shell in `.husky/`: one command per line, no shebang and no `husky.sh` sourcing (both removed in husky 9). A new gate is a new line there, not a wrapper script.
- `pnpm e2e` (`scripts/e2e.mjs`) asserts routes, server-rendered content, the URLs deliberately kept off this site, SEO, JSON-LD and the asset pipeline over HTTP. Run it against a **production** server, not `next dev`: `pnpm build && pnpm start`, then `pnpm e2e http://localhost:3000`. It is not wired into CI because it needs a running server.
- `scripts/e2e-browser.js` is the other half — overflow, tap targets, image upscaling, heading order, list semantics and focus visibility — and needs a real layout. Run it through the `agent-browser` skill: `agent-browser open <url>` then `agent-browser eval "$(cat scripts/e2e-browser.js)"`. Check desktop and phone widths.
- There is still no unit-test suite, so `verification-loop`'s coverage phase is N/A — say so rather than inventing a result.
- `pnpm lint` is `oxlint --max-warnings 0`, so a warning fails the gate, not just an error. The `correctness` category is on, and `no-restricted-imports` enforces the module-boundary rule above — a cross-module deep import fails the build, it is not a review comment. Lint still cannot see most accessibility problems: only six `jsx-a11y` rules exist and none of them covers keyboard paths, focus order or contrast. Use the `a11y-reviewer` agent for that, not `pnpm lint`.

## Line endings

- Text is LF in the repository and in every working tree, Windows included. `.gitattributes` sets `* text=auto eol=lf`, which overrides whatever `core.autocrlf` a machine has set globally, so no per-clone git config is needed.
- `.editorconfig` states the same rule for editors that are not VS Code; `.vscode/settings.json` sets `files.eol` for the ones that are.
- Never commit CRLF. It fails `pnpm format:check` and turns the file's next diff into a whole-file rewrite. `git ls-files --eol` must read `i/lf w/lf` for every text file; `git add --renormalize .` repairs an index that drifted.
- A new binary extension needs a `binary` line in `.gitattributes`, or git will try to normalise it.

## Git

- Do not commit or push unless asked. When asked, branch off `main` rather than committing onto it.
- Keep the `nextjs-agent-rules` block at the top of this file in the same commit as your work. `next dev` rewrites it, so dropping it only re-creates the uncommitted change.
- One commit per coherent change, imperative subject, body only for the "why".

## Metadata and SEO

- `metadata` and `viewport` in `src/app/layout.tsx` read from `site.meta` in `src/modules/portfolio/content/site.json`. Titles, descriptions, canonical URL and OG/Twitter fields go there, never inline in the layout.
- One `h1` on the page, section headings in order below it, all from the content JSON.
- Images go through `next/image` with explicit `width`/`height` (or `fill` over a fixed aspect ratio — a physics body needs stable dimensions) and real `alt` text from the content JSON. Decorative images take `alt=""`.
- Anything a crawler needs must be in the server HTML. Verify with `curl -s localhost:3000`, not the devtools inspector. Physics mode's `visibility: hidden` on `main` must be applied at runtime and never ship in the server response.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `icon.tsx` and `apple-icon.tsx` exist and all read `SITE_URL` from `@/modules/portfolio`. That resolves `NEXT_PUBLIC_SITE_URL`, which **must** be set in the deploy environment: unset, every canonical and absolute URL points at localhost.
- `public/og.png` and `public/screenshots/*.png` are **captures of the live site**, not drawn in code, so they go stale after any visual change to the hero. Regenerate them from a production server (`pnpm build && pnpm start`) so the dev badge and presence bar are not in the shot: the Open Graph image is the home page at 1440×756 scaled to 1200×630, the manifest screenshots are 1280×720 and 390×844 — the sizes in `OG_IMAGE` and `SCREENSHOTS` (`portfolio/constants.ts`). The image is named in `metadata` rather than left to the `opengraph-image` file convention: a route that sets its own `openGraph`, as `/resume` does, drops an inherited file-based image, so each such route must restate `images`.
- Structured data is one `Person` graph with the projects as `CreativeWork`, built in `portfolio/lib/structured-data.ts`. It is injected inline, so the `<` escaping in that file is load-bearing — a `</script>` inside any content string would close the tag early.
- `public/portrait-cutout.webp` is **generated** from `public/portrait.jpg`, not a separate photo: the background removed with `rembg` (`isnet-general-use`, alpha matting), trimmed to the subject, warmed down by about 5% red and up 8% blue to pull the street-light cast out, then saved as WebP at quality 90. It is the hero portrait; `portrait.jpg` stays the source of truth and is what the nav avatar, the résumé page and the generated icons use. Replace the photo and both have to be redone. The tool is not a project dependency — it was run once through `uv run --with rembg --with onnxruntime --with pymatting`.
- `public/sarvjeet-thakur-resume.pdf` is **generated**, not hand-made: it is `/resume` printed to PDF, so it carries the same content as the page and none of the client URLs kept off this site. Regenerate it after changing `resume.json`, `projects.json`, `stack.json` or `about.json`, or the download drifts from the page: with the dev server up, `agent-browser open http://localhost:3000/resume` then `agent-browser pdf public/sarvjeet-thakur-resume.pdf`.
- Anything in `public/` is served to the whole internet whether the repo is private or not. A file is not protected by repo visibility — check what is inside it before adding it.
- Tenure is derived, never typed: `career.startDate` in `site.json` is the only place a start date lives, the hero stat renders `{years}` from `yearsSince()` at build time, and the prose says "since 2022" so it cannot go stale. Do not reintroduce a hardcoded year count — it was previously written out in four separate files.

## Environment

- Three variables, all in `.env.example`, all `NEXT_PUBLIC_` because the browser needs them: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRESENCE_URL` and `NEXT_PUBLIC_PRESENCE_PORT`. `.gitignore` ignores `.env*` but un-ignores the example, so keep it committed and in step.
- `NEXT_PUBLIC_SITE_URL` falls back to Vercel's own production-domain variable, so a deploy that forgets it still gets a correct canonical. A custom domain still needs it set.
- `NEXT_PUBLIC_PRESENCE_PORT` is read by `server/presence.mjs` and by `presence/constants.ts`. One name on purpose: a server-only variable meant setting it broke presence silently, because the client kept its hardcoded default.
- Presence is off unless `NEXT_PUBLIC_PRESENCE_URL` is set, and that is the right default. It needs a long-lived WebSocket server, which Vercel cannot run; the old code guessed a port on the page's own host, so every visitor and every crawler opened a handshake that could only fail. In development the URL is derived from the host, so `pnpm dev` still needs no configuration.
- The presence server binds `0.0.0.0` so a phone on the LAN can join. A WebSocket handshake is not subject to CORS, so it checks the `Origin` against localhost and the private ranges. Everything arriving on that socket is relayed to every other viewer: validate each field against a fixed shape, never merely length-cap it.

## Accessibility targets

- WCAG 2.2 AA. Body text at 4.5:1 and UI borders at 3:1 against the background they actually sit on, in both themes. The translucent glass surfaces are where this breaks.
- A visible focus ring on every interactive element in both themes. Never remove an outline without replacing it.
- Physics mode is pointer-driven, so every piece of content and every action needs a keyboard path in static mode, and leaving physics mode must be reachable from the keyboard.
- `prefers-reduced-motion` covers the whole page, not just the starfield: reveals, the mode transition and the throw and shake gestures each need a reduced path that still leaves the page usable.
- Presence cursors are decorative: `aria-hidden`, never focusable, never announced.

## Skills

Use the skill that matches the task instead of improvising. All of these are installed in `.claude/skills/` and pinned in `skills-lock.json`; the install column is for reinstalling or for other agents (swap `-a claude-code` for your agent).

| Skill | Use it when | Install | Source |
|---|---|---|---|
| `find-skills` | Looking for a skill that might already cover a task | `npx skills add vercel-labs/skills --skill find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md) |
| `grill-me` | Turning a loose idea into a committed plan before building; run it in a fresh conversation. Explicit `/grill-me` only | `npx skills add mattpocock/skills --skill grill-me` | [aihero.dev](https://www.aihero.dev/skills-grill-me) |
| `ponytail` | Any coding task: write, fix, refactor, review. Backs the working rules above | `npx skills add DietrichGebert/ponytail --skill ponytail`; optional Claude Code plugin in `CLAUDE.md` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/main/skills/ponytail) |
| `agent-browser` | Driving a browser: open the dev server, click, screenshot, test a flow | `npm i -g agent-browser && agent-browser install`, then `agent-browser skills get core` | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser/blob/main/skills/agent-browser/SKILL.md) |
| `frontend-design`, `webapp-testing` | Building new UI; testing the running app. The same repo also has `theme-factory`, `canvas-design`, `skill-creator` and others | `npx skills add anthropics/skills --skill <name>` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills) |
| `vercel-react-best-practices` | Writing or reviewing React/Next.js code for performance: waterfalls, bundle size, re-renders | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `emil-design-eng`, `animate`, `review-animations`, `find-animation-opportunities`, `mobile-native`, `break-ui` | Motion and interaction polish: easing, duration, which properties to animate, native feel on mobile, stress-testing UI with edge-case content. `review-animations` is explicit `/name` only | `npx skills@latest add emilkowalski/skills` | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| `design-taste-frontend` (taste-skill) | Keeping generated UI from looking generic; `redesign-skill` for auditing existing screens | `npx skills add Leonxlnx/taste-skill --skill design-taste-frontend` | [tasteskill.dev](https://www.tasteskill.dev/) |
| `hairline-create` | Drawing a standalone interactive figure or diagram as one HTML file | `npx skills add lucasmarkes/hairline` | [hairline](https://hairline.lucasmarkes.com/skill) |
| `nextjs-turbopack`, `react-patterns`, `react-performance`, `frontend-a11y`, `seo`, `e2e-testing`, `make-interfaces-feel-better`, `verification-loop` | Next.js/React structure, render performance, accessibility, the SEO and Lighthouse targets, Playwright end-to-end tests, and a build/lint/test check before calling work done | `npx skills add affaan-m/ecc --skill <name>`, or from a clone `./install.sh --target claude --skills <name>` | [affaan-m/ecc](https://github.com/affaan-m/ecc) |

`prototype` (same source) builds several genuinely different versions of a UI piece behind a visual picker; it is explicit `/prototype` only. `animate` and `find-animation-opportunities` both refer to an `improve-animations` skill that is deliberately not installed — ignore those pointers.

The multi-skill sources (anthropics, emilkowalski, taste-skill, ECC) hold far more than is listed; only the ones this project needs are picked. Do not run a full install such as `npx ecc-universal setup` — ECC alone ships about 300 skills plus agents and hooks, almost all for other stacks. Add another skill from those repos only when a task calls for it, and list it here.

When a design skill's advice conflicts with [DESIGN.md](DESIGN.md), DESIGN.md wins.

## Review agents

Project subagents live in `.claude/agents/`. Each one is read-only — it reports findings with `file:line` and a fix, it does not edit — and each preloads the skills its review depends on, so the review is consistent between runs instead of depending on which skill the agent happened to load. Claude Code reads the directory at startup, so a newly added agent needs a restart before `@agent-<name>` resolves.

| Agent | Run it after | Preloads |
|---|---|---|
| `seo-reviewer` | Changing `layout.tsx`, metadata, headings, images or the content JSON; before a deploy | `seo` |
| `a11y-reviewer` | Building or changing any UI, the control bar, the theme toggle, or anything that becomes a physics body | `frontend-a11y` |
| `perf-reviewer` | Adding a component, hook or dependency, or touching the starfield, gesture or physics loop | `react-performance` |
| `design-reviewer` | Building or restyling UI; before calling visual work done | `emil-design-eng`, `make-interfaces-feel-better` |
| `motion-reviewer` | Adding or changing a transition, scroll reveal, gesture or physics tuning value | `review-animations` |

Run them against a change, not against the whole repo, and run several at once — they do not overlap. Only one can hold the dev server, so give the others a static review or start the server yourself first and tell them the port.
