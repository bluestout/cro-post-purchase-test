/**
 * App backend base URL (no trailing slash). Checkout extensions can't read env
 * vars, so the Railway URL is set here. shopify.app.toml has
 * automatically_update_urls_on_dev = false, so `shopify app dev` keeps using it.
 */
export const BACKEND_URL = 'https://cro-post-purchase-app-production.up.railway.app';
