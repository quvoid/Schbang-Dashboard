# DESIGN.md — Schbang × Creator Ads dashboard

Design system for the client dashboard, based on schbang.com (checked 14 Oct 2026).
Values marked **measured** were read from schbang.com's computed styles; values marked
**sampled** were picked by eye from its hero gradient/blobs; the rest are dashboard additions.

## 1. Brand feel
- Clean, editorial, white-first. Big confident headlines, generous whitespace.
- Near-black ink on white, warm beige-grey surfaces, one bright gradient used sparingly as an accent.
- Rounded, soft cards; pill-shaped controls; no heavy shadows except on hover / overlays.
- Light mode is the default. Dark mode exists but is opt-in (◐ toggle).

## 2. Typography
| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Family | **Sora** (Google Fonts) — measured, schbang.com headings + body | 300–700 | | Fallback: `system-ui, sans-serif` |
| Page title (H1) | Sora | 600 | `clamp(28px, 4.4vw, 48px)` | line-height 1.08, letter-spacing −0.03em |
| Logo | Sora | 700 | 20px | letter-spacing −0.02em; "Schbang" −0.04em |
| Drawer title / creator (H2) | Sora | 600 | 22px | letter-spacing −0.02em |
| KPI number | Sora | 600 | 30px | letter-spacing −0.02em |
| Body / copy | Sora | 400 | 13.5–15px | line-height 1.45–1.6 |
| Labels / buttons | Sora | 500–600 | 13–14px | |
| Section caps (H3) | Sora | 600 | 12px | UPPERCASE, letter-spacing 0.08em, muted colour |
| Micro labels | Sora | 400–500 | 10.5–12px | dropdown label is UPPERCASE 0.08em |

Load:
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
(schbang.com also uses Montserrat and "Neurial Grotesk Bold" in places; the dashboard uses Sora only.)

## 3. Colour tokens
### Light (default)
| Token | Hex | Source | Use |
|---|---|---|---|
| `--bg` | `#ffffff` | measured (body background) | Page background |
| `--ink` | `#121212` | measured | Headlines, primary text, dark buttons |
| `--ink-2` | `#333333` | measured (most common text colour) | Body copy |
| `--muted` | `#838383` | measured | Secondary text, labels, icons |
| `--line` | `#e8e8e8` | measured (`#E8E8E8` borders) | Borders, dividers |
| `--sand` | `#dfdad5` | measured (warm beige-grey) | Focus ring tint, accents |
| `--sand-2` | `#f4f1ee` | derived (lighter sand) | KPI tiles, card header strip, info boxes |
| `--panel` | `#ffffff` | — | Cards, dropdown menus, drawer |
| `--orange` | `#f2552c` | sampled (hero blob) | Active ✓, hook highlight bar |
| `--pink` | `#f0a6d8` | sampled (hero blob) | Avatar colour |
| `--cyan` | `#45c4dc` | sampled (hero blob) | Avatar colour |
| `--yellow` | `#f3e33a` | sampled (hero gradient end) | Avatar colour |
| `--live` | `#1f9d55` | dashboard | "Live / still running" dot |

### Dark (opt-in, `data-theme="dark"`)
| Token | Hex |
|---|---|
| `--bg` | `#0f0f0f` |
| `--ink` | `#f5f3f0` |
| `--ink-2` | `#d9d6d2` |
| `--muted` | `#9a968f` |
| `--line` | `#2a2a2a` |
| `--sand` | `#3a3632` |
| `--sand-2` | `#1b1a19` |
| `--panel` | `#161616` |

### Signature gradient
```css
--grad: linear-gradient(90deg, #a7a39d 0%, #f2552c 30%, #f0a6d8 62%, #f3e33a 100%);
```
Sampled from the schbang.com hero ("AI SEARCH" bar). Use only as a thin accent: the logo pill
(42×10px) and the 6px rule under the page title. Never as a background for text.

### Avatar colours (creator initials)
`#f2552c, #f0a6d8, #45c4dc, #f3e33a, #dfdad5, #c7b8ff` — picked by a stable hash of the
creator name, so a creator always gets the same colour. Initials text is always `#121212`.

## 4. Spacing, radius, elevation
- Page max width **1240px**, side gutter **16px**.
- Grid gap **20px**; KPI gap **12px**; control gap **10px**.
- Radius: cards / KPI tiles **18px**, drawer **22px** (left corners), info boxes **14px**,
  media / footer strip **12px**, icon buttons **12px**, dropdown button **14px**,
  dropdown menu **16px**, pills / primary buttons **999px**.
- Shadows: none at rest. Card hover `0 14px 34px rgba(0,0,0,.08)` + `translateY(-3px)`.
  Dropdown menu `0 18px 40px rgba(0,0,0,.12)`. Drawer `-20px 0 60px rgba(0,0,0,.18)`.
- Overlay backdrop `rgba(10,10,10,.45)` + `blur(2px)`.

