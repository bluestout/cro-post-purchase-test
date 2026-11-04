import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
    attentiveMode: process.env.ATTENTIVE_API_KEY ? "live" : "mock",
  };
};

export default function Index() {
  const { shop, attentiveMode } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Post-purchase thank-you test">
      <s-section heading="Status">
        <s-paragraph>
          <s-text type="strong">Store: </s-text>
          <s-text>{shop}</s-text>
        </s-paragraph>
        <s-paragraph>
          <s-text type="strong">Attentive: </s-text>
          <s-badge tone={attentiveMode === "live" ? "success" : "warning"}>
            {attentiveMode}
          </s-badge>
        </s-paragraph>
      </s-section>
      <s-section heading="How it works">
        <s-unordered-list>
          <s-list-item>
            Convert assigns each visitor to an arm and writes the
            <s-text type="strong"> _pp_test </s-text>
            cart attribute (control or variant).
          </s-list-item>
          <s-list-item>
            The thank-you block reads that attribute from the order. Control
            orders and orders without the attribute see nothing.
          </s-list-item>
          <s-list-item>
            Variant orders see an email/SMS signup or a social follow block,
            based on the customer&apos;s subscription status.
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
