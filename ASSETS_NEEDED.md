# ASSETS NEEDED

Running checklist of placeholder assets used in the rebuild. Replace each placeholder with a real asset when available, then mark it done.

## Forms backend: Web3Forms (migrated from Formspree)

All three forms (contact, review, KoomBei Circle) now submit to **Web3Forms** (`https://api.web3forms.com/submit`) using the access key `f33c3119-d8ec-4bf2-bcf7-932cb7e553ca`, embedded as a hidden field in each form. That key is **public by design** — it can only route mail to your registered inbox, so having it visible in the HTML is normal and safe. Each form carries its own `subject` line ("New project brief…", "New KoomBei review submission", "New KoomBei Circle membership request") so submissions are easy to tell apart in your inbox.

[ ] Web3Forms' free plan includes 250 submissions/month — plenty for now; watch for their quota emails if traffic grows
[ ] If spam ever gets heavy, Web3Forms supports adding **hCaptcha** for free — tell Claude and it's a small code change

## KoomBei Circle: real member accounts (Supabase)

The Circle now has genuine sign-up + login — magic-link email, no passwords — backed by a free Supabase project (`koombei-clients-membership`, EU region). **Two dashboard steps are required before this works; nothing will function until you do them:**

[ ] **Run the schema.** Open your Supabase project → **SQL Editor** → **New query** → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the `profiles` table and locks it down with Row Level Security: members can create exactly one row for themselves (always starting unapproved) and can only ever read their own row — they have **no update or delete access at all**, so there is no client-side path for anyone to approve their own membership. You approve a member by opening **Table Editor → profiles** and flipping their `approved` column to `true`.
[ ] **Allow the login redirect.** Open **Authentication → URL Configuration**. Set **Site URL** to `https://koombei.com`, and add both `https://koombei.com/pages/members.html` and (for local testing) `http://localhost:8848/pages/members.html` under **Redirect URLs**. Supabase rejects login links to any URL not on this list, so members.html's login will silently fail until this is set.

How it works day to day: someone fills the join form on `pages/circle.html` → gets emailed a magic link → clicking it lands them on `pages/members.html`, logged in, with their membership auto-created as **pending**. They see a "you're on the list" screen; you see the same request by email (via Web3Forms, same as before) *and* in the Supabase Table Editor. Flip `approved` to `true` when you've confirmed they're a real client, and next time they visit `members.html` they see the full members area (discounts, perks, community info).

**What I did not build, on purpose:**
- No password reset flow — there's no password to reset. Magic link is the only login method.
- No self-service profile editing — once a member's row exists, they can't change it (matches "only you can approve," but also means they can't fix a typo themselves; you can edit their row directly in the Table Editor if needed).
- `pages/members.html`'s body copy is currently **English-only** — the nav, footer, and the "Member Login" link everywhere else on the site are translated, but the login/pending/approved states themselves are not yet localized. Tell me if you want that finished.
- The **community WhatsApp link** and **site-health checklist** referenced on both `circle.html` and the approved-member view are still placeholders (same open item as before) — once you create them, paste the WhatsApp invite link into `pages/members.html`'s approved-state perk list.

## Security & spam protection

**Already live in the code (no action needed):** every form has three free defences layered in front of Web3Forms — the hidden `botcheck` honeypot (which Web3Forms also validates server-side and silently discards), a "time-trap" that rejects submissions faster than a human could fill them, and a 20-second cooldown against rapid repeat submits. All fields have length caps. The chatbot escapes anything a user types so no markup can be injected. `vercel.json` sends a strong set of security headers (HSTS, CSP, X-Frame-Options, COOP, Referrer-Policy, Permissions-Policy). External links use `rel="noopener noreferrer"`, and `.well-known/security.txt` gives researchers a way to report issues.

**Honest expectation:** the client-side layer stops the large majority of automated junk for free, and Web3Forms' server-side honeypot filtering handles most of the rest. No website is 100% spam-proof or "unhackable" — but for a static marketing site this is a strong, appropriate posture. If spam ever becomes heavy despite all this, the next step up is the free hCaptcha integration above.

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

The homepage "Client stories" section (`index.html`, `#client-stories`) has a live "Leave a review" form (star rating + name/role + review text). It submits via Web3Forms to your email, with the subject "New KoomBei review submission" so it's easy to spot.

[ ] Check your email periodically for new review submissions
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

New page: `pages/circle.html`, linked from every footer + a homepage teaser + the chatbot. Free membership for existing clients; the join form submits via Web3Forms to your email with the subject "New KoomBei Circle membership request". The discovery form also gained a "Referred by a KoomBei Circle member?" field.

[ ] **Set up the private community group** (WhatsApp) the Circle page promises, and send the invite link when you confirm a membership.
[ ] **Write the members-only resource** the page promises (a site-health checklist + plain-English SEO tips). Until it exists, don't send it — or soften that benefit line.
[ ] Decide the exact **"next project" discount** — the page says "10-15%". Pick a firm number when you quote returning members, or leave the range.
[ ] When you feature a member, add the promised **"KoomBei Circle badge"** to their portfolio card / testimonial (not yet designed — a small amber pill would match the brand).
[ ] The circle page's longer body copy currently shows in **English under FR/ES/PT** (nav, footer, headings, teaser, and all pricing/form strings ARE translated; only the circle page's descriptive paragraphs fall back to English). Full circle-page translation is a quick follow-up if you want it 100% localized.

