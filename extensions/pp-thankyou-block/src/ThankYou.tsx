import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {getArm} from './arm';
import {fetchSubscriberState, type SubscriberState} from './api';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Control orders and orders outside the test keep the default thank-you page.
  if (getArm(shopify.attributes.value) !== 'variant') return null;

  return <VariantBlock />;
}

function VariantBlock() {
  const [state, setState] = useState<SubscriberState | null>(null);

  useEffect(() => {
    fetchSubscriberState(shopify.orderConfirmation.value.order.id).then(
      setState,
    );
  }, []);

  // Render nothing until we know which block to show (or if the lookup fails).
  if (!state) return null;

  return (
    <s-section heading={shopify.i18n.translate('heading')}>
      <s-text>{shopify.i18n.translate(`subheading.${state}`)}</s-text>
    </s-section>
  );
}
