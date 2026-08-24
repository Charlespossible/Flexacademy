# Pricing & Revenue Allocation — Implementation Spec

**Audience:** an engineering agent (Claude Code) implementing billing, entitlements, teacher payouts and the tutor marketplace for a Nigerian subscription EdTech platform.

**Status:** ready to implement. Stack-agnostic — no framework, database or payment provider is assumed beyond Paystack-shaped fee mechanics, which are themselves config-driven.

---

## 0. Files in this package

| File | Role | Who edits it |
|---|---|---|
| `pricing.config.json` | **Canonical source of truth.** Every price, share, take rate and policy. | Product / finance |
| `pricing.schema.json` | JSON Schema for the above. Validate in CI. | Engineering |
| `assumptions.json` | Forecasting inputs (churn, CAC, deflection). **Not** shipped to users. | Finance / analytics |
| `unit_economics.py` | Runnable model. Derives margin, LTV, break-even, and enforces config invariants. | Engineering |
| `PRICING_SPEC.md` | This document. | Everyone |

**Run it first:**

```bash
python3 unit_economics.py                 # full report
python3 unit_economics.py --json          # machine-readable
python3 unit_economics.py --sweep deflection
python3 unit_economics.py --set scale.active_subscribers=25000
```

Exit code `1` means a config invariant is violated. Wire that into CI.

---

## 1. Non-negotiable rules

These are the rules that, if broken, silently destroy either margin or trust. Treat them as tests, not guidelines.

1. **Money is integer kobo. Everywhere.** No floats, no naira in the database, no `Decimal` rounding drift. Convert to naira only in the display layer.
2. **Prices are never hardcoded.** All prices come from `pricing.config.json`, loaded at boot and cached. A price change must be a config deploy, not a code change.
3. **Revenue shares are computed on NET revenue**, defined as `gross − VAT − payment processing fees − refunds − chargebacks`. Paying teachers on gross gives away ~9% permanently. Put this definition verbatim in tutor contracts.
4. **The config is versioned and immutable per subscription.** A subscription stores the `pricing_config_version` it was sold under. Changing prices must never retroactively alter an existing subscriber's renewal terms.
5. **Every payment mutation is idempotent**, keyed on a client-supplied `idempotency_key`. Nigerian payment webhooks retry aggressively.
6. **Commission never influences tutor ranking.** Enforce with a test that asserts the ranking function's inputs do not include take rate.

---

## 2. The plan ladder

Read from `config.plans`. Current values:

| Plan | Term | Price | Effective /mo | Discount | Default |
|---|---|---|---|---|---|
| Monthly | 1 mo | ₦5,000 | ₦5,000 | — | |
| 3 Months | 3 mo | ₦13,500 | ₦4,500 | 10% | |
| 6 Months | 6 mo | ₦25,000 | ₦4,167 | 17% | |
| **Annual** | 12 mo | **₦45,000** | ₦3,750 | **25%** | ✅ |
| Annual (3 payments) | 12 mo | 3 × ₦16,000 | ₦4,000 | 20% | |

**Invariants enforced by `unit_economics.py`** (all currently pass):

- Effective monthly price strictly decreases as term length increases
- No plan costs more than paying monthly for the same duration
- Annual effective monthly ≤ 80% of the anchor
- Instalment total sits strictly between the annual lump sum and 12× monthly
- Exactly one plan is default-selected

### Why the annual discount is this steep

The model output that justifies it:

| Plan | Expected life | Net LTV | LTV:CAC | CAC payback |
|---|---|---|---|---|
| Monthly | 8.3 mo | ₦37,301 | 3.11 | 2.7 months |
| 3 Months | 5.5 mo | ₦22,283 | 1.86 | instant |
| 6 Months | 10.3 mo | ₦39,277 | 3.27 | instant |
| **Annual** | 20.0 mo | **₦68,476** | **5.71** | **instant** |

