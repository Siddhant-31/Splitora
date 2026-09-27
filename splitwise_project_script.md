# SplitWise AI — Project Script

## 1. What is this?

A full-stack expense-splitting app for groups (roommates, trips, teams)
that removes manual data entry and manual settlement — the two most
tedious parts of using a tool like Splitwise. Instead of filling out a
form for every expense and manually tracking who paid whom back, users
type or photograph an expense and the app parses it into a structured
split automatically; when it's time to settle up, a real payment moves
between the two people instead of just flipping a "paid" flag.

In one line: **an AI-powered expense splitter where entering an expense
is a sentence or a photo, not a form, and settling a debt is an actual
payment, not a checkbox.**

---

## 2. Why does this exist? (the problem it solves)

Every group-expense app has the same friction points:

- **Manual entry is annoying.** Every dinner, every cab ride, every
  shared bill means opening the app, typing an amount, picking who paid,
  picking who's included, picking a split type. Most people stop logging
  expenses within a week because of this friction.
- **"Mark as paid" isn't actually paid.** Splitwise and similar apps
  track debt but don't move money — someone still has to leave the app,
  open a separate UPI/bank app, send money, and remember to come back and
  mark it settled. That extra step is where balances go stale.
- **Balances lag behind reality.** Traditional apps refresh on demand;
  in a live group (splitting a trip in real time) everyone should see
  the same numbers instantly, not after a manual refresh.
- **Insights are static.** Most apps show a bar chart. Nobody reads it.

This project's premise: if logging an expense takes the same effort as
sending a text message, and settling a debt happens in the same flow as
confirming it, people will actually use the tool consistently — instead
of accumulating a backlog of untracked IOUs.

---

## 3. How it works — the full pipeline

### Step 1 — Auth and group setup
- User signs in via **Clerk** (handles login, session, and user identity
  — no custom auth code to maintain).
- User creates or joins a group (roommates, a trip, a recurring team
  lunch fund).

### Step 2 — Logging an expense (two entry paths)

**Path A — natural language.**
User types something like *"Dinner 1200, split between me and Rahul"*.
This text is sent to a **Convex Action**, which calls **Gemini** with a
prompt instructing it to return strict structured JSON: amount, payer,
participants, and split type (equal, exact amounts, percentage). That
JSON is validated and used to pre-fill the expense-creation form for the
user to confirm before it's saved.

**Path B — receipt photo (OCR + AI extraction).**
User photographs or uploads a receipt. The image is:
1. Compressed client-side and uploaded to Convex file storage.
2. Sent from a Convex Action to Gemini's multimodal model, which reads
   the image directly (no separate OCR engine needed) and returns
   structured JSON: merchant, date, line items, tax, total, and a
   **confidence score**.
3. If confidence is high, the extracted fields pre-fill the expense
   form. If low (blurry photo, non-receipt image), the app falls back to
   an empty form rather than guessing.
4. The user always reviews and confirms the parsed data before it's
   saved — AI output is a draft, never an auto-committed transaction,
   since a silent misparse would corrupt the group's balances.

### Step 3 — Real-time balance sync
Because the backend is **Convex** (a real-time BaaS, not a traditional
REST API with polling), the moment an expense is saved, every group
member's balance view updates instantly — no manual refresh, no stale
numbers mid-conversation. This matters most in the exact moment it's
used: splitting a bill at the table while everyone's looking at their
phone.

### Step 4 — Settling up (real payment, not a status flag)
When a user chooses to settle a debt:
1. A Convex Action creates a payment intent — a **Stripe** PaymentIntent
   or a **UPI** deep link/QR — for the exact amount owed.
2. The payer completes the transfer through the gateway's own checkout
   flow.
3. The gateway sends a **webhook** back to a Next.js API route, which
   **verifies the webhook signature** before trusting it — the
   client-side "success" redirect alone is never trusted, since it can
   be spoofed or interrupted.
4. Only after the verified webhook fires does a Convex mutation record
   the settlement — as a **new transaction record** (amount, payer,
   payee, gateway reference ID, timestamp), not by overwriting a balance
   number. Balances are *derived* from transaction history, so they can
   never silently drift out of sync.
