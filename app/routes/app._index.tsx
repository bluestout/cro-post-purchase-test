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
      <s-paragraph>
        Nothing to configure here. Block settings live in the checkout editor
        (Thank you page → Post-purchase signup / social).
      </s-paragraph>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