Annual LTV is **1.84× monthly LTV despite giving away 25%**, and it is banked on day one. The discount buys certainty you would otherwise lose to churn and failed card mandates.

> **Finding — the 3-month plan is the weakest in the ladder.** At a 45% per-term renewal rate its LTV (₦22,283) is *below* the monthly plan's. It is only worth carrying as a seasonal exam product where one-and-done is the natural buying pattern and intent is high. Implement `seasonal_alias.sell_window_months` and hide it outside Jan–Apr.

---

## 3. Data model

Minimum viable entities. Adapt naming to your stack; keep the semantics.

```
Household
  id, phone, email, pricing_config_version, created_at

Learner
  id, household_id, name, year_group, exam_track (WAEC|JAMB|NECO|NONE)

Subscription
  id, household_id, plan_id, status, term_months
  current_period_start, current_period_end
  price_kobo, pricing_config_version
  auto_renew, cancel_at_period_end
  learner_count, family_multiplier_applied
  trial_converted_from_id (nullable)

Payment
  id, subscription_id, idempotency_key (unique)
  gross_kobo, vat_kobo, processing_fee_kobo, net_kobo   -- all persisted, never recomputed
  provider_reference, status, installment_index (nullable)
  captured_at

Entitlement
  subscription_id, key, granted, consumed, period_start, period_end
  -- e.g. key = 'live_1to1_session'

Gap                       -- the AI's diagnostic unit; drives everything downstream
  id, learner_id, topic_id, detected_at
  tier_routed (tier_0_ai|tier_1_async|tier_2_clinic|tier_3_live)
  status (open|in_progress|closed_verified|reopened)
  closed_at, verified_by_assessment_id
  assigned_tutor_id (nullable), source_content_id

TutorPayout
  id, tutor_id, kind (royalty|intervention|promotion|marketplace)
  period, amount_kobo, status (accrued|held|paid)
  holdback_until, gap_id (nullable), session_id (nullable)

WatchEvent                -- feeds subscriber-share royalty allocation
  learner_id, content_id, teacher_id, eligible_seconds, occurred_at, period
```

---

## 4. Money math — implement exactly

```python
VAT_RATE = config.tax.rate                    # 0.075, prices are VAT-INCLUSIVE

def vat_component(gross_kobo):
    return round(gross_kobo * VAT_RATE / (1 + VAT_RATE))

def processing_fee(gross_kobo):
    p = config.payment_processing.local_card
    fee = gross_kobo * p.percentage                       # 1.5%
    if gross_kobo >= p.flat_fee_waived_below_kobo:        # ₦2,500
        fee += p.flat_fee_kobo                            # ₦100
    return round(min(fee, p.cap_kobo))                    # cap ₦2,000

def net_revenue(gross_kobo, charges=1):
    per_charge = round(gross_kobo / charges)
    fees = processing_fee(per_charge) * charges           # instalments pay the flat fee N times
    return gross_kobo - vat_component(gross_kobo) - fees
```

**Persist `gross/vat/fee/net` on every `Payment` row at capture time.** Never recompute historical net from current config — provider rates change and you will corrupt past payouts.

**Verify the Paystack rate card before launch.** `payment_processing.verify_before_launch` is `true` in the config for this reason. Encode whatever is current; never hardcode in application code.

---

## 5. Revenue recognition and payout timing

Collect annually, **recognise monthly**. This is load-bearing, not accounting pedantry.

- A ₦45,000 annual payment recognises ₦3,750/month for 12 months.
- Teacher pools are calculated against **recognised** revenue in the period, not cash collected.
- You keep the float, refunds never create clawbacks against already-paid teachers, and tutors get predictable monthly income.
- Apply a **45-day holdback** on every payout to cover refunds and chargebacks (`intervention_ladder.payment_trigger.rules`).

```
recognised_net(month) = Σ over active subscriptions: net_kobo × (1 / term_months)
content_royalty_pool(month)  = recognised_net(month) × 0.08
intervention_budget(month)   = recognised_net(month) × 0.12
```

