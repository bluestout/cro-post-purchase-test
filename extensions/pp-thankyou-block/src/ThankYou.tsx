import '@shopify/ui-extensions/preact';
import {render} from 'preact';

import {getArm} from './arm';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Control orders and orders outside the test keep the default thank-you page.
  if (getArm(shopify.attributes.value) !== 'variant') return null;

  return (
    <s-section heading={shopify.i18n.translate('heading')}></s-section>
  );
}
