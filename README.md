# CAPBOOST 生意发展资金 — Landing Page

Rebuilt from `202608 -N-Landing Page_B2_Desktop.pdf`. Static HTML/CSS/JS, no build step,
no dependencies. Drop it on GitHub Pages, Netlify, or any web host.

```
index.html              the whole page — markup, styles, script
assets/img/             photos, gold headline graphics, backgrounds, social icons
assets/svg/             logos and icons, extracted as vectors from the PDF
apps-script/Code.gs     Google Apps Script that writes leads into a Sheet
```

---

## 1. Hook up the form (do this first)

Two values at the top of the `<script>` block at the bottom of `index.html`:

```js
var SHEET_ENDPOINT  = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
var WHATSAPP_NUMBER = "PASTE_YOUR_WHATSAPP_NUMBER_HERE";
```

**The sheet.** `apps-script/Code.gs` is already pointed at your leads
spreadsheet (`1hvcujP0Fh…`, tab gid `1006515679`) and writes the 14 columns
that are already in it, in that order. Open <https://script.google.com>, paste
the file into a new project, run `checkSetup()` once to approve permissions —
it logs which tab it found and how many rows are there — then
**Deploy > New deployment > Web app**, *Execute as: Me*, *Who has access:
Anyone*, and paste the `/exec` URL into `SHEET_ENDPOINT`.

It targets the sheet by ID, so the script does **not** need to live inside the
spreadsheet, and it finds the tab by **gid, not name** — renaming the tab won't
break it. If the gid ever goes missing it falls back to the first tab and logs a
warning rather than dropping the lead.

`WhatsApp号码` and `联系方式` are both derived from the one phone field on the
form: whatever shape the visitor types (`012-345 6789`, `+6012 3456789`,
`60123456789`) normalises to `60…` for the WhatsApp column and `+60 123456789`
for display. The `utm_*` / `fbclid` / `gclid` columns fill from the landing
URL — see the note on attribution below.

**The WhatsApp handoff.** Put your own number in `WHATSAPP_NUMBER` as
international digits, no `+` and no spaces (`012-345 6789` → `60123456789`).
On a successful submit the visitor is sent to `wa.me` with their own answers
already typed into the message, so the first thing you receive is a complete
enquiry rather than "hi". Leave `WHATSAPP_NUMBER` blank to switch this off and
show a plain thank-you line instead; `WHATSAPP_DELAY` controls the pause before
the redirect.

The redirect uses the **current tab**, deliberately. It fires after the fetch
resolves, which is outside the click's user-gesture window, so `window.open()`
would be popup-blocked. A real fallback link is rendered next to the message for
anyone whose browser blocks the redirect or who navigates back.

Until `SHEET_ENDPOINT` is set, submitting shows an error and logs the payload to
the browser console — so you can still test the rest of the page.

**Why `mode: "no-cors"`:** Apps Script doesn't return CORS headers on POST.
The request goes through and the row is written, but the browser won't let the
page read the response. That's why success is assumed once the request is sent.
If you need real confirmation, put a Cloudflare Worker or similar in front.

---

## 2. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "CAPBOOST landing page"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then: repo **Settings → Pages → Source: Deploy from a branch → main / (root)**.
Live in about a minute at `https://<you>.github.io/<repo>/`.

All asset paths are relative, so it works from a subfolder without changes.

---

## 3. Things you'll probably want to change

| What | Where |
|---|---|
| Form endpoint | `SHEET_ENDPOINT` in the `<script>` at the bottom of `index.html` |
| Social links | The four `<a href="#">` in the `.social` block — currently placeholders |
| Meta Pixel / GA4 | Commented hooks in the form's success handler; add the pixel snippet in `<head>` |
| Colours | The `:root` block at the top of the `<style>` — every value came from the PDF |
| Case study copy | `.case__text` paragraphs in the 成功案例 section |
| FAQ copy | `.qa` blocks in the FAQ section |