---

## 6. Content royalty allocation — subscriber-share

**Implement `subscriber_share`. Do not implement `platform_wide`** — it is present in the config only as a comparison baseline.

```
For each subscriber S in the period:
    S_pool = recognised_net(S, month) × 0.08
    consumption_pool = S_pool × 0.80
    quality_pool     = S_pool × 0.20

    eligible = watch events for S where:
        - watched ≥ 60% of the lesson, OR ≥ 5 minutes (whichever is shorter)
        - the account is not the teacher's own or a related account
        - the lesson is not the learner's own uploaded content

    if eligible is empty:
        retain S_pool for the platform     # idle_subscriber_policy
        continue

    weighted[t] = Σ eligible_seconds(t) × quality_multiplier(t)   # clamp 0.8 – 1.3
    # cap countable minutes per subscriber per month at 60 hours
    payout[t] += consumption_pool × weighted[t] / Σ weighted
```

**Why subscriber-share:** a fraudster farming views can only ever extract the ₦45,000 they themselves paid in. Platform-wide pooling lets one bad actor dilute everyone. Subscriber-share is also the only version you can honestly explain to a teacher: *"your students' fees went to you."*

**Quality multiplier** is derived from completion rate, assessment pass rate, rating — **and gap-generation rate**. If a teacher's lessons produce gaps at more than `gap_rate_penalty_threshold` (1.5×) the platform average for that topic, drop their multiplier and flag the content for re-commission. Their own diagnostic data grades them.

---

## 7. The intervention ladder

The AI's job is **triage**, not just detection. Model output at the target 72% deflection rate:

| Tier | Mix | Resolutions/yr | Unit cost | Annual cost |
|---|---|---|---|---|
| AI remediation | 72% | 28.8 | ₦0 | ₦0 |
| Async human response | 15% | 6.0 | ₦350 | ₦2,100 |
| Group clinic | 9% | 3.6 | ₦167 | ₦600 |
| Included live 1:1 | 4% | 1.6 | ₦900 | ₦1,440 |
| **Total** | | **40** | | **₦4,140** |

Budget at 12% of net: **₦5,654**. Headroom **₦1,514**. ✅

### The deflection cliff — build the alert before you build anything else

```
Deflection   Ladder cost   Headroom      Status
   60%          ₦5,914     −₦260         OVER   ← floor
   65%          ₦5,175     +₦479         OK
   72%          ₦4,140     +₦1,514       OK     ← target
   80%          ₦2,957     +₦2,697       OK
```

**Below ~62% deflection the subscription cannot fund its own promised human support.** Alert on this metric daily, per subject.

### Routing algorithm

```
on gap_detected(learner, topic):
    # Tier 0 ALWAYS runs first. Non-negotiable — see §10.
    remedy = ai.generate_remediation(learner, topic)
    if verify_closure(learner, topic): -> close, cost 0

    # Tier 2 before Tier 1: batching is the biggest cost lever
    cluster = find_open_gaps(topic, window=7d)
    if len(cluster) >= tier_2.min_students:
        schedule_group_clinic(topic, cluster)   # 1 tutor serves ~30 students
        return

    if tier_1_capacity_available():
        assign_async_response(gap)
        return

    if entitlement.has('live_1to1_session'):
        offer_live_session(gap)                 # consumes entitlement
    else:
        offer_marketplace(gap)                  # only if marketplace enabled
```

**Group clinics are the single biggest lever and only exist because you detect at scale.** 300 students stuck on simultaneous quadratics is one problem with 300 instances, not 300 problems. Cost per resolution collapses from ₦900 to ₦167.

### Payment trigger — verified closure, not sessions held

```
on gap.status -> closed_verified:
    if gap.reopened_within_30d_by_same_tutor: skip     # kills the incentive to half-fix
    amount = tier.cost_per_resolution
    if closure_within_4h: amount *= 1.25               # response-time bonus
    accrue TutorPayout(kind=intervention, holdback_until=now+45d)
```

