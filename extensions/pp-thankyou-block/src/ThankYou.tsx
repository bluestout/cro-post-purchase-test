import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {getArm} from './arm';
import {fetchSubscriberState, track, type SubscriberState} from './api';
import {SignupForm} from './SignupForm';
import {SocialFollow, type SocialLink} from './SocialFollow';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Control orders and orders outside the test keep the default thank-you page.
  if (getArm(shopify.attributes.value) !== 'variant') return null;

  return <VariantBlock />;
}

function VariantBlock() {
  const orderId = shopify.orderConfirmation.value.order.id;
  const [state, setState] = useState<SubscriberState | null>(null);

  useEffect(() => {
    fetchSubscriberState(orderId).then(setState);
  }, [orderId]);

  const block = state ? chooseBlock(state) : null;
  const shown = block !== null;

  // Count an impression only when something is actually shown.
  useEffect(() => {
    if (state && shown) track(orderId, 'impression', state);
  }, [orderId, state, shown]);

  // Nothing renders while loading, on lookup failure, or when the chosen
  // block isn't configured (no SMS disclosure / no social links).
  if (!state || !block) return null;

  if (block.type === 'social') {
    return <SocialFollow orderId={orderId} links={block.links} />;
  }

  return (
    <SignupForm
      orderId={orderId}
      state={block.state}
      askEmail={block.askEmail}
      askPhone={block.askPhone}
      smsDisclosure={block.smsDisclosure}
    />
  );
}

type Block =
  | {type: 'social'; links: SocialLink[]}
  | {
      type: 'signup';
      state: Exclude<SubscriberState, 'both'>;
      askEmail: boolean;
      askPhone: boolean;
      smsDisclosure: string;
    };

function chooseBlock(state: SubscriberState): Block | null {
  const settings = shopify.settings.value;

  if (state === 'both') {
    const links = (['instagram', 'tiktok', 'facebook'] as const)
      .map((network) => ({network, url: settings[`${network}_url`]}))
      .filter((link): link is SocialLink => typeof link.url === 'string' && link.url !== '');
    return links.length ? {type: 'social', links} : null;
  }

  // SMS signup is only allowed with the legal disclosure configured.
  const smsDisclosure =
    typeof settings.sms_disclosure === 'string' ? settings.sms_disclosure.trim() : '';
  const askEmail = state !== 'email_only';
  const askPhone = state !== 'sms_only' && smsDisclosure !== '';

  return askEmail || askPhone
    ? {type: 'signup', state, askEmail, askPhone, smsDisclosure}
    : null;
}
