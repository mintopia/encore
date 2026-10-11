---
name: Encore
description: The Quiet Hi-Fi. A calm, legible console and docs site for a set-and-forget Spotify Connect speaker.
colors:
  reef-teal: "#0d9488"
  deep-reef: "#0f766e"
  sea-glass: "#e2f5f1"
  warm-paper: "#edece8"
  card-white: "#ffffff"
  soft-paper: "#fbfbf9"
  hairline: "#e9e9e5"
  field-stroke: "#dcdcd7"
  ink: "#1b1b1a"
  graphite: "#6d6d68"
  pencil: "#78776f"
  ok-green: "#16a34a"
  ok-tint: "#eafaf0"
  bad-red: "#dc2626"
  bad-tint: "#fdeaea"
  warn-amber: "#b45309"
  warn-amber-deep: "#92400e"
  warn-tint: "#fdf3e7"
  lagoon-teal: "#2dd4bf"
  mint-glow: "#5eead4"
  lagoon-tint: "rgba(45, 212, 191, .18)"
  night-slate: "#0b0f16"
  deep-slate: "#10161f"
  slate-card: "#161e2b"
  slate-hairline: "#273241"
  slate-stroke: "#37455a"
  frost: "#eef2f8"
  mist: "#a8b6c8"
  haze: "#8695a8"
  ok-green-dark: "#4ade80"
  ok-tint-dark: "rgba(74, 222, 128, .14)"
  bad-red-dark: "#fb7185"
  bad-tint-dark: "rgba(251, 113, 133, .15)"
  warn-amber-dark: "#fbbf24"
  warn-amber-deep-dark: "#f59e0b"
  warn-tint-dark: "rgba(251, 191, 36, .14)"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  display-docs:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.07em"
rounded:
  control: "10px"
  control-lg: "12px"
  card: "16px"
  hero: "20px"
  pill: "20px"
spacing:
  unit: "4px"
  grid-gap: "16px"
  card-padding: "22px"
  page-padding: "24px"
components:
  button:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    typography: "{typography.body}"
  button-primary:
    backgroundColor: "{colors.reef-teal}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.control}"
  button-primary-hover:
    backgroundColor: "{colors.deep-reef}"
    textColor: "{colors.card-white}"
  field:
    backgroundColor: "{colors.soft-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  pill-set:
    backgroundColor: "{colors.sea-glass}"
    textColor: "{colors.deep-reef}"
    rounded: "{rounded.pill}"
  nav-item-active:
    backgroundColor: "{colors.sea-glass}"
    textColor: "{colors.deep-reef}"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.card}"
    padding: "22px"
---

# Design System: Encore

## Overview

**Creative North Star: "The Quiet Hi-Fi"**

Encore looks like a well-made piece of hi-fi: calm, precise and legible, with the brand in
the details rather than the decoration. It's built to be set up once and left alone, so
nothing shouts. Teal is the only accent, surfaces are quiet, and the one bright, elevated
surface is the music itself (the Now Playing hero).

The system covers two surfaces that share one set of tokens:

- **The console** (`src/web-vue/`): an **Operate**-mode operator console with Now Playing,
  Lyrics, Settings (master-detail), Debug, Login/Setup and the transparent Lyrics Overlay.
  Scanability, consistency and native expectations outrank expression. **This file is the
  visual source of truth for `src/web-vue/`; build to it.** The SPA is a multi-page app
  (vue-router, history mode), and the shipped implementation is authoritative for structure.
  The static mockups in `docs/design/mockups/` predate the master-detail redesign and are
  historical reference for tokens and mood only.
