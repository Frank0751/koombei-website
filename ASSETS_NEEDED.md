# ASSETS NEEDED

Running checklist of placeholder assets used in the rebuild. Replace each placeholder with a real asset when available, then mark it done.

## Format

Each entry: `[ ] asset-name - dimensions, format, where it goes, notes`

## Phase 1 assets

[ ] founder-photo - 400×400 jpg/webp, Founder block on homepage, headshot on --night bg
[ ] client-logo-swk-ghana - 200×80 png/svg transparent, Selected work card 1
[ ] client-logo-climate-sociologist - 200×80 png/svg transparent, Selected work card 2
[ ] client-logo-andrews-akoto-addo - 200×80 png/svg transparent, Selected work card 3
[ ] client-logo-joseph-johnson - 200×80 png/svg transparent, Selected work card 4
[ ] client-logo-frank-koomson - 200×80 png/svg transparent, Selected work card 5
[ ] client-logo-timoya-farms - 200×80 png/svg transparent, Selected work card 6
[ ] client-logo-lafie-plus - 200×80 png/svg transparent, Selected work card 7
[ ] client-logo-rubolink - 200×80 png/svg transparent, Selected work card 8
[ ] client-screenshot-swk-ghana - 600×400 jpg/webp, Selected work card 1 thumbnail
[ ] client-screenshot-climate-sociologist - 600×400 jpg/webp, Selected work card 2 thumbnail
[ ] client-screenshot-andrews-akoto-addo - 600×400 jpg/webp, Selected work card 3 thumbnail
[ ] client-screenshot-joseph-johnson - 600×400 jpg/webp, Selected work card 4 thumbnail
[ ] client-screenshot-frank-koomson - 600×400 jpg/webp, Selected work card 5 thumbnail
[ ] client-screenshot-timoya-farms - 600×400 jpg/webp, Selected work card 6 thumbnail
[ ] client-screenshot-lafie-plus - 600×400 jpg/webp, Selected work card 7 thumbnail
[ ] client-screenshot-rubolink - 600×400 jpg/webp, Selected work card 8 thumbnail
[ ] testimonial-headshot-1 - 80×80 jpg/webp square, Testimonials card 1
[ ] testimonial-headshot-2 - 80×80 jpg/webp square, Testimonials card 2
[ ] testimonial-headshot-3 - 80×80 jpg/webp square, Testimonials card 3
[ ] og-image - 1200×630 jpg/webp, Open Graph image for homepage (Phase 3 will reuse on all pages)

## Reviews (self-hosted — live now, no account needed)

The homepage "Client stories" section (`index.html`, `#client-stories`) has a live "Leave a review" form (star rating + name/role + review text). It submits straight to the same Formspree inbox as the contact form (`mqegqajo`), with a `_subject` tag of "New KoomBei review submission" so it's easy to spot.

[ ] Check your Formspree inbox / email periodically for new review submissions
[ ] For reviews you want to feature, copy the quote + name + role into a new `.testimonial-card` block in `index.html` (copy the existing three cards as a template) — add the matching `<div class="star-row">★★★★★</div>` (or fewer stars) above the quote
[ ] Optional: also add the review into `_data/testimonials.json` to keep a structured record, though the homepage cards are hand-authored HTML, not pulled from that file
[ ] We previously tried Trustpilot's free TrustBox widget for this, but it requires creating and verifying a Trustpilot Business account before any review links work — that step needs the business owner's email/domain, so it's been dropped in favor of this self-hosted form, which works immediately

## Analytics (Microsoft Clarity — free, no cap)

Every page now loads the Clarity tracking snippet with a placeholder project ID (`PLACEHOLDER_CLARITY_PROJECT_ID`). With the placeholder in place it's a harmless no-op — no errors, no broken page, it just doesn't record anything yet.

[ ] Create a free account at https://clarity.microsoft.com and add koombei.com as a project
[ ] Copy the project ID Clarity gives you
[ ] Find-and-replace `PLACEHOLDER_CLARITY_PROJECT_ID` across all 6 HTML files (`index.html` + the 5 files in `pages/`, now including `circle.html`) with that ID
[ ] Clarity is genuinely free forever (Microsoft, no tier limits as of writing) — gives session recordings + heatmaps, useful for seeing how visitors actually use the currency/language pickers and the new review form

## Pricing & discount (live now)

Package prices updated: **Seed GHS 2,500, Rise GHS 3,500, Summit GHS 6,000** (all auto-convert to local currency + USD). Verified NGOs, nonprofits, and startups registered under 2 years get **20% off any tier** (Seed GHS 2,000, Rise GHS 2,800, Summit GHS 4,800), shown as a discount line on every package card. The homepage "Starting from GHS 2,000" stat is deliberately the discounted Seed floor.

[ ] Eligibility is confirmed manually: the discovery form now collects a **registration number** (shown for NGO/Nonprofit/Startup) and a **registration date** (Startup only, to check the under-2-years rule). Verify each applicant's number/date before confirming the discount in the proposal. This is an honor-system check — Ghana's Registrar General's Department has a public search if you ever want to spot-check.

## KoomBei Circle membership (live now)

New page: `pages/circle.html`, linked from every footer + a homepage teaser + the chatbot. Free membership for existing clients; the join form submits to the same Formspree inbox (`mqegqajo`) tagged "New KoomBei Circle membership request". The discovery form also gained a "Referred by a KoomBei Circle member?" field.

[ ] **Set up the private community group** (WhatsApp) the Circle page promises, and send the invite link when you confirm a membership.
[ ] **Write the members-only resource** the page promises (a site-health checklist + plain-English SEO tips). Until it exists, don't send it — or soften that benefit line.
[ ] Decide the exact **"next project" discount** — the page says "10-15%". Pick a firm number when you quote returning members, or leave the range.
[ ] When you feature a member, add the promised **"KoomBei Circle badge"** to their portfolio card / testimonial (not yet designed — a small amber pill would match the brand).
[ ] The circle page's longer body copy currently shows in **English under FR/ES/PT** (nav, footer, headings, teaser, and all pricing/form strings ARE translated; only the circle page's descriptive paragraphs fall back to English). Full circle-page translation is a quick follow-up if you want it 100% localized.

## Pricing decision needed

[ ] The new **E-commerce Setup** standalone service (`services.html` and `index.html`) is intentionally listed as "Custom quote" rather than a fixed price — I didn't want to invent a number without your sign-off. Decide on either a flat "from GHS X" figure or keep it quote-based, then update both pages.

## Notes

[ ] Confirm with user: should 'Active clients' stat be updated from 6+ to 8+ to reflect the full known client list?
[ ] Countries-served pills in the homepage globe section currently list only Ghana and Liberia (the two confirmed client locations from the portfolio). Add more as real clients are confirmed elsewhere — deliberately not padded with unconfirmed countries.
