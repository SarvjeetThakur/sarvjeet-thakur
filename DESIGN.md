# Design

Visual and motion rules for the portfolio. Agent workflow rules and the skills list are in [AGENTS.md](AGENTS.md).

## Principles

- **Space is the setting.** A live 3D starfield sits behind the whole page. Everything above it is glass: translucent surfaces, hairline borders, generous dark space. Dark is the default theme because the design is built for it.
- **The content is physical.** In physics mode the cards, chips and headings are rigid bodies with weight. Cards are heavy, chips are light and bouncy.
- **The DOM is the source of truth.** Physics only writes `transform` onto the page's own elements; it never redraws content into a `<canvas>`.
- **Physics is opt-in.** The scrolling portfolio is the default everywhere, including on phones. Nothing is lost if physics never runs.
- **Readable without JavaScript.** Scroll reveals start visible and only hide once JS confirms the element is off-screen.

## Tokens

All visual values live in `src/styles/tokens.css` and are exposed as Tailwind utilities (`bg-surface`, `text-muted`, `border-line`, `shadow-lift`, `shadow-glow`, `rounded-card`, `rounded-chip`). Components use those utilities and never a raw hex.

| Token             | Deep space (default)      | Daylight                 |
| ----------------- | ------------------------- | ------------------------ |
| `--bg`            | `#06070d`                 | `#f4f3f8`                |
| `--surface`       | `rgb(255 255 255 / 4.5%)` | `rgb(255 255 255 / 75%)` |
| `--surface-solid` | `#141725`                 | `#ffffff`                |
| `--fg`            | `#eceef6`                 | `#14131c`                |
| `--muted`         | `#8d93a8`                 | `#5d5b6c`                |
| `--line`          | `rgb(255 255 255 / 10%)`  | `rgb(20 19 28 / 10%)`    |
| `--accent`        | `#7c6cff`                 | `#5b45e0`                |
| `--accent-2`      | `#4dd9ff`                 | `#0a6f90`                |

Surfaces are translucent and rely on `backdrop-blur`, so they read against the starfield rather than covering it. The blur sits on the element itself, never on a section that wraps physics bodies.

A moving body cannot afford that blur — a backdrop filter on something that gets a new transform every frame has to re-sample and re-blur on its own layer, every frame — so in physics mode a body swaps to `--surface-solid`, an opaque equivalent, and drops the blur: `physics:bg-surface-solid physics:backdrop-blur-none`. Dropping the blur on its own is not enough; `--surface` is a 4.5% white wash that only reads as glass because of what is blurred behind it, so without the blur the starfield shows straight through the card. Elements that are _not_ bodies keep their blur: they never move, so they cost nothing. `--lift` and `--glow` carry the elevation; they differ in character per theme, not just in colour.

## Themes

- Dark is the default and is not derived from the OS setting. Light is a deliberate second theme, not an inversion.
- Adding a theme is one `:root[data-theme="<name>"]` block with the full token set, plus its name in `THEMES` (`src/modules/theme/constants.ts`). If anything else has to change, the design is wrong.

## Motion

- The starfield drifts slowly and leans toward the pointer. Under `prefers-reduced-motion`, and while physics is running, it stops rendering altogether rather than merely holding still — a frozen scene redrawn sixty times a second costs the same as a moving one. It drops star count on coarse pointers.
- Sections reveal once on scroll, with a short ease-out on opacity and transform. Nothing loops or idles for attention.
- Physics tuning (gravity, restitution, friction, density, throw clamp, shake) lives in one place: `src/modules/physics/lib/feel.ts`. Structural and camera numbers — wall thickness, zoom limits, grid step, fly duration — are in `src/modules/physics/constants.ts`, which `feel.ts` composes from.
- Hover and focus states animate only `transform`, `opacity` and colour. A transition on an element that is a physics body must name its properties and must not include `transform`, or it will fight the transform the engine writes each frame.
- Camera flies ease over `FLY_DURATION_MS`; under `prefers-reduced-motion` they cut straight to the destination. `shake` is left alone: it is motion the reader explicitly asked for.

## Layout

- One page, one column, max width `6xl`, with a fixed nav at the top and a floating control bar at the bottom.
- The hero fills the viewport. Work alternates two wide featured cards with a two-column grid. About is a two-column split. Contact leads with a large statement.
- Every project card carries a real image, a year, a role, a headline metric and its stack.

## Physics mode

- An infinite canvas over the document: drag empty space or scroll to move up and down, pinch or ctrl+scroll to zoom. The control bar carries the same moves as buttons, because a gesture-only canvas has no keyboard or single-pointer path. A nav link flies the camera to that section; Overview frames the whole world.
- Bodies are the page's own elements, starting exactly where they were laid out, so nothing jumps when physics begins.
- The play area is always exactly the width of the screen. Horizontal position is derived rather than panned, so zooming out makes objects smaller and opens up room on both sides instead of shrinking the space they can move in.
- Each section is a region with its own floor, so its objects pile where they belong. A held body passes through those floors, so anything can be carried to any other section and is adopted by wherever it is dropped.
- Containment guarantees a body can never leave the screen horizontally or its region vertically. The one exception is a body wider than the visible strip, which happens when the zoom is high enough: clamping both of its edges onto a narrower screen has a single solution, so every such body would be pinned to the same x. Its horizontal position is left alone instead — it spans the screen either way.
- Only the physical objects are visible: the page is hidden with `visibility: hidden` and each body opts back in.
- Exiting must restore the DOM exactly: no leftover inline styles, and the page scrolls again.

## Presence

- Anyone on the site shows up as a coloured cursor with their name, eased toward each update so movement reads as smooth rather than stepped.
- Names are chosen, not accounts: a friendly random name on arrival, editable, remembered in `localStorage`.
- The people here are avatars in the control bar. Clicking one jumps to them, switching into their mode first if it differs, so you end up looking at the same thing. The jump waits for the engine rather than guessing at a delay. Initials take a foreground computed from the peer colour, since white fails on the lighter ones.
- Presence is decoration, never a dependency: with the server down the site behaves exactly as it does now.

## Out of scope

Sound, cursor trails, loading screens, scroll-jacking, a second physics mode.