Hourly pay rewards elapsed time. The diagnostic you already run gives you an objective, auditable **outcome** trigger instead. This is the whole reason a hybrid AI/human model can be priced at ₦45,000/year.

### Conflict-of-interest guard

If an author both records the lesson *and* earns intervention fees on gaps arising from it, **you have paid them to teach badly.** Two hard rules:

1. Interventions route to a separate resolution-tutor pool by default. The author gets right of first refusal on their own subject but is never the automatic assignee.
2. Gap-generation rate feeds the author's royalty quality multiplier (§6).

Authoring needs master teachers and pays like it. Resolution needs competent teachers and can draw on a wider, cheaper pool.

### The content flywheel — implement this early

When a Tier-1 async response is good enough to serve the next 500 students, pay the **₦10,000 promotion bonus** and fold it permanently into the library. A ₦350 one-off service becomes a permanent asset that removes future cost. Do this systematically and deflection climbs every term, so **cost per learner falls as you scale while price stays flat.** That is the compounding mechanic that makes this model beat both a pure-content platform and a pure-tutoring platform.

---

## 8. Entitlements

```
included_live_1to1_sessions_per_term:
  monthly    0      quarterly  0
  biannual   1  (= 2/yr)       annual  2  (= 2/yr)
```

> **Finding — this corrects an earlier assumption.** The intervention budget supports roughly **2 free live 1:1 sessions per learner per year**, not 2 per term. `unit_economics.py` fails the build if any plan promises more than the budget can fund (verified: setting biannual to 8/term produces `promises 16.0 free 1:1/year but the intervention budget only affords 3.1`).

Quarterly is deliberately 0 — free live 1:1 is the reward for a 6- or 12-month commitment. Giving it away on the short plan removes a reason to trade up.

Grant entitlements at period start, reset on renewal, **do not roll over** (rollover creates an unbounded liability). Beyond the allowance, route to the marketplace.

---

## 9. Subscription state machine

```
                  ┌──────────┐
                  │  trial   │  ₦1,000 / 7 days, credited to first plan
                  └────┬─────┘
                       ▼
   ┌──────────────► active ◄──────────────┐
   │                 │  │                 │
   │        payment  │  │ cancel_at_      │ payment
   │         failed  │  │ period_end      │ recovered
   │                 ▼  ▼                 │
   │            past_due   pending_cancel │
   │                 │           │        │
   │  retries        │           │        │
   │  [0,1,3,5,7]d   │           ▼        │
   │                 │        expired ────┘  (reactivate)
   │                 ▼
   └──────────  read_only  ──── 60 days ───► purged
```

- **`read_only`** keeps progress data and the gap tracker visible but blocks new content. Far better than hard lockout for win-back: their learning history is the switching cost.
- **Instalment default:** suspend after grace, then offer catch-up or a prorated downgrade to the term already paid for.
- **Dunning** over SMS + WhatsApp + email. WhatsApp materially outperforms email in this market.

### Trial

₦1,000 / 7 days, credited in full toward the first plan, one per household. A paid trial outperforms a free one where payment friction is the real drop-off — it proves the card works and produces a live mandate before the real charge.

### Money-back guarantee

14 days on 6-month, annual and instalment plans. Void if the learner consumed >20% of any course, attended a live 1:1, or the household previously refunded. Cheap to honour; measurably lifts conversion when asking a stranger for ₦45,000.

### Proration on upgrade

Upgrades only (never auto-downgrade mid-term):

```
credit = round(paid_kobo × days_remaining / days_in_term)
charge = new_plan_price − credit          # if ≤ 0, extend the period instead of refunding
```

---

## 10. Marketplace

**Ships disabled.** `marketplace.enabled = false`. Gate the launch on measurable liquidity, not a date:

```
min_subscribers_in_subject:        2,000
min_certified_tutors_in_subject:      15
max_median_time_to_match:         60 min
launch_subjects_limit:                 3
```

