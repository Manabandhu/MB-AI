import { motion } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { styled, YStack } from 'tamagui';
import { useAppearance } from '@/theme/ThemeProvider';
import { keyboardPress } from './keyboardPress';

const CardFrame = styled(YStack, {
  name: 'Card',
  backgroundColor: '$surface',
  borderRadius: '$card',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$x5',
  gap: '$x2',
  variants: {
    variant: {
      outlined: {},
      elevated: {
        borderColor: '$borderColor',
        shadowColor: '$shadowColor',
        shadowOpacity: 0.035,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      },
      filled: { backgroundColor: '$surfaceContainerLow', borderColor: 'transparent' },
      tinted: { backgroundColor: '$primaryTint', borderColor: '$primarySoft' },
    },
    interactive: {
      true: {
        cursor: 'pointer',
        hoverStyle: { borderColor: '$borderColorHover', y: motion.hoverLift },
        focusVisibleStyle: {
          outlineWidth: 3,
          outlineStyle: 'solid',
          outlineColor: '$outlineColor',
        },
      },
    },
  } as const,
  defaultVariants: { variant: 'outlined' },
});

type CardProps = ComponentProps<typeof CardFrame> & {
  /** Navigates on press. Use `onPress` for anything else. */
  href?: Href | string;
  'aria-label'?: string;
  children?: ReactNode;
};

/** Surface for every list item, widget, and panel. Pressable cards lift on hover (web) and scale on press. */
export function Card({ href, onPress, children, ...props }: CardProps) {
  const { reduceMotion } = useAppearance();
  const interactive = Boolean(href || onPress);
  const press = interactive ? (onPress ?? (() => router.push(href as Href))) : undefined;
  return (
    <CardFrame
      role={interactive ? (href ? 'link' : 'button') : undefined}
      transition={reduceMotion ? null : 'quick'}
      focusable={interactive}
      interactive={interactive}
      hoverStyle={interactive && reduceMotion ? { borderColor: '$primary' } : undefined}
      onPress={press}
      {...keyboardPress(press ? () => press(undefined as never) : undefined)}
      pressStyle={interactive && !reduceMotion ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </CardFrame>
  );
}
