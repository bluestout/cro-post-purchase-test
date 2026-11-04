# cro-post-purchase-test

Shopify app for the post-purchase thank-you page A/B test (ClickUp 86bckubmy).

- **Arm assignment:** Convert (storefront) sets the `_pp_test` cart attribute to `control` or `variant`. It carries over to the order.
- **Thank-you block:** Checkout UI extension on `purchase.thank-you.block.render`, placed below Fairing. Renders only for `variant` orders.
- **Backend:** React Router app (`@shopify/shopify-app-react-router`) hosted on Railway. It checks subscriber status (Shopify consent + Attentive) and sends signups to Attentive.

## Local development

```shell
npm install
npm run dev        # shopify app dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

## Environment variables (production)

| Variable | Purpose |
|---|---|
| `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES` | Standard Shopify app config |
| `DATABASE_URL` | Session storage |
| `ATTENTIVE_API_KEY` | Attentive API. Without it the backend runs in mock mode |