Launch in your two or three largest subjects only. A marketplace that launches looking empty never recovers.

### Take rate — declining, per student-tutor pair

```
cumulative pair-hours  <  5   →  30%
cumulative pair-hours  < 20   →  20%
cumulative pair-hours  ≥ 20   →  12%
```

This is the single best anti-leakage mechanic available. It cuts the tutor's incentive to go off-platform at precisely the moment that incentive peaks — once the relationship is established. It does more work than any enforcement clause.

### Modelled contribution (at 10,000 subscribers)

| | |
|---|---|
| Blended price per student-hour | ₦2,280 |
| GMV per subscriber / year | ₦2,736 |
| Net contribution per subscriber / year | ₦438 |
| Annual platform GMV | ₦27.4m |
| Annual net contribution | ₦4.4m |
| Effective take after leakage + fees | 16.0% |

> **Finding — this is lower than a first-pass estimate would suggest.** Once you net out 20% leakage, processing fees, and the fact that cheap group sessions carry most of the volume, the effective take on GMV is 16%, not the headline 22%. The marketplace is a **margin and retention enhancer, not a rescue.** Size it accordingly and do not let it distract from retention on the core subscription.

### Affordability — reach down, not up

A household budgeting ₦3,750/month cannot casually spend ₦3,000/hour; two hours of 1:1 would double their annual spend. Most of the base will never book at that price, from arithmetic rather than unwillingness. So:

- **Group sessions are first-class**, not an afterthought. Tutor earns ₦6,000+/hour while the student pays ₦1,200. The AI assembles the group from students with the **same diagnosed gap** — no generic marketplace can do this.
- **20-minute focus sessions at ₦1,000.** Matches both the wallet and the actual problem; a specific gap does not need an hour.
- **Platform sets price bands**, tutors apply to a band. Free tutor-set pricing yields a race to the bottom or incoherent UX.

### Credit packs

A ₦3,000 single charge costs ~4.8% in fees (1.5% + ₦100 fixed). A ₦20,000 pack costs ~2%. Packs bring cash forward, raise commitment, cut failed-card moments, and generate breakage. Offer ₦5,000 / ₦20,000 (+5%) / ₦50,000 (+10%), expiring after 12 months.

### Trust guards — build these before the first booking

An AI that both diagnoses gaps and sells the remedy is **a doctor who owns the pharmacy.** If students or parents ever suspect the diagnostic is tuned to generate bookings, you lose the thing the whole platform rests on. Structural guards, not policy statements:

| Guard | Implementation |
|---|---|
| Free path first | The routing algorithm in §7 **must** exhaust tiers 0–2 before any paid option renders. Enforce with a test. |
| No commission in ranking | Assert the ranking function's input signature excludes take rate. |
| No GMV-only compensation | Tie any marketplace incentive to subscription retention as well. |
| Ratio alarm | Alert if `paid_sessions_per_subscriber` rises while `tier_0_deflection_rate` falls. That means the AI has been tuned wrong. |
| Framing | Position paid sessions as **acceleration and exam intensity**, never as remediation of failure. It converts better *and* does not poison trust. |

### The defensible part — AI pre-session brief

> *"This student failed three quadratic factorisation problems, all sign errors on negative coefficients. Rewatched lesson 12 twice. Comfortable with completing the square."*

A 20-minute briefed session beats a 60-minute cold one. This is what justifies your take rate, it is invisible to competitors, and it improves outcomes — which feeds tutor rankings, which feeds matching quality. It is the only part of this model a generic marketplace cannot copy. **Build it in v1, not v2.**

### Escrow

Hold funds, release 24h after session, 48h dispute window, weekly payouts, ₦5,000 minimum. Mask contact details until the first paid session completes.

---

## 11. Content capex

Anchor-subject courses bought work-for-hire are **assets, not expenses.** Capitalise and amortise over 36 months.

