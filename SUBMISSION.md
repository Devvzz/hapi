# Hapi – submission

Code built 7–12 Nov 2026; dataset researched before the event (31 Oct – 6 Nov); assisted by AI in coding.

- **Live app:** [after deploy] (add `?demo=1` to try everything with a sample student)
- **Repository:** https://github.com/Devvzz/hapi (MIT)
- **Video:** [after recording]
- **PayPal:** sandbox only, no real money moves

## Inspiration

Students in smaller countries can qualify for hackathons, scholarships, certificates and universities abroad, but the information is spread over hundreds of sites. The money is even harder: fees, tests, visas and proof of funds rarely appear in one place, and families often help pay. Hapi puts what a student can apply to, what it really costs and who can help pay in one honest place.

## What it does

- **Opportunities feed:** 191 checked opportunities, free and paid, each with its source link, dates and price. Unknown dates show "TBA".
- **Matching:** code scores each item against the student's profile, then Gemini writes a short "why this fits you" line from those facts only.
- **Find more with AI:** Gemini with Google Search suggests more, always tied to a source and marked "unverified".
- **University eligibility:** 555 bachelor programmes in Austria, Germany and Italy, checked against language level and budget.
- **Real total cost:** an editable AG Grid plan with totals and a sponsored progress bar.
- **Family sponsorship with PayPal:** the student asks in their own words, Gemini drafts the invoice, and an approval card shows exactly what will be sent. Only the Approve button sends it through the PayPal Agent Toolkit. The status (sent, paid) updates in the plan.
- **Hapi Premium:** a €2.99/month PayPal subscription. The server checks that it is ACTIVE before the weekly coach answers.
- **Weekly coach:** up to 5 steps for this week, built only from checked opportunities the student is eligible for, their saved items and unpaid costs, each linked to its official page.
- **What changed this week:** a Saturday Vercel Cron job re-reads official pages and reports changed dates, closed rounds and new editions.

## How it's built

Next.js 16, TypeScript and Tailwind, on Vercel. The Vercel AI SDK connects to Google Gemini. The PayPal Agent Toolkit handles invoices and subscriptions in the sandbox (`create_invoice`, `send_invoice`, `get_invoice`, `create_product`, `list_subscription_plans`, `create_subscription_plan`, `create_subscription`, `show_subscription_details`). AG Grid Community powers the cost plan.

Rules come first and AI second: code decides eligibility, deadlines and prices, and the model only explains or orders them. Every AI answer is checked against known IDs or source links before it is shown. The model never receives a PayPal tool; the server calls PayPal only after a button click.

## Challenges

[fill in: what was hard for you]

## Accomplishments

[fill in: only what works in the demo]

## What I learned

[fill in]

## What's next

More countries and checked opportunities, reminders before due dates (with approval), testing with students at school, and accessibility improvements.

## AI tools used

- **Inside the app:** Google Gemini through the Vercel AI SDK.
- **While building:** [fill in]
- **What I did myself:** [fill in]
