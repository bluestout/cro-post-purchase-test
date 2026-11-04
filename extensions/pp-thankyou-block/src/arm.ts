/** Cart attribute written by the Convert experiment; it carries over to the order. */
const ARM_ATTRIBUTE_KEY = '_pp_test';

type Arm = 'control' | 'variant';

/** Returns the order's test arm, or null when the order isn't in the test. */
export function getArm(
  attributes: ReadonlyArray<{key: string; value: string}> | undefined,
): Arm | null {
  const value = attributes
    ?.find((attribute) => attribute.key === ARM_ATTRIBUTE_KEY)
    ?.value.trim()
    .toLowerCase();

  return value === 'control' || value === 'variant' ? value : null;
}