```
8 anchor courses × ₦1,200,000 = ₦9,600,000
annual amortisation  = ₦3,200,000
annual refresh (12.5%) = ₦1,200,000
per subscriber @ 10,000 subs = ₦440/year
per subscriber @  2,000 subs = ₦2,200/year
```

> **Finding — content cost per subscriber is dominated by scale, not by contract terms.** It is 5× heavier at 2,000 subscribers than at 10,000. Total teacher cost is **17.7% of net at 10k subs but 21.5% at 2k**. This is the strongest argument for buying anchor content outright rather than renting it through the pool: the cost is fixed and dilutes as you grow.

**Write the refresh terms into the original contract** so there is nothing to renegotiate later: fixed per-lesson refresh fee (₦35,000) held for 5 years, author right of first refusal with a hard 21-day deadline, source files and recording spec in escrow, and a small annual retainer (₦150,000). The right-of-first-refusal deadline is the clause that actually protects you — it turns an author's "no" into an inconvenience rather than a crisis.

---

## 12. Blended P&L (10,000 subscribers, current config)

```
Net revenue per subscriber-year              ₦47,118
  less content royalty pool  (8% of net)      ₦3,769
  less intervention cost     (ladder)         ₦4,140
  less content amortisation                     ₦440
  less video delivery        (121 GB/yr)      ₦2,662
───────────────────────────────────────────────────
CONTRIBUTION                                 ₦36,106   (76.6% of net)
  less steady-state CAC provision             ₦5,754
───────────────────────────────────────────────────
CONTRIBUTION AFTER CAC                       ₦30,352

Fixed opex / year                       ₦150,000,000
Break-even subscribers (excl. CAC)             4,154
Break-even subscribers (incl. CAC)             4,942
```

**Video delivery is your only genuinely uncapped cost.** At 720p on a volume CDN a heavy learner costs ~₦2,662/year. Serve the same learner unrestricted 1080p and it becomes ₦11,000+, which eats a quarter of revenue. Cap default resolution, use per-title encoding, limit offline downloads. Enforce in the player, not in policy.

---

## 13. Display rules

Merchandising moves conversion as much as the prices do. From `config.display_rules`:

- Lead with the effective per-month figure, total in smaller text: *"₦3,750/month, billed annually as ₦45,000"*
- Express savings in naira, not percent: *"Save ₦15,000"* beats *"Save 25%"*
- Prefer *"months free"* framing where the maths lands cleanly — *"3 months free"* outperforms *"25% off"*
- **Default the selector to annual.** Whatever is pre-selected wins a large share.
- Round numbers only. Avoid `.99` pricing — it reads as foreign gimmickry here and undercuts trust at the exact moment you ask for ₦45,000.
- **Publish the renewal price and honour it.** Never run introductory-rate-then-jump; in a low-trust market it costs more in reputation than it earns.
- Show at most 3 plans at once. Surface the Exam Sprint only in its sell window.
- Show the instalment option on annual-checkout abandonment. The barrier is having ₦45,000 today, not the value.

---

## 14. Family plan

Second learner at 50%, third and fourth at 40%.

```
1 learner  annual   ₦45,000
2 learners          ₦67,500
3 learners          ₦85,500
```

Marginal content cost for learner 2 is essentially zero, so this is near-pure margin. Multi-child households also churn materially less — cancelling means cancelling on all their children. **Probably the highest-return pricing move in the config.** Each learner needs a separate progress profile and gap tracker; billing stays on one household account.

---

## 15. Metrics to instrument on day one