### Adding the Meta Pixel

Paste your pixel snippet in `<head>`, then uncomment these two lines in the
form's success handler:

```js
if (window.fbq)  fbq("track", "Lead");
if (window.gtag) gtag("event", "generate_lead");
```

---

## 4. Where the assets came from

Everything now comes from the designer's **Package B2_Desktop** source files rather
than being pulled out of the PDF:

| Asset | Source |
|---|---|
| All photography | `Image/` originals, downscaled to 2× display size |
| All seven gold headlines (项目/订单已到手, 我们协助, 9年+ SME, RM2,000,000, 成功案例, 常见问题, 资金先到位) | Hi-res transparent PNGs supplied by the client, trimmed to their ink and resampled to 2× display size |
| "Cash Flow ?" wordmark | Client-supplied PNG, cropped out of the full 却总是差一点 + Cash Flow lockup and trimmed to its ink — the Chinese half stays real HTML |
| The five CTA buttons | `B2/C2/E2` SVGs as the button shell (see below), label as real HTML on top |
| AICB badge | `B-AICBLogo.svg` |
| Chloe Ooi signature | Real **Emitha Script** outlines lifted from the PDF's embedded font subset, plus the hand-drawn underline, as one SVG (`signature-chloe.svg`) — artwork, not a webfont, so no licence issue |
| CAPBOOST + Nexus logos, pushpins, tick icons | Vector paths traced from the PDF |
| Hero scenes 2-4 | `DS-A2/A3/A4` package — plate + flipped `DS-A_Gradient.png` + cutout, flattened |
| 融资知识分享 headline | Client-supplied gold PNG, trimmed to its ink |

Transparent PNGs are quantised with `pngquant`, which cut them ~70% with no visible
loss. Each headline is sized in CSS against its **ink**, not its file box — trim any
replacement to the letterforms first or the spacing below it will look wrong.

Note the 成功案例 artwork is the headline only; 一切都因我们而改变 underneath is live
HTML (`.cases__sub`).

### How the buttons are put together

Two things in the source button SVGs don't survive being used on their own:

1. **Live `<text>` in FZLTTHK.** Renders as empty boxes anywhere that font isn't
   installed. Stripped — the label is real HTML positioned over the artwork, so it
   stays editable, selectable and translatable.
2. **Four gloss layers set to `mix-blend-mode: screen`.** In Illustrator these
   screen against the page behind the button. A standalone SVG has no page behind
   it, and screen against transparency just returns the source colour — so they
   painted as solid black bands and ellipses over the button. Removed, and the sheen
   is recreated with a CSS gradient on `.cta::after`, which sits on the real page and
   behaves correctly.

What's kept from the source: the chrome bezel, the coloured pill gradient, both drop
shadows and the chevrons.

To change a label, edit the `<span>` inside `<a class="cta">`. If it's long, add
`cta--long` to drop the type a step. The `--mid` / `--pt` / `--pb` / `--px` variables
on `.cta` position the text and sheen against the artwork — only touch them if you
swap in a different button SVG.

---

## 5. Fonts

The PDF embeds 方正兰亭黑 (FZ LanTing Hei), Avenir, PingFang SC, HanziPen SC and
Emitha Script. None are web fonts, so the page loads the closest free equivalents
from Google Fonts:

| Design | Web |
|---|---|
| FZ LanTing Hei (特黑 / 中黑) | Noto Sans SC 500–900 |
| Avenir Black / Medium | Nunito Sans 600–900 |
| PingFang SC | Noto Sans SC (falls back to real PingFang on Apple devices) |
| HanziPen SC W5 | Ma Shan Zheng |
| Emitha Script | not needed — the signature ships as vector artwork |

