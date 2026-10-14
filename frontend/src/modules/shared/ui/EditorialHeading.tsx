import type { ComponentProps } from 'react';
import { Heading } from './AppText';

/** System serif display type gives editorial surfaces a distinct voice without a font download. */
export function EditorialHeading(props: ComponentProps<typeof Heading>) {
  return <Heading {...props} fontFamily="$editorial" fontWeight="400" />;
}