## 5. Layout
- **Sticky header** (68px): logo "**Schbang** × Creator Ads" + gradient pill on the left;
  Brand dropdown + ◐ theme toggle on the right. Background = page bg at 92% + `blur(10px)`.
- **Hero**: H1 `"<Brand> · creator partnership ads"`, then the 6px gradient rule.
- **KPI row**: 4 tiles — Unique creatives · Partnership ads · Creators · Average time running.
- **Tools row**: search (pill, magnifier icon) + Sort dropdown.
- **Ad grid**: 3 columns ≥1025px, 2 columns 621–1024px, 1 column ≤620px.

## 6. Components
### Ad card (TrendTrack-style)
1. Rank tab (black, top-left, `0 0 8px 8px` radius).
2. Header strip (`--sand-2`): est. spend · tier · platforms (right-aligned, 12px).
3. Meta row: green dot + `"<days>d · live"`, date range `"12 Oct → now"`; badge `"Used in N ads"` when the same video runs as several ads.
4. Creator row: 38px initials avatar, **creator name** (600), `@handle · with <Brand>` (muted).
5. Ad copy, 2-line clamp + "See more".
6. Media: black box, aspect 9:14, poster image + white 60px play button; plays inline on click.
7. Footer strip (`--sand-2`): domain (11px muted), headline (600), CTA button.
8. Actions: "Ad Library" (ghost pill) + "See details 🔍" (dark pill), grid `1fr 1.4fr`.

### Dropdown (custom, replaces native `<select>`)
- Button: white, 1px `--line`, 14px radius, min-width 170px; small UPPERCASE label ("BRAND" / "SORT") above the value (600, 14px); chevron rotates 180° when open.
- Hover / open: border `--ink` + 3px focus ring in `--sand`.
- Menu: card with 6px padding, items 10×12px, hover `--sand-2`, selected item bold with orange ✓, optional sub-line (e.g. "33 creatives · 50 ads"). Fades/slides in 150ms. Closes on outside click or Esc.

### Buttons
- Primary: `--ink` background, `--bg` text, pill, 600 14px.
- Ghost: white, 1px `--line`, pill.
- Icon button: 40×40, 12px radius, 1px `--line`.
- CTA (inside card footer): white, 1px `--line`, 10px radius, 600 12px.

### Detail drawer ("See details")
- Slides in from the right, `width: min(1180px, 100vw)`, full height, 280ms ease-out.
- Top bar: ‹ prev · `3/39` counter · next ›, platform pill ("Facebook • Instagram +1 • Video"), ✕ close; right side: copy-ad-copy, copy-link, download, dark "See in Ad Library ↗". ← / → keys navigate.
- Body: left = ad preview on `--sand-2` stage with zoom (− 100% +); right (440px) = tabs **Ad details · Creative analysis · Transcript · Copy & variants**.
- Ad details uses key–value boxes (`--sand-2`, 14px radius): Performance signals, Creator, Creative & links. Keys muted with 16px line icons, values 600 right-aligned, links blue `#2563eb`.
- Hook paragraph gets a 4px `--orange` left bar.
- ≤900px: drawer becomes full width and stacks preview above tabs.

### KPI tile
`--sand-2` background, 18px radius, 18×20px padding, number 30px/600, label 13px muted.

## 7. Iconography
Simple 2px-stroke line icons (24px grid, drawn at 16px), `stroke-linecap: round`: pulse, clock,
calendar, coin, copy, link, download, list/id, video, repeat, language, globe, external-link,
user, grid, chevrons, ✕. Colour inherits text (`currentColor`).

## 8. Motion
- Hover lift on cards 200ms; dropdown 150ms fade + 6px slide; drawer 280ms
  `cubic-bezier(.2,.8,.2,1)` slide + fade; chevron rotate 200ms.
- Keep motion subtle; nothing auto-plays (videos play only on click).

## 9. Copy rules
- Sentence case for everything except section caps and dropdown labels.
- Creator name replaces the brand name on cards ("<creator> · with <Brand>").
- Numbers: Indian format for money (`₹1,25,000/day`), dates as `12 Oct`.
- Every estimate is labelled ("Est. spend*" + footnote "model estimate, not Meta data").

## 10. CSS token block (copy-paste)
```css
:root{
  --bg:#ffffff; --ink:#121212; --ink-2:#333333; --muted:#838383; --line:#e8e8e8;
  --sand:#dfdad5; --sand-2:#f4f1ee; --panel:#ffffff;
  --orange:#f2552c; --pink:#f0a6d8; --cyan:#45c4dc; --yellow:#f3e33a;
  --live:#1f9d55; --radius:18px;
  --grad:linear-gradient(90deg,#a7a39d 0%,#f2552c 30%,#f0a6d8 62%,#f3e33a 100%);
}
:root[data-theme="dark"]{
  --bg:#0f0f0f; --ink:#f5f3f0; --ink-2:#d9d6d2; --muted:#9a968f; --line:#2a2a2a;
  --sand:#3a3632; --sand-2:#1b1a19; --panel:#161616;
}
html,body{font-family:Sora,system-ui,sans-serif;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
```
