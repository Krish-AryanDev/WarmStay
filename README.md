# StudentPG — Lean MVP

Find PGs near MUJ Jaipur. Browse listings, view details, inquire on WhatsApp.

## What's in this MVP (and what's not)

**Built:** public PG browsing, detail pages, WhatsApp-based inquiry, Supabase backend.

**Deliberately deferred** (per Senior Dev review of `WorkFlow.md`):

| Spec'd | Status | Why deferred |
|---|---|---|
| Phone OTP auth (3 roles) | Not built | No PGs to manage yet — auth blocks launch |
| WhatsApp Business API | Replaced with `wa.me` deep link | Phase 1 = single recipient (admin) — Business API is overkill |
| Owner dashboard | Not built | `MonetizationPlan.md` says admin handles everything in Phase 1 |
| Admin UI | Use Supabase Studio | 10 PGs don't need a custom CRUD |
| Multi-city routing | Hardcoded to MUJ | Refactor `/pg/[slug]` → `/[city]/[slug]` when you launch Kota |
| Normalized tables | Single `pgs` table + JSONB | Refactor when scale demands it |
| Razorpay | Not built | No paid listings in Phase 1 |

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + storage)
- Vercel (deploy)

## Setup (10 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier).
2. Open **SQL Editor** → paste contents of [supabase/schema.sql](supabase/schema.sql) → Run.
3. (Optional) Paste [supabase/seed.sql](supabase/seed.sql) → Run, to get 3 sample PGs.
4. Project Settings → API → copy the **Project URL** and **anon public** key.

### 3. Configure env vars

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_ADMIN_WHATSAPP=919876543210   # your number, no + or spaces
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How a student inquiry flows

1. Student opens `/pg/sharma-pg`
2. Clicks **Check Availability** → goes to `/inquiry/sharma-pg`
3. Fills form (name, phone, move-in, budget, room pref, notes)
4. On submit:
   - Inquiry is saved to Supabase `inquiries` table (so you have the lead even if WhatsApp fails)
   - WhatsApp opens with a pre-filled message to **your** number
5. You see the message → check with the PG owner → reply Yes/No → connect them

## Adding a new PG (admin workflow)

For the first 10 PGs, just use **Supabase Studio**:

1. Open your project → Table Editor → `pgs` → Insert row.
2. Fields:
   - `slug` — URL-friendly (e.g., `sharma-pg`). Must be unique.
   - `name`, `description`, `address`, `area`, `distance_km`
   - `gender` — `boys` / `girls` / `both`
   - `starting_price` — lowest monthly rent (integer rupees)
   - `owner_name`, `owner_phone` (international format, e.g. `919876543210`)
   - `amenities` — JSON, e.g. `{"wifi":true,"food":true,"ac":false,...}`
   - `room_types` — JSON array, e.g. `[{"type":"double","price":7500,"ac":false,"available":4}]`
   - `photos` — JSON array of image URLs (upload to Supabase Storage or paste any HTTPS URL)
   - `is_active` — `true` to publish

When you scale past ~30 PGs, build an admin UI. Not before.

## Deploying to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. Add the same 3 env vars in **Settings → Environment Variables**.
4. Deploy. Point your domain (e.g., `studentpg.in`) at it.

## What to build next (Phase 2)

In rough order of value:

1. **Image uploads via Supabase Storage** in the admin form (replace pasted URLs).
2. **Owner dashboard** with phone OTP login (only when 5+ owners ask for it).
3. **Switch WhatsApp routing** to `pg.owner_phone` — see `lib/whatsapp.ts`, the comment shows the one-line change.
4. **Multi-city URLs** when launching Kota: rename `/pg/[slug]` → `/[city]/[slug]`, add `city_slug` column.
5. **Razorpay** for listing fees (₹3k peak / ₹299 off-season per `MonetizationPlan.md`).
6. **SEO** — meta tags per PG, sitemap, structured data (`LocalBusiness`).

## File map

```
app/
  layout.tsx              # site shell
  page.tsx                # homepage (grid + filters)
  not-found.tsx
  pg/[slug]/page.tsx      # PG detail
  inquiry/[slug]/
    page.tsx              # inquiry shell
    InquiryForm.tsx       # form + WhatsApp redirect
components/
  PGCard.tsx
  Filters.tsx
lib/
  supabase.ts             # client
  types.ts                # PG / RoomType / Amenities
  whatsapp.ts             # wa.me link builder + Phase 1/2 switch
supabase/
  schema.sql              # tables, indexes, RLS
  seed.sql                # 3 sample PGs
```
