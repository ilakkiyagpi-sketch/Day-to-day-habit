# Kudumbam · குடும்பம்

A private family-care app for **Amma**, **Appa** and **Ilakkiya** (admin): medicines, health, day planning,
reading and more, in **Tamil and English**, designed for people in their late 50s and 60s.

> ⚠️ This app is a reminder and tracking helper, **not medical advice**. Always follow the doctor's
> instructions. In an emergency, call **108**.

## Build status

| Phase | What | Status |
|---|---|---|
| 1 | Foundation: Expo app, Supabase schema + RLS, sign-in + PIN, Tamil/English, senior-friendly theme, home screens, role-based routing | ✅ done |
| 1.1 | Name changed to Ilakkiya, smaller text + Small/Normal/Large/Extra-large sizes with A− / A+ on the home screen, **payment reminders** (rent, medical, LIC, other) | ✅ done |
| 2 | Health core: medicine alarm with live-photo proof, vitals, mood, habits, check-in, SOS, push | next |
| 3 | Ilakkiya's dashboard: live status, alerts, photo review, settings, trends, remote reminders and plans | |
| 4 | Amma's planner: voice day plan, calendar, backward planning, question papers | |
| 5 | Appa's space: bookshelf, reading log, astrology notes, panchangam, grandchild mode | |
| 6 | Extras: appointments, documents, refills, Thirukkural, brain games, photos, PDF export | |
| 7 | Tests and full docs | |

## What's in Phase 1

- **Sign-in once, then PIN.** Email → 6-digit code, then a 4-digit PIN (or fingerprint/face). The session lasts for months.
  The app locks again after 5 minutes in the background.
- **Two home layouts by role:**
  - Amma/Appa: bottom bar with **Today · Health · My Space · Help** (big icons, always with text).
    Today shows up to 6 cards: next medicine, checklist (tick with 10-second **Undo**), mood faces, day plan (Amma) or reading (Appa),
    a big **"I'm okay"** button and a Thirukkural. Every card has **Read aloud**.
  - Ilakkiya: **Family · Payments · Plans · Settings**. Family shows one status card per parent, payments due and the alerts.
- **Help/SOS screen:** call Ilakkiya, ambulance 108, share location by SMS, nearest hospital, doctor, Medical ID card.
- **"What Ilakkiya sees"** screen so the parents know exactly what is shared.
- **Settings:** language (தமிழ் / English), text size (Small / Normal / Large / Extra large), colours (light / dark / same as phone).
- **Text size buttons (A− / A+)** at the top of the home screen, so anyone can make letters smaller or bigger without opening Settings.
  The choice is saved on the profile, so Ilakkiya can also change it for Amma or Appa.

## Payment reminders (rent, medical, LIC)

- Add a payment with big buttons: **type** (Rent / Medical / LIC-Insurance / Other), name, **amount in ₹**, **due date** (− / + buttons for day, month, year),
  **how often** (once, every month, every 3 months, every 6 months, every year), **when to remind** (1, 3 or 7 days before),
  **how to pay** (cash / online / cheque) and whom to pay (house owner, LIC agent, pharmacy…).
- The phone reminds at **9 am**: a few days before, the day before and on the due day, and once more the next morning if it isn't marked paid.
  These reminders are scheduled on the phone itself, so they work without internet.
- Tap **Paid ✓** when it's paid (10-second Undo). Monthly/yearly payments move to the next due date. One-time payments are marked done.
  Every payment is kept in a history (`payment_logs`).
- Amma/Appa see payments due this week on their **Today** screen and all of them under **My Space → Payments**.
- Ilakkiya has a **Payments** tab with everyone's payments (with names), can add them for Amma or Appa, and sees "Payments due" on the Family screen.
- **Database:** every table from the spec, with Row Level Security, private photo/document buckets and realtime.
  Each parent sees only their own data. Ilakkiya sees and manages linked parents. Spouse sharing is opt-in.