5. The mutation is **idempotent**, keyed on the gateway's event ID — so
   if the webhook fires twice for the same event (which payment gateways
   do), the debt isn't double-settled.
6. **Partial settlements** are supported — a user can pay less than the
   full amount owed, reducing the balance rather than requiring one
   lump-sum clearance.

### Step 5 — Insights and reminders
- Because Gemini has direct query access to the group's expense data (via
  Convex Actions), it can generate natural-language summaries — spending
  trends, biggest contributor, unusual patterns — instead of a static
  chart.
- **Inngest** runs scheduled background jobs that send automated,
  context-aware email reminders (*"You still owe ₹450 for Friday's
  dinner"*) rather than a generic "you have a pending balance" nudge.

---

## 4. What's used, and what each piece does

| Layer | Technology | What it's doing here |
|---|---|---|
| Frontend framework | Next.js (App Router) | Routing, server/client components, UI |
| Styling / components | Tailwind CSS, Shadcn UI | Responsive design system |
| Auth | Clerk | Login, session, user identity |
| Backend / data | Convex (BaaS) | Real-time data sync, serverless functions (Actions/mutations), file storage |
| AI | Gemini AI | Expense-text parsing, receipt OCR + extraction, spending insights |
| Payments | Stripe / UPI | Real money transfer for settlements |
| Background jobs | Inngest | Scheduled, automated email reminders |
| Language | TypeScript | End-to-end type safety, client to backend |

---

## 5. Features and how they're used

- **Natural-language expense entry** — Gemini converts a typed sentence
  into a structured split, removing the multi-field form for the common
  case.
- **Receipt OCR + AI extraction** — Gemini's multimodal capability reads
  a photographed receipt directly and proposes a structured expense,
  covering the "logging in the moment" use case a text box can't.
- **Real-time balance sync** — Convex pushes updates to every group
  member instantly as expenses and settlements happen.
- **Real payment settlement** — UPI/Stripe integration means "settle up"
  actually moves money, verified via webhook and recorded as an
  immutable transaction, with idempotency and partial-payment support.
- **AI spending insights** — natural-language summaries generated
  on-demand from live group data, not a static dashboard.
- **Automated, context-aware reminders** — Inngest-scheduled emails that
  reference the actual pending amount and expense, not a generic nudge.

---

## 6. Advantages over other Splitwise-style apps

**Input effort is the core differentiator.** Most apps require a
multi-field form for every expense. Here, a sentence or a photo is
enough — the AI does the structuring.

**It actually moves money.** Splitwise (even Pro, in most regions) still
just tracks who owes whom — it doesn't settle the debt for you. This app
closes that gap with real UPI/Stripe payments, verified and recorded as
an auditable transaction history rather than a mutable "paid" flag.

**Real-time by architecture, not by polling.** Balance updates propagate
instantly because the backend is built for real-time sync, not because
the client refreshes on a timer.

**Generative insights, not static charts.** The AI has direct access to
the data, so it can answer "who spent the most on food this month" in a
sentence instead of requiring the user to read a graph.

**Trustworthy AI-assisted entry.** Every AI-parsed expense (text or
receipt) is shown as an editable draft before it's saved — the app gets
the speed benefit of automation without the risk of a bad parse silently
corrupting a shared ledger.

**Built to be shaped, not fixed.** As a from-scratch build, features can
be tailored to a specific group's actual needs (a flatmate house, a trip
fund) in ways a general-purpose commercial app doesn't.

---

## 7. Honest limitations

- Payment settlement currently supports Stripe/UPI specifically — not a
  universal payment method across regions.
- OCR extraction quality depends on receipt photo clarity; the
  confidence-gated fallback avoids bad auto-fills but still requires
  user review on low-confidence scans.
- No debt-simplification algorithm yet (minimizing the number of
  transactions needed to clear a group's balances) — settlements are
  currently pairwise.

---

## 8. In one sentence, to someone non-technical

*"You type or photograph what you spent, the AI figures out how to split
it and shows everyone the updated balance instantly, and when it's time
to settle up, real money actually moves — not just a checkbox."*
