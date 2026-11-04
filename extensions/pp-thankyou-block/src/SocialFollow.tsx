import {track} from './api';

export interface SocialLink {
  network: 'instagram' | 'tiktok' | 'facebook';
  url: string;
}

const t = (key: string) => shopify.i18n.translate(key);

function withUtms(url: string): string {
  const withParams = new URL(url);
  withParams.searchParams.set('utm_source', 'thankyou');
  withParams.searchParams.set('utm_medium', 'pp_test');
  return withParams.toString();
}

export function SocialFollow({
  orderId,
  links,
}: {
  orderId: string;
  links: SocialLink[];
}) {
  return (
    <s-section heading={t('social.heading')}>
      <s-stack gap="base">
        <s-text>{t('social.subheading')}</s-text>
        <s-stack direction="inline" gap="base">
          {links.map(({network, url}) => (
            <s-button
              key={network}
              href={withUtms(url)}
              target="_blank"
              variant="secondary"
              onClick={() => track(orderId, 'social_click', network)}
            >
              {t(`social.${network}`)}
            </s-button>
          ))}
        </s-stack>
      </s-stack>
    </s-section>
  );
}