- **Demo mode:** without Supabase keys, the app runs with sample data so you can try it straight away.

Data on the Today screen is still sample data in Phase 1. Saving to the database starts in Phase 2.

---

## Try it on your computer (5 minutes)

You need [Node.js 20 or newer](https://nodejs.org).

```bash
npm install
npx expo start --web     # opens in the browser, in demo mode
```

Pick "Open as Amma / Appa / Ilakkiya", choose any 4-digit PIN, and look around.

## Set up the real backend (Supabase, free tier)

1. Create a free project at [supabase.com](https://supabase.com). Pick the **Mumbai** region.
2. **Create the tables:** open **SQL Editor**, paste the whole of
   `supabase/migrations/20261125000000_init.sql` and click **Run**. Then do the same with
   `supabase/migrations/20261126000000_payments_and_text_size.sql`.
3. **Turn off public sign-ups** (only the family should get in): **Authentication → Sign In / Providers → Email**:
   keep Email enabled and turn off "Allow new users to sign up".
4. **Make the email send a code:** in **Authentication → Emails → Templates → Magic Link**, make sure the
   template includes `{{ .Token }}` (for example: `Your Kudumbam code is {{ .Token }}`).
5. **Add the family:** **Authentication → Users → Add user → Create new user** for Ilakkiya, Amma and Appa
   (their real email addresses, tick "Auto confirm").
6. **Link everyone:** open `supabase/seed.sql`, replace the three example emails, paste it into the **SQL Editor** and run it.
   Then edit the medicines, BP ranges and phone numbers to the real ones (Table Editor).
7. **Connect the app:** copy `.env.example` to `.env` and fill in the **Project URL** and **anon public key**
   from **Project Settings → API**.

> Phone-number (SMS) sign-in needs a paid SMS provider (for example Twilio), so it is off.
> Email codes are free. Say the word if you want SMS added.

## Install on the parents' Android phones

The app needs a real build (not Expo Go) because of the medicine alarm coming in Phase 2.

1. Create a free account at [expo.dev](https://expo.dev), then on your computer:
   ```bash
   npm install -g eas-cli
   eas login
   eas init                         # links this project to your Expo account
   eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROJECT.supabase.co --environment preview
   eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR-ANON-KEY --environment preview
   eas build --platform android --profile preview
   ```
2. When the build finishes, Expo shows a link and a QR code. Open it on the parent's phone, download the **APK**,
   and allow "Install unknown apps" when Android asks.
3. Open Kudumbam, choose தமிழ், enter their email and the code from the email, and set a 4-digit PIN with them.

## iPhone

The app runs on iPhone too (`eas build --platform ios`, needs an Apple Developer account at $99/year).
iPhone limits for the strict medicine alarm will be written down here in Phase 2.

---

## For developers

```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm test                 # unit tests (Jest)
supabase/tests/run.sh    # schema + RLS + seed tests on a local Postgres (needs psql)
```

- **Stack:** Expo SDK 58 + Expo Router (TypeScript), NativeWind 4, Supabase, i18next.
- **Layout:**
  - `src/app/` routes: `sign-in`, `pin`, `(parent)/…`, `(admin)/…`. Guards are in `src/app/_layout.tsx`.
  - `src/components/` senior-friendly building blocks: `AppText`, `BigButton`, `Card`, `SpeakButton`, `Toast` (undo), `PinPad`, `ChoiceRow`.
  - `src/theme/`: colour palettes (WCAG AA in light and dark), type scale (18px minimum), preferences.
  - `src/i18n/en.json`, `ta.json`: every string shown on screen.
  - `src/lib/`: Supabase client, auth, PIN, helpers.
  - `supabase/migrations/`: schema and RLS. `supabase/seed.sql`: family setup.
- **Rules:** use `AppText`, never `Text`. Put new strings in both JSON files. Tap targets are at least 56px.
  Every icon has a text label. Every tick or delete gets an Undo toast.