## Pricing decision needed

[ ] The new **E-commerce Setup** standalone service (`services.html` and `index.html`) is intentionally listed as "Custom quote" rather than a fixed price — I didn't want to invent a number without your sign-off. Decide on either a flat "from GHS X" figure or keep it quote-based, then update both pages.

## Case studies (live now, `pages/work/`)

Four dedicated case-study pages are live: **SWK Ghana**, **RuboLink**, **Timoya Farms**, **Lafie Plus**. Each follows problem → what we built → impact, with a before/after comparison, a live screenshot frame, and its own `Article` + `BreadcrumbList` JSON-LD. The matching portfolio cards now have an inline "The story behind it" panel that expands to a short summary and links through.

**Important honesty note:** the impact figures on these pages are deliberately *qualitative or structurally verifiable* ("6+ cities", "2 payment rails", "one monitored inbox", "12 months hosting managed"). I did **not** invent traffic, revenue, or conversion numbers for real clients. If you can get real metrics, they will make these pages far stronger:

[ ] Ask SWK Ghana for anything quotable, e.g. funding applications submitted since launch, volunteer enquiries received, or a one-line testimonial
[ ] Ask Timoya Farms whether the site brought in buyers who had not met them before
[ ] Pull real RuboLink numbers you already own (bookings completed, professionals onboarded, cities live) and swap them into the impact grid
[ ] Each page has a `.cs-quote` pull-quote currently filled with a KoomBei-voice line. Replace with a **real client quote** wherever you can get one, and update the `<cite>` to their name and role
[ ] Consider case studies for The Climate Sociologist and SWK Marketplace once those are further along, using the same four files as a template

## Blog (live now, `blog/`)

The blog hero was previously the plain dark box every inner page uses (`.page-hero`, ~360px, no image), which is why it looked broken. It's now a full-height (`100vh`) hero reusing the site's approved brand photo (`Gemini_Generated_Image_ep12qxep12qxep12_yyqgcu.png`, the same one homepage uses), with the standard sanctioned overlay gradient, a badge, and a scroll indicator, matching the pattern `pages/portfolio.html` already used. I could not upload a new photo since I have no access to the Cloudinary account, so this reuses an existing approved asset rather than introducing a placeholder or a broken URL.

[ ] Consider commissioning a dedicated blog/editorial photo (people writing, working, a laptop and notebook) so the blog hero looks distinct from the homepage hero rather than reusing the same image with a different crop

Six articles are now published (was three), plus `blog/posts/POST_TEMPLATE.html` for future ones. The template is `noindex` and disallowed in `robots.txt`; the copy instructions are in the comment block at the top of the file. New since this pass:

- **What AI can actually do for a small NGO right now** — the current featured/newest post
- **A website is not a substitute for social media, and neither is the reverse** — ties directly into the new social handles
- **Why Mobile Money changed what a website needs to do** — cross-links to the RuboLink case study

[ ] To add a post: copy `POST_TEMPLATE.html` in place, fill every `{{PLACEHOLDER}}`, flip its robots meta to `index, follow`, add a `.blog-card` to `blog/index.html`, and add the URL to `sitemap.xml`
[ ] All six posts are written in KoomBei's voice but are **unsigned by a person**. If you want them attributed to you by name, add a byline and update the `author` in each page's JSON-LD from `Organization` to `Person`
[ ] Blog post body copy is **English-only** under FR/ES/PT (nav and footer translate; article text falls back to English). Same known limitation as the circle page

**On "real-time" content and showing up when people search trending topics**, two honest limits worth knowing:

