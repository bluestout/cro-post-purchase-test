import {useState} from 'preact/hooks';

import {signup, type SubscriberState} from './api';

interface Props {
  orderId: string;
  state: Exclude<SubscriberState, 'both'>;
  askEmail: boolean;
  askPhone: boolean;
  smsDisclosure: string;
}

const t = (key: string) => shopify.i18n.translate(key);

/** Value of an s-*-field from its input event. */
const fieldValue = (event: Event) =>
  (event.currentTarget as {value?: string} | null)?.value ?? '';

export function SignupForm({
  orderId,
  state,
  askEmail,
  askPhone,
  smsDisclosure,
}: Props) {
  const [email, setEmail] = useState(shopify.buyerIdentity?.email.value ?? '');
  const [phone, setPhone] = useState(shopify.buyerIdentity?.phone.value ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <s-banner heading={t('signup.successHeading')} tone="success">
        <s-stack gap="small-200">
          {askPhone && phone && <s-text>{t('signup.successSms')}</s-text>}
          {askEmail && email && <s-text>{t('signup.successEmail')}</s-text>}
        </s-stack>
      </s-banner>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const errorCode = await signup(orderId, {
      email: askEmail ? email : undefined,
      phone: askPhone ? phone : undefined,
    });
    setSubmitting(false);

    if (errorCode) setError(errorCode);
    else setDone(true);
  }

  const errorText = (code: string) =>
    t(`signup.errors.${code in ERROR_KEYS ? code : 'generic'}`);

  return (
    <s-section heading={t('signup.heading')}>
      <s-form onSubmit={handleSubmit}>
        <s-stack gap="base">
          <s-text>{t(`signup.subheading.${state}`)}</s-text>
          {askEmail && (
            <s-email-field
              label={t('signup.emailLabel')}
              name="email"
              autocomplete="email"
              value={email}
              error={error === 'invalid_email' ? errorText(error) : undefined}
              onInput={(event) => setEmail(fieldValue(event))}
            />
          )}
          {askPhone && (
            <s-phone-field
              label={t('signup.phoneLabel')}
              name="phone"
              type="mobile"
              value={phone}
              error={error === 'invalid_phone' ? errorText(error) : undefined}
              onInput={(event) => setPhone(fieldValue(event))}
            />
          )}
          {askPhone && (
            <s-text type="small" color="subdued">
              {smsDisclosure}
            </s-text>
          )}
          {error && error !== 'invalid_email' && error !== 'invalid_phone' && (
            <s-banner tone="critical">{errorText(error)}</s-banner>
          )}
          <s-button type="submit" variant="primary" loading={submitting}>
            {t('signup.submit')}
          </s-button>
        </s-stack>
      </s-form>
    </s-section>
  );
}

/** Backend error codes that have their own message; anything else is generic. */
const ERROR_KEYS = {
  invalid_email: true,
  invalid_phone: true,
  missing_contact: true,
};