- **The docs site** (`site/`, VitePress, <https://pimusic.stream/>): **Read** mode for the
  guides, with a **Persuade** home page. It lifts the console's tokens verbatim and maps them
  onto VitePress, so the docs and the app read as one product.

There are **two committed themes**:

- **Light, "Clean & Light":** a warm off-white ground, teal accent, rounded cards and airy
  spacing.
- **Dark, "Cold Glass":** a cold slate/ink ground under cyan/teal ambient blooms. Data cards
  are translucent glass that **lift** off the ground, and the now-playing hero is a deep
  cold-ocean panel. Deliberately cold (blue-cold), never warm charcoal.

**Key Characteristics:**
- One accent (teal), used for action, selection and state, never decoration.
- Two committed themes that share every token name.
- Depth is lifted: soft shadows in light, raised glass in dark.
- Space Grotesk for display and numerics, Instrument Sans for everything else.
- Phosphor fill icons throughout, with the bold music-notes glyph as the brand mark.

## Colors

A warm-paper neutral ground with a single reef-teal accent in light, and a cold night-slate
ground with a brighter lagoon teal in dark.

Light is declared on bare `:root`. Dark redefines the same token names under
`:root[data-theme="dark"]` in the console (and under `.dark` in the docs site). A pre-paint
bootstrap in every console HTML shell (`index/login/setup.html`) sets `data-theme` from
`localStorage['soloist-theme']` before first paint, so there's no theme flash and **all**
surfaces, auth included, honour the choice. The canonical CSS lives in
`src/web-vue/styles/tokens.css` (`--bg`, `--card`, `--sub`, `--line`, `--line2`, `--txt`,
`--dim`, `--faint`, `--ind`, `--ind-h`, `--ind-s`, `--link`, `--ok`, `--ok-s`, `--bad`,
`--bad-s`, `--warn`, `--warn-h`, `--warn-s`, `--sans`, `--disp`, `--sh`, `--sh2`, `--bar`,
`--savebar`).

### Primary
- **Reef Teal** (`--ind`, light): the accent as a fill. Primary buttons, toggles in the on
  state, progress, focus rings, the brand tile.
- **Deep Reef** (`--ind-h` and `--link`, light): hover for teal fills, and the AA-safe teal
  for text (links, active nav, pills).
- **Sea Glass** (`--ind-s`, light): the soft teal tint behind active nav items, set pills,
  step numbers and icon tiles.
- **Lagoon Teal** (`--ind`, dark), **Mint Glow** (`--ind-h` and `--link`, dark) and
  **Lagoon Tint** (`--ind-s`, dark): the same three roles in the dark theme.

### Neutral
- **Warm Paper** (`--bg`, light) / **Night Slate** (dark): the page ground.
- **Card White** (`--card`, light) / **Slate Card** (dark): cards and buttons.
- **Soft Paper** (`--sub`, light) / **Deep Slate** (dark): fields, sub-surfaces and the docs
  reading surface.
- **Hairline** (`--line`) / **Slate Hairline**: dividers and card borders.
- **Field Stroke** (`--line2`) / **Slate Stroke**: input borders and scrollbar thumbs.
- **Ink** (`--txt`) / **Frost**: primary text.
- **Graphite** (`--dim`) / **Mist**: secondary text.
- **Pencil** (`--faint`) / **Haze**: labels. `--faint` clears AA on labels.

### Status
- **OK green**, **bad red** and **warn amber**, each with a soft tint (`--ok-s`, `--bad-s`,
  `--warn-s`) and, for warn, a deeper hover (`--warn-h`). Dark uses the brighter variants
  and translucent tints.

### Named Rules
**The Text-Teal Rule.** Teal used as **text** (links, active nav, pills) uses `--link`; teal
as a **fill** uses `--ind`. Teal-on-tint text always uses `--link` for AA.

**The Cold Night Rule.** The dark theme is blue-cold slate. Never warm charcoal, and never a
hardcoded light hex in dark.

## Typography

**Display Font:** Space Grotesk (with system-ui)
**Body Font:** Instrument Sans (with system-ui)

**Character:** a geometric, slightly technical display face for headings, the wordmark and
numbers, over a warm, readable sans for everything else. Both load from Google Fonts
(`Instrument Sans` 400/500/600, `Space Grotesk` 500/600/700). Avoid Inter, Roboto and Arial.

### Hierarchy
- **Hero title** (Now Playing, Space Grotesk 700, 30px, -0.02em): the track title.
  Marquee-scrolls when it overflows.
- **Docs hero** (Space Grotesk 700, 52px, line-height 1.06, -0.03em; 40px under 960px, 32px
  under 480px): the docs home headline only, balanced wrapping.
- **Page title** (Space Grotesk 700, 22px, -0.015em): Debug and the auth cards. Docs section
  headings on the home page use 24px.
- **Section / card title** (Space Grotesk 700, 16px, -0.01em): `SectionCard`, every Settings
  detail, Debug and Lyrics panels, and docs home step and feature titles.
- **Body / UI** (Instrument Sans 400/500, 14px): console UI and docs lists. Docs prose uses
  VitePress's reading size at a 65–75ch measure.
- **Section label** (`.lbl` / `.flabel`, Instrument Sans 600, 11px, uppercase, 0.07em,
  `--faint`/`--dim`): console field labels and the docs sidebar group titles.
- **Numeric / time readouts** (Space Grotesk or Instrument Sans 600): tabular figures where
  it matters, including docs tables and step numbers.

### Named Rules
**The One Ramp Rule.** One ramp, applied everywhere. Don't introduce a section heading at a
page-title size; the master-detail makes any drift obvious side by side.

**The Single Card Title Rule.** 16px is the only card-title size. Every detail section
matches.

## Layout

The console uses a 4px base unit. Card padding is 22px, page padding 24–30px and grid gaps
16–18px. The docs site uses VitePress's container (max 1152px with responsive side padding),
and its home sections sit inside that container with no padding of their own.

### Surfaces & navigation (console)

**Top bar** (sticky, glass `--bar`): wordmark, nav, mini-player and menu. **The top-level nav
is four items: Now Playing, Lyrics, Settings and Debug.** The active tab is prefix-matched, so
a `/settings/*` deep link lights **Settings**. **Snapweb**, the theme toggle, log-out and
live status live in the **hamburger menu**. **On mobile (under 860px) the bar collapses to
hamburger-only**: the nav sections move into the menu and the mini-player is hidden.

- **Now Playing** (`/`): the **hero** (a deep cold-ocean panel in dark, deep indigo to plum
  in light; the one elevated focal surface, with teal/cyan blooms, a glossy tile, slim teal
  progress with a round handle, circular transport and teal volume) stacked above the
  **Up next** dark queue rail (count badge, then art thumb, title, artist and duration rows).
  Centred in a ~720px column.
- **Lyrics** (`/lyrics`): the Overlay config (Layout, Text, Motion & FX) beside a **live
  preview** on a transparency checkerboard showing the real karaoke render.
- **Settings** (`/settings`): **master-detail**. A `.navi` sidebar (Title Case labels:
  Soloist, Audio Outputs, Snapcast, Webhooks, WebSocket Relay, Web Access; Audio and Snapcast
  are hidden in standalone) beside a `<router-view>` detail pane. Each section is a
  deep-linkable route (`/settings/<section>`, served by the SPA on hard reload) rendering one
  `SectionCard`. `/settings` redirects to the first section.
- **Debug** (`/debug`): dense operator readouts. A frame stream (with empty state), a client
  list (IP, tier pill, auth, uptime, user agent) and a webhook delivery log (status pill,
  event, latency in ms, timestamp). Monospace is for data and measurements only.
- **Login / Setup**: a centred auth card (`AuthShell`) with a 22px title and a single primary
  CTA. Honours the dark theme through the shell's pre-paint bootstrap.
- **Lyrics Overlay**: transparent, with a bottom-centred stack. The current line is large
  Space Grotesk 700 in white with a glow and dark stroke; neighbouring lines are dimmed.
  Anchor, size, colour and effect come from the Overlay config.

### Docs site

- **Home** (Persuade): a two-column hero (headline, lead and actions on the left; the real
  Now Playing panel on a night-slate stage on the right) that stacks under 960px. Then
  "Three steps to music" (three columns with hairline separators, one column under 760px),
  the Compose file, and "What you get" (a two-column feature list with hairline row
  dividers, one column under 760px).
- **Guides** (Read): VitePress's sidebar, content column and "On this page" outline. Setup
  instructions use numbered steps with teal-tint number discs.

## Elevation & Depth

Depth is **lifted**. Light uses solid cards with soft shadows. Dark uses translucent glass
that rises above the ground. The Now Playing hero is the one elevated focal surface.

**Ambient blooms.** The body paints low-opacity teal/cyan radial clouds (colder and larger in
dark) so glass surfaces have something to refract. The docs home page paints the same kind of
blooms behind the hero.

**Card elevation, per theme:**
- **Light:** solid `--card` with a soft `--sh`. Data cards stay solid for legibility.
- **Dark:** a translucent light film (`rgba(148,163,184,.06–.13)`) over a semi-opaque slate,
  blurred, with a bright top hairline (`inset 0 1px 0 rgba(255,255,255,.12)`) and a real
  dropped shadow. The film is **lighter than `--bg`**, so cards read as *raised*, never darker
  than the ground.

### Shadow Vocabulary
- **Rest** (`--sh`): cards at rest.
- **Floating** (`--sh2`): floating panels (menu, auth) and docs screenshots.
- **Glass chrome** (`--bar`, `--savebar`, with backdrop blur): the sticky top bar and the save
  bar. The docs nav bar uses `--bar` with a 14px blur.

### Named Rules
**The Declare-Once Rule.** Declare elevation once: never a 1px border under a wide soft
shadow.

**The Glass-Needs-Ground Rule.** Glass never floats over a flat fill. Where there's glass,
there are blooms behind it.

## Shapes

Soft, consistent rounding. Cards have 16px corners, controls 10–12px, pills 20px, and the
hero and queue 20px. Borders are 1px: `--line` for dividers and cards, `--line2` for inputs.
Album art and icon tiles are rounded squares, and transport buttons and step numbers are
circles.

## Components

### Buttons
Quiet and solid.
- **Shape:** gently rounded (10px).
- **Default:** 13px 600 (14px on the docs home), `--card` background with a `--line2` border.
  Hover shifts the border and text to teal.
- **Primary** (`.btn.pri`): teal fill with white text (dark text on the brighter dark-theme
  teal in the docs). Hover uses `--ind-h`.
- **External link:** text link in `--link` with a `PhArrowUpRight` glyph.

### Status pill (`.pill`)
12px 600, 20px radius, a soft-tint background with a solid foreground per status, and an 8px
leading dot.

### Toggle (`.sw`)
A 38×22 track with an 18px knob. On is `--ind`. Off is `#d7d7d1` in light and
`rgba(255,255,255,.16)` in dark.

### Inputs / Fields
- **Style:** `--sub` background, `--line2` border, 10px radius.
- **Read-only** (`.field.ro`): token-driven per theme.
- **Secrets** (`SecretRow`): never render a stored value. Show a set/unset pill with View
  (where allowed) and Replace. While replacing, the placeholder says whether an empty save
  clears the secret.

### Cards / Containers (`.card` / `SectionCard`)
- **Corner style:** 16px.
- **Shadow strategy:** see Elevation & Depth.
- **Padding:** 22px.
- `SectionCard` is the one card-title primitive: `title`, an optional `subtitle` and an
  optional right-aligned `#action` slot (for example Audio's "Refresh sinks"). Every Settings
  detail section renders through it, so titles are identical.

### Navigation
- **Master-detail sidebar** (`.navi`): 13px 600 `--dim`. The active item (`.navi.act`) has an
  `--ind-s` background and **`--link`** text. A sticky column on desktop and a horizontal
  scroller on mobile.
- **Docs nav and sidebar:** glass top bar. Sidebar group titles use the section-label style,
  and the active page uses `--link`.

### Banner (pending restart)
A `--warn-s` background with a warning border and the primary action in `--warn`.

### Marquee
A single-line ping-pong scroll for overflowing titles (hero and mini-player), with a
both-edge fade mask applied **only while overflowing**. Honours `prefers-reduced-motion`.

### LoadingState
A centred spinner (a 26px teal `--ind` ring, 0.7s linear rotation, slowed to 1.6s under
`prefers-reduced-motion`) with a "Loading…" label below. Includes `role="status"` and
`aria-live="polite"`. Used for the initial load in every detail pane (Settings, Webhooks,
Audio, Lyrics) through the shared `LoadingState.vue` component (ADR-0023).

### Icons
[Phosphor](https://phosphoricons.com) via `@phosphor-icons/vue` (ADR-0021), sized 16–19px in
chrome and controls. **`weight="fill"` everywhere**, except the brand mark
(`PhMusicNotesSimple`, `weight="bold"`). Never hand-author inline SVGs or use emoji/Unicode
glyphs, and give external links a `PhArrowUpRight` glyph. Named icons in use include
`PhSpotifyLogo` (Soloist), `PhSpeakerHifi` (Audio), `PhBroadcast` (Snapcast),
`PhWebhooksLogo`, `PhPlugs` (relay), `PhLock` (web access), `PhTerminal` (Debug),
`PhSlidersHorizontal` (console) and `PhMicrophoneStage` (lyrics). The docs site uses the same
package.

### Now Playing hero (signature)
The console's focal surface: a cold-ocean panel in dark and indigo to plum in light, with
blooms, a glossy art tile, slim teal progress, circular transport and a teal volume bar. On
the docs home it appears as a real screenshot crop on a night-slate stage (20px radius,
inner top hairline, fading out at the bottom).

### Docs home blocks
- **Steps:** three numbered links with teal-tint number discs (32px, tabular figures), a
  16px title and a 14px `--dim` line, separated by hairlines rather than boxed.
- **Feature list:** two columns of rows, each a 38px `--ind-s` icon tile with a Phosphor fill
  icon in `--link`, a 16px title and a 14px `--dim` description, with hairline row dividers.
- **Sponsor button:** the primary button style, linking to GitHub Sponsors.

## Do's and Don'ts

### Do:
- **Do** keep both themes committed. The default is light, the user opts into dark, and the
  choice persists in `localStorage['soloist-theme']`. Dark is a full palette and glass
  treatment, but it reuses every token *name*, so components stay theme-agnostic.
- **Do** route every new config surface through `SectionCard` with the 16px title.
- **Do** theme browser surfaces from the palette: `::selection`, the caret, `accent-color`,
  focus rings and custom scrollbars all use `--ind`/`--line2`, never browser defaults.
- **Do** copy token values verbatim from `src/web-vue/styles/tokens.css` when styling a new
  surface, including the docs site.
- **Do** use real product screenshots for imagery.

### Don't:
- **Don't** render a secret value. Show a set/unset pill or a masked field with a Replace
  action.
- **Don't** introduce a bespoke `<h1>` or a second card-title size.
- **Don't** put a 1px border under a wide soft shadow.
- **Don't** float glass over a flat fill.
- **Don't** use Inter, Roboto or Arial, emoji or Unicode glyphs as icons, or hand-authored
  inline SVGs.
- **Don't** use warm charcoal or hardcoded light hexes in the dark theme.
- **Don't** use teal as decoration. It marks action, selection and state.
- **Don't** use gradient text, kicker or eyebrow labels above headings, or grids of
  identical icon cards.
