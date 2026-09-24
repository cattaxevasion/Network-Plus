# Network+ 60-Day Tracker

A small personal dashboard for following the Dion Training **CompTIA Network+ (N10-009) 60-Day Study Plan**:
daily study → practice exams → objective tracking → weak areas → retakes.

Flashcards stay in your own app (Anki, Quizlet, …). This app only links to it.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

> This folder is inside OneDrive. `node_modules` has thousands of files, so consider pausing OneDrive sync
> while installing, or excluding `node_modules` from sync.

## Status

| Phase | State |
|---|---|
| 1–3 Requirements, screens, data model | Done |
| 4 UI prototype | Done |
| 5 MVP | **Done: saved in this browser (localStorage), first-run setup, sample-data mode, backup export/import, reset** |
| 6 Persistence | **Code done: Supabase sync + GitHub sign-in + RLS. Needs your Supabase project (below)** |
| 7 Polish | GitHub Pages deploy, loading/error states |

## Where things are

```
src/
  config/
    practiceExam.ts practice exam settings (see below)
    supabase.ts     cloud sync URL + anon key (empty = browser only)
  data/
    plan.ts         60-day plan, verbatim from the Study Plan PDF (p.12–13)  <- source of truth
    steps.ts        daily steps from the PDF (videos p.4, exams p.5, retakes p.6)
    objectives.ts   25 official N10-009 objectives (CompTIA Exam Objectives v4.0)
    glossary.ts     official acronym list, ports table, objective topics
    sample.ts       demo data for the prototype
  lib/
    types.ts        user data model (StudyDay, StudySession, PracticeExam, ObjectiveResult, Settings)
    progress.ts     "today" = first unfinished plan day; calendar day is reference only
    tracking.ts     objective or domain list, based on the config
    weakness.ts     Weak / Moderate / Strong calculation
    exams.ts        tracking-chart lists, retake suggestions
  state/
    store.tsx       app state + actions; saves after every change
    storage.ts      localStorage + backup validation
    backend.ts      local / Supabase backends (versioned saves)
    auth.ts         GitHub sign-in via Supabase Auth
    fakeCloud.ts    in-browser fake cloud for automated tests only (VITE_FAKE_CLOUD=1)
  components/       ResultCountsInput (exam form counts), charts, layout
  pages/            Dashboard, Plan, Day, Exams, Exam form, Weak Areas, Settings
```

## Your data

- **Cloud sync off** (`src/config/supabase.ts` empty): saved in this browser's localStorage only.
- **Cloud sync on**: saved to your Supabase account after sign-in with GitHub, synced across devices.
  On first sign-in, anything saved in the browser is moved into the account (a copy stays in the browser).
- If two devices edit at once, the later save is refused and you choose which version to keep.
- Settings → **Export backup** / **Import backup** work in both modes.
- "Look around with sample data" is never saved.

## Cloud sync setup (Supabase + GitHub sign-in)

All free. Dashboard menu names may differ slightly over time.

1. **Supabase project**: sign up at supabase.com → New project (region: Northeast Asia (Tokyo) is closest to Japan).
2. **Table + security**: SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. **GitHub OAuth app**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: `http://localhost:5173` (change to the GitHub Pages URL later)
   - Authorization callback URL: copy it from Supabase → Authentication → Sign In / Providers → GitHub
     (looks like `https://<project-ref>.supabase.co/auth/v1/callback`)
   - Register, then copy the Client ID and generate a Client secret.
4. **Enable GitHub in Supabase**: Authentication → Sign In / Providers → GitHub → enable, paste Client ID + secret → Save.
5. **Allowed redirect URLs**: Authentication → URL Configuration
   - Site URL: `http://localhost:5173/`
   - Redirect URLs: add `http://localhost:5173/` (and later `https://<user>.github.io/<repo>/`)
6. **Keys**: Project Settings → API: copy the Project URL and the anon (or publishable) key into `src/config/supabase.ts`.
   Never use the `service_role` / secret key in the app.
7. `npm run dev` → **Sign in with GitHub** once. This creates your account.
8. **Lock it down**: Authentication → Sign In / Providers → turn off **Allow new users to sign up**.
   From now on only your account can sign in.
9. Check: Table Editor → `app_data` has one row (yours), and RLS is shown as enabled.

Why this is safe to host publicly: the anon key is designed to be public. The table allows access only to a signed-in
user's own row (`auth.uid() = user_id`), anonymous access is revoked, and sign-ups are closed.

## Glossary

The Glossary page (and `src/data/glossary.ts`) holds the official CompTIA N10-009 Exam Objectives content, copied verbatim:
162 acronyms, the 20-row ports table from 1.4, and the topics under every objective. Nothing in it is written by the app.
Each acronym is linked to the objectives whose text mentions it (`src/lib/glossary.ts`, with a few manual overrides).

The same lists can be downloaded as Anki / Quizlet import files from the Glossary page. Copies are in `flashcards/`.

## Practice exam settings (edit after you see the real exams)

`src/config/practiceExam.ts` holds everything still unknown about the practice exams:

- `trackBy`: record questions per **objective** (1.1–5.5) or per **domain** (1.0–5.0).
- `weakAreaRules`: Weak / Moderate thresholds and the "recent" window.
- `retakesCountForWeakAreas`: whether retakes count toward weak areas.

The per-question input on the exam form is one component, `src/components/ResultCountsInput.tsx`,
so the input method can be replaced without touching other screens.

## Rules that are app design, not from the PDF

- Partial / skipped reasons: No time, Lost focus, Difficult topic, Unexpected event, Other.
- Weak areas (defaults in `src/config/practiceExam.ts`): first attempts only. Level = worse of overall accuracy and
  accuracy in the last 3 exams the item appeared in: < 70% Weak, < 85% Moderate, otherwise Strong;
  fewer than 3 questions = Not enough data.
- Retake suggestion order: exams retaken fewer times first, then lowest first-attempt score. You still choose.
