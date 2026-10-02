# IDEA_SCOPE.md

> This document is the control plane for the build. You wrote it; your coding agent reads it before every session. If a proposed change does not improve the active milestone's acceptance test or the rubric strategy, it goes in the parking lot.

> **Draft note:** this draft was produced with Claude in the scoping session on Fri 2 Oct. The handbook rule is "write the scope yourself, not the AI": read every line, rewrite anything that isn't true for you, and rewrite the GTM posts (section 7) in your own voice before using them.

## 0. scope status

| Field | Value |
|---|---|
| Event | GrowthX Build Sprint · Season 04 |
| Builder | Inder, solo, plus Claude Code |
| Build starts | Fri 2 Oct 2026, 11:00 AM IST |
| Submission deadline | Sat 17 Oct 2026, 11:00 AM IST (aim for 9:00 AM) |
| Current milestone | M0 |
| Live URL | https://chatty-cricket-187.convex.site |
| Public repo | https://github.com/indusved/showroom-ads |
| Last updated | Fri 2 Oct 2026 |

### status language

- **Specified:** described here but not implemented.
- **Implemented:** code exists.
- **Working locally:** the golden path runs in the development environment.
- **Live:** the golden path runs at the live URL, logged out, on a phone.
- **Verified:** acceptance tests have passed on the live URL.
- **Demo-ready:** reset, fallback, timing and the numbers screenshot have been rehearsed.

## 1. idea lock

| Decision | Locked answer |
|---|---|
| One-sentence product | **Showroom Ads:** upload a real car photo and type your offer, get finished offer ads in every social size in 2 minutes. |
| The one person | Marketing person at a car dealership in India or the US with no designer free today |
| The one moment | A new weekend or festive offer (e.g. "₹50,000 off this Navratri") has to go out today |
| Current workaround | A designer in Photoshop/Canva for ~3 days per ad, or a self-made post that looks cheap |
| Core action (user does X → gets Y) | Uploads one car photo + types the offer → gets 3 ad styles × 5 sizes, ready to download |
| The one outcome the product must deliver | Ads the dealer actually posts the same day |
| Hard input or hard case | Phone photo in a cluttered showroom (people, other cars, reflections, bad light); US finance/lease offers that need fine-print disclosure text (rule to verify) |
| Primary track | **Revenue** |
| Riskiest assumption | A dealer would post an ad made from their real car, cut out, on an AI-made layout |
| The 30-minute no-code test for it | Take 3 real dealer car photos → cut out with a free background remover → lay out an offer ad by hand in Canva → send to one dealer contact: "would you post this?" |
| First three users (names, where they are) | Dealership contacts **User A, User B, User C** (real names kept private, outside this repo), from India and the US dealers I'm already in conversation with. Reached by email/WhatsApp on Sat 3 Oct. |
| Tuesday channel (where those users already gather) | Direct email and WhatsApp to dealership marketing people; forwards from A, B, C into their dealer groups |
| Personal artifact a user would screenshot | Their own car with their own offer. Useful, but not "about them" — reach comes from direct invites, not a viral loop |
| Saturday numbers I expect to report | Signups 10–30 (L2), revenue $20–100 (L2), pain severity L4–L5, live product quality L3 |
| Library lineage (card or proven build, if any) | None. Closest existing product: Spyne (car photo backgrounds for dealers) |

### why this idea

#### the pain I feel

Stated: last week one ad took me 3 days. The time went into the visuals (car shots, backgrounds, edits) and reworking it for each platform. My designer did it in Photoshop and Canva while I waited and answered to the client. As Director of Strategy at an agency working toward automotive, I know what a car ad must look like and what a brand or dealer will reject. I can reach dealership marketing people directly by email.

#### decisive proof

A stranger opens the live URL on their phone, uploads a photo of a real car, types "₹50,000 off this weekend, call 98xxxxxx", and within 2 minutes downloads 5 correctly sized ads in which the car is pixel-identical to their photo. The reviewer sees that flow, plus the Convex `signups`/`jobs` table count (signups row) and the payment dashboard (revenue row).

## 2. user and job

### user