Your package includes `Fonts/Avenir.ttc` and `Fonts/NotoSansSC-VariableFont_wght.ttf`.
Noto Sans SC is open-licensed, so you can self-host it if you'd rather not depend on
Google Fonts — but Google's copy is already subset per-character and cached, so it's
usually faster. **Avenir is commercial**: the desktop file in your package does not
cover web embedding. If you want the exact Avenir on the site, buy a webfont licence
first; otherwise Nunito Sans is a close match. Either way, swap the `--cn` / `--en` /
`--hand` / `--script` variables in `:root`.

---

## 6. Other notes

**Ad attribution survives a reload.** `getAttribution()` reads `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content`, `fbclid` and `gclid` off the landing
URL and stashes them in `sessionStorage`, so a lead still carries its campaign
even if the visitor reloads or the URL gets cleaned up before they reach the
form. Values already stored win only where the current URL has none, so a fresh
click always overwrites a stale one.

**Step cards flip layout on mobile.** Below 680px each card becomes a two-column grid
— a square 118px thumbnail on the left, the step number, title and copy on the right —
so the text leads instead of the photo. On desktop they stay as pinned polaroids with
the photo on top.

**Responsive.** Content column is 720px (the PDF's canvas width), full-bleed
backgrounds either side. Below 680px the step cards, case cards and FAQ grid collapse
to one column and the CTAs go full-width.

**The hero is a four-scene slideshow.** Scene 1 is the original composite (the factory
plate plus the `hero-boxes.png` foreground); scenes 2-4 are full-frame photos —
construction, manufacturing, warehousing. Each holds 3s and cross-fades over 0.6s, on a
12s loop. Speed is the `12s` on `.hero__slide` and on `.hero__bg,.hero__boxes` — change
both, and keep the delays at 1/4, 1/2 and 3/4 of whatever you pick.

The logo, headline and 却总是差一点 sit above all four scenes and never move, so the frame
stays anchored while the industry behind it changes. Scene 1's foreground is
`.hero__boxes`, which stays in the layout at all times (only its opacity animates) so the
hero's height never jumps mid-cycle. Stops under `prefers-reduced-motion`, which pins
scene 1.

Scenes 2-4 are built from the `DS-A2/A3/A4` package, three layers deep, in this order:
the `A` plate, then `DS-A_Gradient.png` **flipped** and laid along the bottom edge (it
ships white-edge-up; the fade belongs at the bottom), then the `B` cutout on top. That
last layer is the point — the ground fades to white while the people stay crisp, so they
read as standing on the white base rather than dissolving into it. Flattened to a single
2.08:1 JPEG each, since a slide only ever cross-fades as one piece.

Because they end in white, `.hero__slide::after` releases its darkening by 88% — leave it
darkening to the bottom and the white base turns grey and stops meeting `.hero__fade`.

At 2.08:1 a phone crops about 40% off the sides, so `.hero__slide--3/--4` carry a
`background-position` nudge under 680px, taken from each cutout's alpha bbox (subjects sit
at 47%, 51% and 84% across). Add a scene by flattening it the same way and appending a
`.hero__slide` div — check its subject on a phone before shipping.

**The top bar is a marquee.** It scrolls right-to-left on a seamless loop, pauses on
hover, and freezes to a single centred line under `prefers-reduced-motion`. Speed is
`animation: roll 30s` on `.ticker__track` — bigger number, slower.

**The three pills take turns going blue.** One at a time, never two at once: a 6s loop
split into three 2s turns, so each pill holds blue for ~1.6s, drops back to gold, and the
next one picks it up. Delays are `0 / 2s / 4s` — keep them at thirds of whatever loop
length you set, or the turns start overlapping. `.pill::before` carries the light-blue
gradient on a negative-z layer rather than animating `background-image` directly —
cross-fading two gradient images is not reliable across browsers, an opacity fade always
is. Stops under `prefers-reduced-motion`.