1. This is a static site with no build step or backend (by design, per the project's own constraints). That means content cannot literally update itself the moment someone searches, the way a news aggregator or a site with a live feed would. What I did instead is write genuinely current, dated articles and keep the newest one featured, which is the realistic version of "fresh" for a site like this.
2. Writing good content does not by itself make Google show it. The site needs to actually be indexed. That requires:
   [ ] Verify koombei.com in [Google Search Console](https://search.google.com/search-console) (free, needs your Google account)
   [ ] Submit `sitemap.xml` there once verified
   [ ] Link to the site from the new social profiles (X, Facebook, Instagram, LinkedIn), since backlinks from your own accounts help discovery
   
   None of this needs code, but none of it happens without someone with account access doing it. I cannot do it remotely.

## Social media (live now)

Added KoomBei's X, Facebook, Instagram, and LinkedIn to every page footer (icon row, opens in a new tab) and to the homepage's `Organization` JSON-LD `sameAs` field, which helps Google associate the accounts with the brand.

[ ] The Facebook link you gave me is a `/share/...` link (a mobile share redirect), not a vanity URL like `facebook.com/koombei`. It works, but if you have or can claim a proper vanity URL for the Page, that would look more professional and is worth swapping in
[ ] Same handles are only in the footer for now; consider whether you also want them in the nav or a dedicated "follow us" prompt inside the chatbot

## Free consultation CTA (live now)

`pages/contact.html#consult` is a new lower-commitment entry point, offering WhatsApp, email, or the full form. Every "Book a free consultation" button across the site targets it.

[ ] This promises a free, no-obligation conversation including "we'll tell you if you should wait." Make sure you're happy to honour that literally, since the copy leans on it hard

## Gift KoomBei (live now, homepage `#gift` + footer link on every page)

A voluntary-gift checkout powered by Paystack, on the homepage below the main CTA. Preset amounts (GHS 50/100/200/500) or a custom amount, plus the giver's email for the receipt. Charges are in GHS via card, Mobile Money, or bank; Paystack's script only loads when someone actually clicks, so page weight is unchanged.

**How the money works:** every completed gift lands in your Paystack dashboard like any other Paystack payment, with reference `KBGIFT-...` and a "Gift to KoomBei via koombei.com" metadata field so you can tell gifts apart from anything else. Settlement to your bank/MoMo follows your Paystack payout settings.

**Key safety facts:**
- The key in `js/gift.js` is your **public** key (`pk_live_`). It is public by design, like the Web3Forms key: it can only pay money IN. Safe in the repo.
- Your **secret** key (`sk_live_`) must never be pasted into chat, the repo, or any client-side file. It stays in the Paystack dashboard only.
- Because gifts are voluntary amounts with nothing delivered in exchange, no server-side verification is needed. If you ever sell products through Paystack, that flow WILL need a server to verify transactions with the secret key before releasing anything.

[ ] Make one small real gift yourself end-to-end (e.g. GHS 5 via MoMo), confirm it appears in the Paystack dashboard, then refund it from the dashboard if you like
[ ] In Paystack dashboard, check Settings for email receipts so givers get an automatic receipt
[ ] The gift section copy is English-only under FR/ES/PT for now (same known pattern as other new copy)

## SEO and AI optimization (done August 2026)

- The long-standing cleanUrls mismatch is **fixed**: every canonical, og:url, JSON-LD URL, and sitemap entry is now extensionless (`/pages/about`, `/blog`, ...), matching what Vercel actually serves instead of a URL that 308-redirects. 87 URLs updated.
- Homepage now carries **FAQPage** schema (all 10 FAQ answers, machine-readable for Google rich results and AI assistants).
- Services page now carries **Service + OfferCatalog** schema with the three packages, and about/portfolio/contact/circle each carry **BreadcrumbList**. Combined with the existing Organization/WebSite/Article/BlogPosting blocks, all five schema types required by the project conventions are now present.
- **`/llms.txt`** added at the site root: a structured plain-text summary of KoomBei for AI assistants and their crawlers (the emerging llms.txt convention). Update it when packages or key pages change.
- Stats corrected to reality: 10+ active clients, 11 live websites (was 6+/4+, stale since the portfolio grew).

[ ] Optional remaining step: internal `<a href>` links still use `.html` and get a cheap 308 redirect on the live site. Harmless for SEO now that canonicals are clean, but removing the hop means rewriting every internal link AND teaching the local preview server to resolve extensionless paths. Say the word if you want it.
[ ] Still the single highest-impact SEO action, and only you can do it: verify koombei.com in Google Search Console and submit sitemap.xml (see the Blog section above).

## Notes

[ ] Confirm with user: should 'Active clients' stat be updated from 6+ to 8+ to reflect the full known client list?
[ ] Countries-served pills in the homepage globe section currently list only Ghana and Liberia (the two confirmed client locations from the portfolio). Add more as real clients are confirmed elsewhere — deliberately not padded with unconfirmed countries.
