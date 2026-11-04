/**
 * App backend base URL (no trailing slash). Checkout extensions can't read env
 * vars, so this is set at build time: the Railway URL for production, or a
 * stable tunnel URL (`shopify app dev --tunnel-url`) for local testing.
 */
export const BACKEND_URL = 'https://REPLACE-WITH-RAILWAY-URL';
