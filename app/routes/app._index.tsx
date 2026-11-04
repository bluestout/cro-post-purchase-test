import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { isAttentiveConfigured } from "../lib/attentive.server";
import { getEventSummary } from "../lib/events.server";

const EVENT_LABELS: Record<string, string> = {
  impression: "Block shown",
  signup: "Signed up",
  social_click: "Social click",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const summary = await getEventSummary(session.shop);

  return {
    attentive: {
      apiKey: isAttentiveConfigured(),
      emailSource: Boolean(process.env.ATTENTIVE_EMAIL_SIGN_UP_SOURCE_ID),
      smsSource: Boolean(process.env.ATTENTIVE_SMS_SIGN_UP_SOURCE_ID),
    },
    rows: summary.map(({ type, detail, orders }) => ({
      key: `${type}:${detail}`,
      label: `${EVENT_LABELS[type] ?? type} · ${detail}`,
      orders: Number(orders),
    })),
  };
};

export default function Index() {
  const { attentive, rows } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Post-purchase thank-you test">
      <s-section heading="Variant activity (unique orders)">
        {rows.length === 0 ? (
          <s-paragraph>No activity yet.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Event</s-table-header>
              <s-table-header format="numeric">Orders</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {rows.map((row) => (
                <s-table-row key={row.key}>
                  <s-table-cell>{row.label}</s-table-cell>
                  <s-table-cell>{row.orders}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
        <s-paragraph>
          Control orders render nothing. Signups per arm come from Attentive
          form-level reporting; Fairing response rate per arm comes from the
          Fairing export joined on the order&apos;s _pp_test attribute.
        </s-paragraph>
      </s-section>

      <s-section heading="Attentive setup">
        <s-unordered-list>
          <s-list-item>
            API key: <ConfigBadge ok={attentive.apiKey} />
          </s-list-item>
          <s-list-item>
            Email sign-up source ID: <ConfigBadge ok={attentive.emailSource} />
          </s-list-item>
          <s-list-item>
            SMS sign-up source ID: <ConfigBadge ok={attentive.smsSource} />
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

function ConfigBadge({ ok }: { ok: boolean }) {
  return (
    <s-badge tone={ok ? "success" : "warning"}>
      {ok ? "Set" : "Missing"}
    </s-badge>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
