import { accessibility } from '@manabandhu/design-system';
import type { ComponentProps } from 'react';
import { styled, Text } from 'tamagui';

/**
 * The only text primitive modules should use. `variant` maps to design-system typography; `tone` maps to theme
 * colours so text adapts to light and dark automatically. Font scaling follows the OS up to `maxFontScale`.
 */
export const AppText = styled(Text, {
  name: 'AppText',
  fontFamily: '$body',
  color: '$color',
  maxFontSizeMultiplier: accessibility.maxFontScale,
  variants: {
    variant: {
      display: {
        fontSize: '$display',
        lineHeight: '$display',
        fontWeight: '700',
        letterSpacing: '$display',
      },
      h1: { fontSize: '$h1', lineHeight: '$h1', fontWeight: '700', letterSpacing: '$h1' },
      h2: { fontSize: '$h2', lineHeight: '$h2', fontWeight: '700', letterSpacing: '$h2' },
      h3: { fontSize: '$h3', lineHeight: '$h3', fontWeight: '700' },
      h4: { fontSize: '$h4', lineHeight: '$h4', fontWeight: '700' },
      lead: { fontSize: '$lead', lineHeight: '$lead' },
      body: { fontSize: '$body', lineHeight: '$body' },
      bodyStrong: { fontSize: '$bodyStrong', lineHeight: '$bodyStrong', fontWeight: '700' },
      label: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
      caption: {
        fontSize: '$caption',
        lineHeight: '$caption',
        fontWeight: '600',
        letterSpacing: '$caption',
      },
      overline: {
        fontSize: '$overline',
        lineHeight: '$overline',
        fontWeight: '800',
        letterSpacing: '$overline',
        textTransform: 'uppercase',
      },
    },
    tone: {
      default: { color: '$color' },
      muted: { color: '$colorMuted' },
      primary: { color: '$primary' },
      onPrimary: { color: '$onPrimary' },
      danger: { color: '$error' },
      success: { color: '$success' },
      warm: { color: '$warm' },
      teal: { color: '$teal' },
    },
    center: { true: { textAlign: 'center' } },
  } as const,
  defaultVariants: { variant: 'body', tone: 'default' },
});

export type AppTextProps = ComponentProps<typeof AppText>;

/** A heading exposed to screen readers as a header. */
export function Heading({ variant = 'h3', ...props }: AppTextProps) {
  return <AppText role="heading" variant={variant} {...props} />;
}
