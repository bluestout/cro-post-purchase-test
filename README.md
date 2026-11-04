# cro-post-purchase-test

Shopify app for the post-purchase thank-you page A/B test (ClickUp 86bckubmy).

| Arm | Thank-you page |
|---|---|
| Control | Fairing survey only (block renders nothing) |
| Variant | Fairing survey, then a block based on subscriber status |

| Subscriber status | Variant block |
|---|---|
| Not subscribed | Email + SMS signup |
| Email only | SMS signup |
| SMS only | Email signup |
| Both | Social follow (Instagram / TikTok / Facebook, with UTMs) |

A channel counts as subscribed if Shopify marketing consent (including a checkout opt-in, `PENDING`) **or** Attentive says so.

## How it fits together

1. **Convert** assigns the visitor to an arm and sets the `_pp_test` cart attribute (`control` / `variant`) — [convert/set-pp-test-arm.js](convert/set-pp-test-arm.js). The attribute carries over to the order.
2. **Thank-you extension** ([extensions/pp-thankyou-block](extensions/pp-thankyou-block)) on `purchase.thank-you.block.render` reads `_pp_test`. Only `variant` orders call the backend.
3. **Backend** (React Router, Railway) — every route verifies the checkout session token:
   - `POST /api/status` → `none | email_only | sms_only | both`
   - `POST /api/signup` → Attentive Subscribers API via dedicated sign-up units (double opt-in)
   - `POST /api/track` → impressions and social clicks (`PpEvent` table)
4. **Admin page** has no UI. Its loader must stay: opening the app (Shopify does this right after install) stores the offline token the backend uses.

## Railway

Project **Post purchase customization** → service **CRO Post Purchase App** (deploys from `main`) + **Postgres**.

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `SHOPIFY_API_KEY` | app client ID |
| `SHOPIFY_API_SECRET` | app client secret |
| `SHOPIFY_APP_URL` | `https://cro-post-purchase-app-production.up.railway.app` |
| `SCOPES` | `read_customers,read_orders` |
| `ATTENTIVE_API_KEY` | Attentive API key (`subscriptions:read`, `subscriptions:write`) |
| `ATTENTIVE_EMAIL_SIGN_UP_SOURCE_ID` | dedicated API sign-up unit for thank-you email |
| `ATTENTIVE_SMS_SIGN_UP_SOURCE_ID` | dedicated API sign-up unit for thank-you SMS |

Without `ATTENTIVE_API_KEY`, status uses Shopify consent only and `/api/signup` returns `503 not_configured`.

The extension's backend URL is a constant in [config.ts](extensions/pp-thankyou-block/src/config.ts). `automatically_update_urls_on_dev = false` keeps `shopify app dev` from replacing the Railway URL with a tunnel.

## Shopify setup

1. Dev Dashboard → app → API access: request **protected customer data** (email, phone) and **network access** for checkout UI extensions.
2. `npm run deploy` (`shopify app deploy`).
3. Install on the store; open the app once in admin so the offline token is stored.
4. Checkout editor → Thank you page → add **Post-purchase signup / social** directly **below Fairing**. Fill in the settings:
   - Instagram / TikTok / Facebook URL (`https://…`; empty hides the button)
   - **SMS consent disclosure** (Attentive's legal text — the SMS signup is hidden until it's set)
5. Make sure no Redo upsell block is enabled.

## Convert setup

- Site-wide experiment, 50/50, two variations.
- Paste [convert/set-pp-test-arm.js](convert/set-pp-test-arm.js) into **both**: `ARM = 'control'` in the Original, `ARM = 'variant'` in the Variation.
- "Buy it now" / express buttons on the PDP skip the cart, so those orders have no attribute and count as not in the test. Disable them during the test or note it in the report.

## QA

Without Convert, set the arm from the browser console after adding to cart:

```js
fetch('/cart/update.js', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({attributes: {_pp_test: 'variant'}})})
```

- `control` and no attribute → nothing below Fairing; `variant` → block shows; refresh keeps it.
- Four subscriber states: toggle the customer's email/SMS marketing consent in admin (or opt in at checkout).
- Signup → Attentive receives it under the new sign-up unit; SMS gets the double opt-in text.
- Fairing renders and submits in both arms; no Redo upsell; iOS Safari, Android Chrome, desktop.

## Reporting

- **Signups per arm:** Attentive form-level reporting on the two dedicated sign-up units (primary).
- **Social clicks / impressions:** `PpEvent` table, variant only. Run in Railway → Postgres → Data → Query:

  ```sql
  SELECT "type", "detail", COUNT(DISTINCT "orderId") AS orders
  FROM "PpEvent"
  WHERE "shop" = '<store>.myshopify.com'
  GROUP BY "type", "detail"
  ORDER BY "type", "detail";
  ```
- **Fairing response rate per arm (guardrail):** Fairing export joined on the order's `_pp_test` attribute.

## Development

```shell
npm install
npm run dev        # shopify app dev (extension preview; backend runs on Railway)
npm run typecheck && npm run lint
```

Local backend runs need `DATABASE_URL` in `.env` (gitignored).
