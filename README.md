# HappyStay — PG Finder near MUJ Jaipur

A student-focused PG listing site for Manipal University Jaipur. Browse verified hostels, view real photos and transparent pricing, and inquire directly via WhatsApp in one click.

---

## What's Built (MVP)

### Public browsing
- **PG listing grid** — all active PGs sorted by price, with cover photos, area, distance from MUJ, and gender tag
- **Smart filter bar** — filter by gender (Boys / Girls / Co-Living), max price, and room type; URL-driven so filters survive a page refresh; a clear button appears when any filter is active
- **PG detail page** — hero photo gallery (up to 4 images), address + distance from MUJ, gender and price badges, description, rooms & pricing table (type / AC / available beds / monthly price), and amenities pills
- **Sticky mobile CTA** — "Check Availability" button pinned to the bottom on small screens

### Inquiry flow
- **Inquiry form** — collects name, phone (validates 10-digit Indian mobile), move-in date, monthly budget, room preference, and free-text notes
- **Lead persistence** — inquiry is written to the Supabase `inquiries` table *before* WhatsApp opens, so the lead is never lost even if the redirect fails
- **WhatsApp redirect** — on submit, WhatsApp opens with a pre-filled message to the admin's number (`NEXT_PUBLIC_ADMIN_WHATSAPP`)

### Backend & infra
- **Supabase Postgres** — `pgs` table (JSONB amenities + room types, photo URL array) and `inquiries` table with RLS policies and indexes
- **ISR** — homepage and detail pages revalidate every 60 seconds; no full-page rebuilds needed
- **Seed data** — `supabase/seed.sql` inserts 3 sample PGs so you can test locally immediately

---

## What's Not Built Yet

These features are specced in `WorkFlow.md` and deferred intentionally for Phase 2+.

| Feature | Why deferred |
|---|---|
| **Phone OTP auth (3 roles: admin / owner / student)** | No PGs to manage yet — auth complexity would block launch |
| **Student dashboard** (`/student/dashboard`) | Students don't need an account to browse or inquire in Phase 1 |
| **Owner dashboard** (`/owner/dashboard` + `/owner/inquiries`) | Admin handles everything in Supabase Studio at ≤10 PGs |
| **Admin UI** (`/admin/dashboard`, `/admin/pgs`, `/admin/owners`) | Supabase Studio is sufficient; build when scale demands it |
| **WhatsApp Business API + auto-reply flow** | Single admin recipient — `wa.me` deep link is sufficient; Business API needed in Phase 2 when routing to individual owners |
| **Inquiry status tracking** (`new → checking → available → booked`) | No owner/student accounts to surface status to yet |
| **Multi-city routing** (`/[city]/[slug]`) | Hardcoded to MUJ for now; refactor when launching Kota |
| **Normalized DB schema** (separate `room_types`, `pg_photos`, `amenities` tables) | Single `pgs` table + JSONB works at current scale; normalize when needed |
| **Supabase Storage image uploads** | Photos are currently pasted HTTPS URLs; replace with Storage when building the admin form |
| **Razorpay payments** | No paid listings in Phase 1 |
| **SEO** (per-PG meta tags, sitemap, `LocalBusiness` structured data) | Phase 2 once content volume justifies it |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database / Storage | Supabase (Postgres) |
| Deployment | Vercel |

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier).
2. Open **SQL Editor** → paste contents of [supabase/schema.sql](supabase/schema.sql) → Run.
3. (Optional) Paste [supabase/seed.sql](supabase/seed.sql) → Run to get 3 sample PGs.
4. **Project Settings → API** → copy the **Project URL** and **anon public** key.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_ADMIN_WHATSAPP=919876543210   # your number, no + or spaces
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How an inquiry works

1. Student opens `/pg/sharma-pg`
2. Clicks **Check Availability** → goes to `/inquiry/sharma-pg`
3. Fills out the form (name, phone, move-in date, budget, room preference, notes)
4. On submit:
   - Inquiry is saved to the Supabase `inquiries` table
   - WhatsApp opens with a pre-filled message to your number
5. You see the message → confirm with the PG owner → reply to the student

---

## Adding a new PG (admin workflow)

Use **Supabase Studio → Table Editor → `pgs` → Insert row**:

| Column | Notes |
|---|---|
| `slug` | URL-friendly, unique (e.g. `sharma-pg`) |
| `name`, `description`, `address`, `area` | Display text |
| `distance_km` | Distance from MUJ campus (number) |
| `gender` | `boys` / `girls` / `both` |
| `starting_price` | Lowest monthly rent (integer ₹) |
| `owner_name`, `owner_phone` | Phone in international format, e.g. `919876543210` |
| `amenities` | JSON object — `{"wifi":true,"food":true,"ac":false,...}` |
| `room_types` | JSON array — `[{"type":"double","price":7500,"ac":false,"available":4}]` |
| `photos` | JSON array of HTTPS image URLs |
| `is_active` | `true` to publish |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. Add the same 3 env vars under **Settings → Environment Variables**.
4. Deploy. Point your domain (e.g. `happystay.in`) at it.

---

## Project structure

```
app/
  layout.tsx                # site shell (nav, container)
  page.tsx                  # homepage — PG grid + hero + filters
  not-found.tsx
  pg/[slug]/page.tsx        # PG detail page
  inquiry/[slug]/
    page.tsx                # inquiry page shell
    InquiryForm.tsx         # form + Supabase insert + WhatsApp redirect
components/
  PGCard.tsx                # listing card (photo, name, area, price)
  Filters.tsx               # URL-driven gender / price / room filters
lib/
  supabase.ts               # Supabase client
  types.ts                  # PG, RoomType, Amenities types
  whatsapp.ts               # wa.me link builder (Phase 1/2 switch is commented inside)
supabase/
  schema.sql                # tables, indexes, RLS policies
  seed.sql                  # 3 sample PGs
```

---

## Phase 2 roadmap (rough order of value)

1. Supabase Storage image uploads in an admin form (replace pasted URLs)
2. Owner dashboard with phone OTP login — build when 5+ owners ask for it
3. Route WhatsApp to `pg.owner_phone` — see `lib/whatsapp.ts`, the one-line switch is already commented
4. Multi-city URLs when launching a second campus — add `city_slug` column, rename route to `/[city]/[slug]`
5. Inquiry status flow (new → checking → available/not-available → booked) + student notifications
6. Razorpay for listing fees (₹3k peak / ₹299 off-season)
7. SEO — per-PG meta tags, sitemap, `LocalBusiness` structured data