**Case cards are light, not navy.** They follow the designer's Facility Management
reference: photo left at 45%, white body right, gold stars between navy rules, navy
headline, orange on the pain line and navy on the outcome. Note the inline CAPBOOST mark
inside the case copy uses `logo-capboost-inline-dark.svg` — the standard one is white and
would vanish on the white card. Below 680px the photo becomes a 16:4 banner above the
copy, deliberately shallower than the step cards' thumbnail: a narrow side-by-side column
would squeeze this much Chinese to about 16 characters a line.

**Buttons pulse to draw the eye.** `.cta-row` runs a short double-bounce then rests
for ~2.1s of a 2.6s loop — constant motion reads as noise. It pauses on hover so it
does not fight the hover lift, and stops under `prefers-reduced-motion`. The bounce
lives on the row, not the button, so the button keeps its own transform for hover.

**Buttons have a gold light chasing the bezel.** `.cta::before` is a conic-gradient
ring masked to the outline and spun with an `@property` angle. Speed is
`animation: orbit 2.8s` — bigger number, slower. It stops under
`prefers-reduced-motion`.

**The step zigzag is CSS, not artwork.** Five `.stepline` spans sit behind the cards
(`z-index:1` vs the cards' `2`), each a `repeating-linear-gradient` dash rotated into
place. Positions are percentages of `.stepgrid`, so they hold as card heights change.
They're hidden below 680px where the cards stack. Note the cards use
`:nth-of-type()` rather than `:nth-child()` for their stagger and rotation, because
the connector spans share the grid.

**The four industry tiles rotate clockwise.** Each tile animates through the 2x2
grid on a 10s loop (about 2s hold, then a move), captions travelling with their
own photo so labels always match. Offsets are `calc(100% + var(--g))` of the tile
itself, so the maths stays exact at any width. Note `.tile` sets `margin:0` — they
are `<figure>` elements and the browser's default 40px margin would otherwise stop
them filling their grid cells and throw the step distance off. Stops under
`prefers-reduced-motion`.

**The case-study video** is `assets/video/team.mp4` (CTOS event highlight, 49s,
1024x576, 4.7 MB). It **autoplays muted and loops**, with controls so viewers can
unmute. Muted is not optional — browsers block autoplay with sound. It was re-encoded
smaller than the 720p original precisely because autoplay means every visitor
downloads it. The poster is the frame at 1s, so the still matches what plays first
and the handover is invisible. To re-encode after editing:

```bash
ffmpeg -i input.mp4 -vf "scale=1024:-2" -c:v libx264 -crf 29 -preset slow \
       -movflags +faststart -c:a aac -b:a 80k assets/video/team.mp4
```

`-movflags +faststart` matters: it lets playback begin before the whole file lands.

**The 9:16 shorts section** (`.shorts`, above the FAQ) holds three vertical clips at
720x1280 — `short-1/2/3.mp4`, 5-9 MB each. They are `preload="none"`, so nothing
downloads until someone presses play; autoplaying three narrated clips would mean
~21 MB on every page load and competing audio. A small script pauses every other
video whenever one starts, so two can never talk over each other. On mobile the row
becomes a snap-scrolling strip rather than three stacked full-height clips.

Its heading is the client's gold 融资知识分享 artwork (`title-insights.png`, trimmed to
its ink and sized in CSS against that, like the other headlines). FINANCING INSIGHTS
below it stays live HTML in `.shorts__sub`.

It is set to the same **glyph height** as 常见问题, not the same width — six characters
against four, so equal height needs a wider box. 常见问题 is 4.096:1, 融资知识分享 is
6.230:1, so at 300/456, 250/380 and 210/320 the two render at 73px, 61px and 51px tall
respectively. If you resize one, resize the other by the same ratio or they drift apart.
Note the 250px mobile value for `.faq__title` lives in the main 680px block, not the
shorts block above it — that one sits before `.faq__title`'s base rule and would lose on
source order.

**Accessibility.** Real focus states on every control, `prefers-reduced-motion`
respected, form errors announced via `aria-live`, alt text on content images, and the
repeated ticker copies marked `aria-hidden` so screen readers read the line once.