- Who (name, age, situation): User A — marketing / sales-ops person at a car dealership in India or the US (details private)
- Context: runs the dealership's Instagram, Facebook and WhatsApp; no in-house designer or one shared designer
- Frequency: new offers every week; India peaks during Navratri–Diwali (mid-Oct to early Nov 2026 — dates to confirm); US runs monthly/weekend sales events
- Existing behaviour: briefs a designer or agency, or makes a quick Canva post
- Existing cost, delay, risk or frustration: days of delay per ad; offer goes out late or looks cheap

### job to be done

> When **a new offer has to go out today**, they need to **get finished, correctly sized offer ads featuring their actual car**, so that **the offer reaches buyers while it is still live, without waiting on a designer**.

### definition of completion

The job is complete only when:

1. The dealer has downloaded ad images in all 5 sizes.
2. The car in every image is the dealer's own photo, not AI-generated or distorted.
3. The offer text, dealer name/logo and phone number are correct and readable in every size.

Advice, a transcript, an extraction, search results or a chat response alone do not count unless they are themselves the final usable output.

## 3. product contract

### golden path

1. Dealer opens the live URL, signs in with email (Convex Auth).
2. First time only: enters dealership name, phone number, uploads logo (saved).
3. Uploads one car photo and types the offer (headline + price/EMI + validity).
4. Car is cut out in the browser; the server generates a background and a headline; 3 styles × 5 sizes are composed.
5. Dealer previews, picks, downloads (single images or a zip). Job saved to history.

### inputs

| Input | Format/source | Hard characteristics | Validation |
|---|---|---|---|
| Car photo | JPG/PNG/HEIC from phone, ≤10 MB | Cluttered showroom, people, reflections, night light, partial crop | Reject non-images and >10 MB; if cutout quality is poor, offer "keep original background" mode |
| Offer text | Free text, English or Hindi | Long sentences, ₹/$ symbols, EMI/APR/lease figures, typos | Character limits per field; show preview before generating |
| Market + disclosure (US) | India / US toggle; optional fine-print field | US finance/lease offers usually need terms shown (rule to verify) | If a US offer mentions $/mo, APR or lease, require the fine-print field before generating |
| Dealer details | Name, phone, logo PNG | Low-res logo, logo with white box | Phone format check; logo shown on preview |

### outputs and state changes

| Output/state change | Consumer | Required format | Proof of completion |
|---|---|---|---|
| Ad images | Dealer | PNG: 1080×1080 (IG post), 1080×1350 (IG portrait), 1080×1920 (story/WhatsApp status), 1200×628 (Facebook link), 300×250 (Google banner) | Downloaded files; `downloaded` event in Convex |
| Job record | Builder (numbers) | Convex `jobs` row: user, created, status, sizes | Convex table count |
| Signup | Builder (numbers) | Convex `users` row + first job = signup with first-use event | Convex table count screenshot |

### what the product must remember

- within one session: current photo, cutout, offer text, generated variants
- across sessions (Convex tables): `users`, `dealerProfiles` (name, phone, logo), `jobs` (inputs, outputs in file storage, status), `payments`/credits
- what it must deliberately forget: nothing sensitive is collected beyond email and dealership phone; no payment card data is ever stored by the app

### human review boundary

- What can be automated: cutout, background, headline suggestion, layout, resizing
- What requires confirmation: dealer approves the preview before download; dealer can edit the AI headline
- What must be escalated: if the cutout fails, switch to "keep original background" mode instead of showing a broken car
- How uncertainty is exposed: preview shows the cutout over a checkerboard; "Looks wrong? Use my original photo" button

## 4. what makes it different

### the obvious version

AI generates the whole ad, car included, from a prompt. The car comes out with the wrong grille, logo or wheels, and no dealer posts it. Or: a car photo on a nice background — which Spyne already sells.

### the non-obvious choice

**AI never touches the car.** The real car is cut out with code and placed on a composed layout; AI only makes the background and suggests the headline. And the product is the **finished offer ad** (price, EMI, validity, dealer logo and phone, every social size), not a prettier photo — priced for small dealers who won't pay Spyne's ~$250–450/month.

### the moment they screenshot

Their own car with this week's offer, in the 5 sizes. Not a personal artifact in the viral sense; reach comes from direct invites and forwards.

### ideas deliberately rejected

