import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

// No admin UI. The loader must stay: opening the app (Shopify does this right
// after install) stores the offline token that the thank-you backend uses.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="Post-purchase thank-you test">
      <s-banner tone="success" heading="App is configured">
        No additional setup is needed.
      </s-banner>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
