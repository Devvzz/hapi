# Hapi – submission

Code built 7–12 Nov 2026; dataset researched before the event (31 Oct – 6 Nov); assisted by AI in coding.

- **Live app:** [after deploy] (add `?demo=1` to try everything with a sample student)
- **Repository:** https://github.com/Devvzz/hapi (MIT)
- **Video:** [after recording]
- **PayPal:** sandbox only, no real money moves

## Inspiration

Hapi started as my own problem. As a student in Albania, I wanted opportunities abroad but didn't know where to look, and I couldn't pay for much. So I built a rough tool just for myself: an AI agent that searched for opportunities that fit an Albanian student, mostly free of charge. It worked. I got accepted to several fully paid trips.

Then I saw that most young people around me had the same problem. They didn't know opportunities like these even existed. Friends started asking me to share my tool, but it was built only for me. There are a lot of young people with the will to grow who are simply lost, so I decided to build an app that shows everyone these hidden opportunities, and helps with the hardest part: what it really costs and who can help pay.

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

- **Messy, wrong data.** Official pages often disagree with each other, and many dates for next year aren't published yet. My older list of programmes had wrong prices and dates, so every item had to be rechecked against its source, and anything not confirmed is marked "check yourself".
- **Free-tier limits.** I didn't pay for Gemini, so I hit quota limits and slow answers. I added time limits, a fallback model and clear messages, and made sure the checked data works even when the AI doesn't.
- **Keeping AI honest.** An AI that invents a deadline or a price is worse than no AI. That's why code decides the facts and the AI only explains them.

## Accomplishments

I built this solo: no team, no investors. In a few days it went from a tool for me to an app any student can use:

- 191 checked opportunities and 555 bachelor programmes, every one with a source link
- eligibility and real-cost planning in one place
- family sponsorship through PayPal invoices that the student approves first
- a PayPal subscription that unlocks a weekly coach

All of it works live in the PayPal sandbox.

## What I learned

- Good data matters more than a clever model. Most of the work was checking facts, not writing prompts.
- AI is strongest when it explains decisions made by clear rules, and weakest when it is trusted with facts.
- An AI action that moves money needs a human approval step, every time.
- How PayPal invoices and subscriptions work, from creating a plan to checking that a subscription is active on the server.
- Small details break real apps, for example a deadline in US time showing up as a different day in Europe.

## What's next

More countries and checked opportunities, reminders before due dates (with approval), testing with students at school, and accessibility improvements.

## AI tools used

- **Inside the app:** Google Gemini through the Vercel AI SDK.
- **While building:** an AI coding assistant, used to save time: drafting code, rechecking dates and prices in the data, and researching event rules. It assisted; it didn't build Hapi on its own.
- **What I did myself:** the idea, every product decision, the original data, and the review. I read through all of the code, found logic mistakes and fixed them, and checked the data and the app myself. My decisions:
  - who Hapi is for: students who can't pay much and don't know where to look
  - Austria, Germany and Italy as the first countries for universities
  - the features: opportunities with every date and the real price, matching, eligibility, one cost plan, family sponsorship and a weekly coach
  - family sponsorship through PayPal invoices, with nothing sent before the student approves
  - "rules first, AI second": code decides the facts, and AI only explains them
  - Premium at €2.99 a month, while the free parts stay free
  - keeping each student's data in their own browser
  - which hackathons to enter, and which to drop because of their rules

For me, AI is not meant to build the project. It is an assisting tool that saves time, and it makes it possible for solo developers like me to compete.