| Rejected mechanic | Reason |
|---|---|
| AI-generated car images | Distorts brand details; dealers won't post |
| Clean car photo / studio backgrounds as the product | Spyne already does it, including a free tool |
| Lot-to-listing photos for used-car dealers | Not my pain; competitor already strong |
| Master-ad resizer for agency designers | Canva Magic Resize is free and already in their hands |
| Direct posting to Instagram/Facebook | Meta integration risk; not needed for the job |

## 5. dependencies

### verified capability matrix

| Required capability | Product/API/model | Exact endpoint/access | Limits | Verified how |
|---|---|---|---|---|
| Car cutout | `@imgly/background-removal` (runs in browser) | npm package | AGPL-3.0: source must be offered — satisfied by public repo. First load downloads model files (size/latency to check). | License page read 2 Oct; **quality on dealer photos unverified** (M0 test) |
| Background + headline | OpenAI image model (gpt-image-1 or newer) + a text model | OpenAI API, called from a Convex action | Roughly $0.01–0.06 per image at low/medium quality | From search summary of OpenAI pricing page, 2 Oct — **confirm on the pricing page before adding the key** |
| Image composition (layout, text, sizes) | Browser canvas | in-app | Hindi fonts need a font that supports Devanagari | Unverified — test in M1 |
| Database, files, auth, hosting | Convex (+ Convex Auth, convex static hosting) | project already scaffolded | Free tier limits to check | Fixed stack |
| Sign-in email codes | Resend (builder's account), via Convex Auth Email provider | `AUTH_RESEND_KEY`, optional `AUTH_EMAIL_FROM` in Convex env | Free: 3,000/month, 100/day. **`onboarding@resend.dev` only delivers to the account owner until a domain is verified** | Resend pricing page + docs, 2 Oct |
| Payments | **Decision pending:** Razorpay or Stripe (outside Convex — ask before adding); must accept both INR and USD | payment link | Whether an Indian account can take USD card payments on each — unverified | Not started |

### unsupported assumptions

- That the browser cutout is good enough on cluttered showroom photos — must be proven in M0, with "keep original background" as the fallback.
- That AI image models keep a car intact if asked to edit around it — **not relied on**; the car is never sent for editing.
- Indian festive-season dates — to confirm before using in posts.
- US auto-ad disclosure rules for finance/lease offers — verify before US dealers generate finance ads; never claim the product makes ads legally compliant.

### secrets and access

- `AUTH_RESEND_KEY` (and later `AUTH_EMAIL_FROM` with a verified domain) in Convex environment variables, set by the builder.
- `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` (Convex Auth) set on dev and prod.
- `OPENAI_API_KEY` in Convex environment variables (set via Convex dashboard or `npx convex env set`). Never in the repo or this document.
- Payment provider keys (when chosen) in Convex environment variables.

## 6. rubric strategy

### primary track

| Decision | Answer |
|---|---|
| Primary track | **Revenue** |
| Why this track fits the idea and my advantage | A felt pain with a budget behind it, warm direct access to dealers, willingness to charge, and no social audience (which rules out Virality) |
| The one thing the track needs | A named dealer (not a friend) who used their own photo and paid during the sprint |

### the track's rows

**Revenue (176 base + overflow)**

| Row | Weight | Max base | Current level | Target level | Target points (L−1)×weight | Observable proof | Work required | Milestone |
|---|---:|---:|---|---|---:|---|---|---|
| Signups | 20x | 80 | L1 (0) | L2 (1–50); stretch L3 (51+) | 20 (stretch 40) | Convex `users` with ≥1 job, own accounts excluded, screenshot | Warm outreach, forwards, festive hook | M2, M4, M5 |
| Live product quality | 8x | 32 | L1 | L3; stretch L4 | 16 (stretch 24) | Screen recording of a stranger finishing on a phone, unassisted | Golden path + fallback mode + phone layout | M1, M3 |
| Revenue generated (USD) | 4x | 16 | $0 | L2 (up to $100); stretch L3 ($100+) via US dealers | 4 (stretch 8) | Payment dashboard screenshot; payers are dealers, not friends | Payment link + credits after 3 free packs | M3, M5 |
| Waitlist | 4x | 16 | 0 | L2 (1–150) | 4 | Separate Convex `waitlist` table ("notify me" for dealers not ready to try) — never counted as signups | One email field on landing page | M3 |
| Pain point severity | 2x | 8 | L3 | L4–L5 | 6–8 | Dated notes of 5+ dealer conversations, quotes, any "can I pay now" | Conversations with A, B, C and forwards | M2, M4, M5 |
| SOM (bottoms-up math) | 2x | 8 | L1 | L4 (₹10–1,000 cr) | 6 | Calculation from the GrowthX TAM/SAM/SOM calculator | Dealer outlet count (verify) × yearly price | M5 |
| Right to win | 2x | 8 | L4 | L4 | 6 | Agency strategy experience + agency-grade layouts in the product | Write it in the submission | M6 |
| Why now | 1x | 4 | L2 | L3; L4 only if a model unlock under 12 months is verified | 2 | Festive-season timing + model dates from official docs | Verify dates | M5 |
| Moat and defensibility | 1x | 4 | L1 | L2–L3 (taste in layouts) | 1–2 | Layout quality vs. Canva templates | — | — |
| **Revenue total** | | **176** | | | **~65–75 target** | | | |

### bonus-eligible rows from the other tracks (0.5x, 50-point cap, same evidence)

| Source track | Row | Original weight | Bonus weight | Max bonus | Will I claim it? | Proof |
|---|---|---:|---:|---:|---|---|
| Virality | Signups | 25x | 12.5x | 50 | No (below L2 band of 26+ is likely; revisit if signups exceed 26) | — |
| Virality | Visitors | 10x | 5x | 20 | No (needs read-only analytics — an outside service, not planned) | — |
| Virality | Reactions + comments | 2x | 1x | 4 | No | — |
| Revenue | Signups | 20x | 10x | 40 | n/a (primary) | — |
| Revenue | Live product quality | 8x | 4x | 16 | n/a (primary) | — |
| Revenue | Revenue generated | 4x | 2x | 8 | n/a (primary) | — |
| AI Agent as a Service | Real output shipping | 20x | 10x | 40 | No | — |
| AI Agent as a Service | Observability | 7x | 3.5x | 14 | No | — |

### level anchors

See the rubric source (v2.2.0). Revenue anchors used here: Signups L2 1–50 · L3 51+ · L4 251+. Quality L2 rough MVP · L3 does what it claims · L4 polished, better than alternatives. Revenue L2 up to $100 · L3 $100+. Waitlist L2 1+ · L3 151+. Pain L4 3+ conversations with quotes · L5 5+ and a "can I pay now". SOM L4 ₹10–1,000 cr.

### evidence caps and anti-spoof

L4 or L5 needs verifiable evidence or the row caps at L3. My own and friends' accounts are excluded from signups; payments from myself, friends or sprint attendees do not count as revenue.

### where the points are

1. **Signups (20x)** — warm dealer outreach + forwards.
2. **Live product quality (8x)** — a stranger finishes the job on a phone without help.

### competence floor

Waitlist, why now, moat, right to win (write-up only).

### rubric traps

AI-generated cars; a "multi-agent" label on one prompt; an admin dashboard nobody uses; counting test accounts; friends paying; counting waitlist emails as signups; claiming L4 without a recording.

## 7. gtm plan

### where the users already are

| Channel | Who is there | How I reach them | When (day) |
|---|---|---|---|
| My email/WhatsApp contacts | User A, B, C (dealership marketing, India + US dealers already in conversation) | Personal message asking for one car photo + current offer | Sat 3 Oct (photo request), Mon 5 Oct (product link) |
| Their dealer groups | Other dealership marketing people | A, B, C forward the link | From Wed 7 Oct |
| Cold email | Dealerships in my city/region (public contact emails) | Short email with a sample ad made from their own listed car | Sun 11 Oct onward |
| LinkedIn (new, small) | Auto marketing people | One post per day in sell week | Mon 12 – Thu 15 Oct |

### distribution posts (drafts — rewrite in your own voice)

- **Monday, after the first three users:** "Last week one car ad took my team 3 days. I built a tool that does it in 2 minutes with the dealer's real car. Three dealers tried it this week — here's what they made."
- **Tuesday, the launch post:** "Festive offers are going out now. Upload your car photo, type your offer, get Instagram, story, WhatsApp and Facebook sizes. Your real car, never AI-generated. First 3 packs free: [link]"
- **Wednesday to Friday, one update each evening:** what changed + one number (e.g. "18 dealers, 74 ads made").
- **Saturday, the shipped post:** what I built, the numbers, what dealers said.

### targets, per band of my track's rows

| Row | Track | Floor I will hit (band) | Stretch (band) | How I will know (source) |
|---|---|---|---|---|
| Signups | Revenue | L2 (10+) | L3 (51+) | Convex table count, screenshot |
| Waitlist | Revenue | L2 (1+) | L2 (50+) | Convex `waitlist` table |
| Revenue generated | Revenue | L2 (first payment) | L3 ($100+, likely from a US dealer) | Payment dashboard |
| Pain point severity | Revenue | L4 (3+ conversations, quotes) | L5 (5+, "can I pay now") | Dated conversation notes |

### analytics setup

- Analytics tool installed on the live URL: not required for Revenue; **optional** and would be an outside service (ask first). Convex event table logs `visited`, `job_created`, `downloaded`, `paid`.
- Read-only access created and the link saved: n/a unless an analytics tool is approved.
- Signup or first-use event writes to Convex: yes — `users` + `jobs`.
- Payment link, if any: Razorpay or Stripe — decision pending, live by Thu 8 Oct.

### the numbers I will report at submission

- Signups: N (Convex screenshot, own accounts excluded)
- Ads generated / downloaded: N (Convex `jobs`)
- Revenue: ₹X / $Y (payment dashboard)
- Waitlist: N (Convex)
- Conversations: N, with quotes
- SOM: calculator output

## 8. the milestone ladder

### M0 — feasibility and setup (Fri 2 Oct, before 3:00 PM)

Required:
- Setup complete: GitHub, Convex, Claude Code, skills (already scaffolded in this folder).
- **Riskiest-assumption test (30 min, no code):** 3 real car photos → free background remover → Canva offer layout → show one dealer contact.
- One hard photo (cluttered showroom) run through the background-removal demo; one background generated in ChatGPT; note quality and time.
- GitHub repo created (public), empty app deployed with `npm run deploy`, `.convex.site` URL opens.
- Message User A, B, C asking for one real car photo + their current offer.

Acceptance test:
> The empty app is live at a public URL, the repo exists, and the riskiest assumption has a written result.

Stop condition:
> If the cutout fails on most real photos by 5:00 PM Fri 2 Oct, switch to the fallback: keep the original photo and add an offer frame (no cutout). If dealers say they wouldn't post even that, pick another idea.

### M1 — one ugly complete flow (Fri 2 Oct evening → Sun 4 Oct)

Required:
- Sign in → upload photo → type offer → 1 style × 5 sizes → download.
- Convex stores user, dealer profile, job and output files.
- Deployed and pushed every session.

Excluded: 3 styles, Hindi, payments, history page, landing page beyond one sentence and one button.

Acceptance test:
> Someone who has never seen the product runs one photo through the complete job at the live URL, on their phone, without me talking.

If I am behind, cut to: one size (1080×1080), fixed showroom backdrop (no AI background), offer text only.

### M2 — first users (Mon 5 → Wed 7 Oct, evenings)

Required:
- Users A, B, C each run their own photo; signup + job recorded in Convex.
- Notes on where each stopped; single biggest blocker named.
- Add 3 styles and AI headline only if the core already works for all three.
- Blocker taken to the Wed 7 Oct Q&A (8–9 PM) if still standing.

Acceptance test:
> Three rows in the Convex table that are not me, and one sentence per user on where they stopped.

If I am behind, cut to: one user on a call, screen shared.

### M3 — finish the build (Thu 8 → Fri 9 Oct, evenings)

Required:
- Biggest blocker from M2 fixed and deployed.
- "Keep original background" fallback works.
- US fine-print field enforced for finance/lease offers.
- Payment link + credits live (3 free packs, then paid) in INR and USD. Provider chosen and approved.
- Waitlist field on landing page.
- Works logged out (landing), on a phone, on someone else's device.

Acceptance test:
> On Friday night a stranger completes the core job at the live URL and the job shows up in Convex.

If I am behind, cut to: fix only the blocker that stops the most users; payment as a plain payment link.

### M4 — sell week opens: video and outreach (Sat 10 → Sun 11 Oct)

Required:
- GTM video after Saturday's masterclass: my 3-day pain → photo in → ads out in 2 minutes.
- Launch post written in my own words.
- Sunday: direct invites and cold emails sent (count recorded), first real sale attempted.
- Real-user failures written down; product changed only where it mattered.

Acceptance test:
> The video exists and is watchable, the invites are sent, and signups for the weekend are written down with screenshots.

If I am behind, cut to: twenty direct messages and one screen recording, no edited video.

### M5 — go live and iterate (Mon 12 → Fri 16 Oct)

Required:
- Mon morning: GTM live. Posts Tue, Wed, Thu.
- Wed Q&A: bring what dealers are saying.
- Thu: buyer feedback folded into product and pitch.
- Every objection written down; SOM via the calculator; why-now dates verified.
- Fri: last changes, gather revenue and intent proof.

Acceptance test:
> Four posts live, and a CHANGELOG line for each change saying what a buyer can now do that they could not before.

If I am behind, cut to: post once, message thirty dealers directly, log every objection.

### M6 — verify and submit (Fri 16 Oct night → Sat 17 Oct, 11:00 AM)

Required:
- Core action works at the live URL, logged out → sign in, on a phone.
- Data survives closing and reopening.
- Repo public, opens in a private window.
- Screenshots: Convex signups, jobs, waitlist; payment dashboard; conversation notes.
- Self-scored on every Revenue row.
- One honest paragraph + link. Submitted by 9:00 AM, hard stop 11:00 AM.

Acceptance test:
> Two consecutive runs of the proof walkthrough (section 9) on the live URL, one of them on someone else's device.

## 9. proof contract

### one-sentence setup

Dealers wait days for a designer to make each offer ad; Showroom Ads turns their real car photo and offer into every social size in 2 minutes.

### the proof

| Time | What happens | What the reviewer sees | Rubric row it supports |
|---:|---|---|---|
| 0–15s | My 3-day ad last week; dealers face the same every festive season | One sentence + the old ad | Pain point severity, right to win |
| 15–60s | Upload a fresh car photo, type an offer | 5 sizes appear, car untouched, download | Live product quality |
| 60–90s | The numbers | Convex `users`/`jobs` count, payment dashboard | Signups, revenue generated |
| 90–120s | What broke and what changed | Cluttered photo → fallback mode added after User A | Pain point severity |

### the input a stranger will arrive with

A phone photo of a car on their lot or showroom, and this weekend's offer.

### fallback input, if the live one fails

A saved clean showroom photo of a common Indian car (taken myself or from a dealer with permission — no client brand assets).

### the number I lead with

Signups (dealers who made at least one ad).

### claims I can prove

- The car is never AI-generated.
- N dealers made M ads (Convex).
- X paid (payment dashboard).

### claims I must not make

- "Better than Spyne" in general — only "made for offer ads, priced for small dealers".
- Any number without a screenshot.
- Brand partnerships or client work from Eccentric.
- That ads are legally compliant (US disclosures are the dealer's responsibility).

## 10. test plan

### golden cases

| Case | Why representative | Expected final output | Status |
|---|---|---|---|
| 1 | Clean showroom photo, hatchback, daylight | 5 sizes, clean cutout, offer readable | Specified |
| 2 | Outdoor SUV on dealer lot, phone photo | 5 sizes, clean cutout | Specified |
| 3 | Cluttered showroom, people behind car (hard case) | Cutout or automatic suggestion of fallback mode; never a broken car | Specified |

### failure cases

| Failure | Expected behaviour | User recovery | Tested? |
|---|---|---|---|
| Ambiguous input (no car or several cars) | Warn "we couldn't find one clear car" | Use original-photo mode or upload another | No |
| Unsupported input (PDF, video, >10 MB) | Clear error before upload | Pick a JPG/PNG | No |
| API timeout or failure (OpenAI) | Fall back to a built-in showroom backdrop and default headline | Ads still delivered | No |
| Empty result (cutout returns nothing) | Switch to original-photo mode | Ads still delivered | No |

## 11. risk register

| Risk | Probability | Damage | Earliest test | Mitigation | Fallback |
|---|---|---|---|---|---|
| Cutout looks bad on real dealer photos | Medium | High | M0 today | Test on real photos first | Original-photo + offer frame mode |
| A, B, C don't respond | Medium | High | Sat 3 Oct photo request | Ask for a photo (small ask) before the product exists | Cold email dealers with a sample ad of their own car |
| Nobody pays | High | Medium | Thu 8 Oct | 3 free packs then a small price; ask directly | Record "would pay" quotes for pain severity |
| Spyne comparison | Medium | Medium | Mon 5 Oct conversations | Position on finished offer ads, small-dealer price | — |
| Hindi text rendering breaks layouts | Medium | Low | M2 | Devanagari font test | English only |
| US finance ads missing required disclosures | Medium | Medium | Before US users generate finance ads | Required fine-print field; disclaimer that compliance is the dealer's call | Price-only offers for US |
| Payment provider can't take both INR and USD | Medium | Medium | Wed 7 Oct | Check provider docs early | Separate links per market |
| OpenAI cost or key issue | Low | Medium | M1 | Low quality setting; per-user limit | Built-in backdrops |

### pre-mortem

It is 11:00 AM on Saturday 17 October and the product is not submitted, or is submitted with no users, because:

1. My contacts never tried it → photo request goes out Sat 3 Oct, and each is asked to forward to 2 dealers.
2. The ads looked fake on real phone photos → M0 test uses their photos; original-photo fallback mode.
3. Nobody paid → payment live by Thu 8 Oct; 3 free packs then a small paid pack, priced far below Spyne.

## 12. non-goals

1. No AI-generated cars.
2. No markets beyond India and the US in v1.
3. No video ads.
4. No direct posting to Instagram/Facebook.
5. No designer editing tools (layers, drag-and-drop editor).

Any change to these requires a written scope decision in section 15.

## 13. parking lot

| Idea | Potential value | Why not now | Revisit after |
|---|---|---|---|
| Weekly "Monday Offer Pack" subscription | Recurring revenue | Can't prove retention in 2 weeks | Sat 17 Oct |
| Direct posting to Meta | Saves a step | Integration risk | Sat 17 Oct |
| Video / reels | Higher engagement | Too heavy for the sprint | Sat 17 Oct |
| D2C brands as a second industry (provision exists: `convex/industries.ts`, `businessProfiles.industry`) | Expansion beyond auto | Splits M1 hours and the first-user story; rubric rewards depth on one user | Sat 17 Oct |

## 14. current state

### active milestone

M0

### implemented

- Convex project scaffolded (from kickoff setup)
- Empty Vite + React page with Convex static hosting (app-owned root routing, so Convex Auth routes can stay at the root)

### working locally

-

### live

- Empty landing page at https://chatty-cricket-187.convex.site (checked in browser, Fri 2 Oct)
- Email-code sign-in (Convex Auth + Resend) deployed. Code send and wrong-code rejection tested locally; full sign-in with a real code verified on the live URL by the builder (Fri 2 Oct)
- Photo upload + offer screen deployed. Builder reported a save, but prod `jobs` table was empty on check — NOT verified

### verified

-

### current blocker

None yet. Open decisions: payment provider (Razorpay or Stripe) and confirming OpenAI pricing on the official page.

### next single action

Run the 30-minute riskiest-assumption test: 3 real car photos → cutout → Canva offer layout → ask one dealer "would you post this?"

## 15. decision log

| Time | Decision | Evidence/reason | Scope impact |
|---|---|---|---|
| Fri 2 Oct | Primary track: Revenue | No social audience; willing to charge; warm dealer access | Signups + quality are the build targets |
| Fri 2 Oct | Direction A (Showroom Ads) over listing photos and resizer | Own pain; finishes the job; differentiated from Spyne and Canva | — |
| Fri 2 Oct | AI never touches the car | AI distorts car details; dealers won't post | Browser cutout + composition |
| Fri 2 Oct | OpenAI image service approved (paid usage) | Builder approved outside service | Key in Convex env vars |
| Fri 2 Oct | India only in v1 | Festive season timing; rupee pricing | US → waitlist |
| Fri 2 Oct | Sign-in: email codes via Resend (Convex Auth) | Rubric signups = email + first use; builder chose trusted emails | Domain must be verified in Resend before dealers can receive codes |
| Fri 2 Oct | Multi-industry provision from day one; automotive only visible in v1 | Builder wants the project to expand (auto dealers, then D2C) | `industry` field + industry config; no D2C screens in the sprint |
| Fri 2 Oct | **Revised:** India + US in v1 | Builder is already in conversation with US dealers; USD payments can reach Revenue L3 | INR + USD payments; US fine-print field; English-only for US |