| Metric | Target | Why |
|---|---|---|
| **AI deflection rate** | 72% (floor 60%) | Single most important product metric. Below the floor the subscription cannot fund its promised support. |
| **Cost per resolved gap**, per subject | ₦104 | A subject with rising CPRG has a *content* problem, not a tutoring problem. The fix is re-recording the lesson, not adding tutors. |
| Diagnosed gaps per learner per year | 40 | Drives the whole intervention model; the input the model is second-most sensitive to. |
| Plan mix (share choosing annual) | ↑ | Shifting 10 points from monthly to annual beats most price changes. |
| Involuntary churn share | ↓ | Failed card mandates. The hidden argument for the annual discount. |
| Tutor monthly earnings | ₦200,000 | Per-resolution pay only attracts good people if volume is concentrated. A thin, underemployed pool churns and takes service quality with it. |
| Paid sessions ÷ deflection rate | flat | The trust alarm. Rising = the AI is being tuned to sell. |

---

## 16. Build order

1. **Config loader + schema validation + `unit_economics.py` in CI.** Nothing else until a bad price fails the build.
2. Plans, checkout, Paystack integration, idempotent webhooks, `Payment` with persisted gross/vat/fee/net.
3. Subscription state machine, entitlements, dunning, proration.
4. Revenue recognition ledger + monthly pool calculation.
5. Gap detection → Tier 0 AI remediation → verified closure. **Instrument deflection rate from the first day it runs.**
6. Tier 1 async + Tier 2 clustering and clinics. Tier 2 before Tier 1 — it is the bigger lever.
7. Subscriber-share royalty allocation + tutor payouts with holdback.
8. Family plans.
9. Content flywheel (promotion bonus → library).
10. Marketplace — **only once the liquidity gates in §10 are met.**

---

## 17. Test cases (must pass)

```
money
  ✓ vat_component(4_500_000) == 313_953        (₦45,000 VAT-inclusive)
  ✓ processing_fee(500_000) == 17_500          (₦5,000 → 1.5% + ₦100)
  ✓ processing_fee(200_000) ==  3_000          (₦2,000 → flat fee waived)
  ✓ processing_fee(50_000_000) == 200_000      (cap applied)
  ✓ net_revenue(4_800_000, charges=3) < net_revenue(4_800_000, charges=1)

ladder
  ✓ effective monthly strictly decreases with term length
  ✓ no plan costs more than 12 × monthly
  ✓ exactly one default-selected plan
  ✓ raising annual to ₦54,000 fails the build          [verified]
  ✓ biannual promising 8 sessions/term fails the build [verified]

allocation
  ✓ subscriber with zero eligible watch time → pool retained, no payout
  ✓ watch event below the 60%/5-min threshold is excluded
  ✓ teacher's own account excluded from their own royalty
  ✓ minutes capped at 60 h/subscriber/month
  ✓ Σ payouts ≤ 8% of net revenue for the period, always

intervention
  ✓ payout fires only on closed_verified, never on session_held
  ✓ gap reopened <30d by same tutor → no second payout
  ✓ closure within 4h → 1.25× multiplier
  ✓ entitlement exhausted → live 1:1 not offered free
  ✓ ladder target_mix sums to 1.0

trust
  ✓ paid option never rendered before tiers 0–2 are exhausted
  ✓ ranking function signature excludes take_rate
  ✓ marketplace endpoints return 404 while enabled = false

idempotency
  ✓ replaying a webhook with the same idempotency_key creates no second Payment
```

---

## 18. Open items requiring a human decision

1. **Confirm the live Paystack rate card** before launch. `verify_before_launch: true`.
2. **Confirm content capex treatment with an accountant.** Capitalising vs expensing materially changes how year one looks.
3. **Replace every `"source": "estimate"` in `assumptions.json`** with measured data as soon as it exists — especially `diagnosed_gaps_per_learner_per_year` and `churn`. The model is only as good as these.
4. **VAT registration and whether tutors invoice you or you act as merchant of record** on marketplace sessions. This changes whether VAT applies to full GMV or to commission only, and it is a material margin difference. Get advice before building the marketplace ledger.
5. **Withholding tax on tutor payouts** — confirm treatment for independent contractors.

*Items 4 and 5 are tax and legal questions with real money attached. This spec is not tax advice; get a Nigerian accountant to confirm both before the first payout runs.*
