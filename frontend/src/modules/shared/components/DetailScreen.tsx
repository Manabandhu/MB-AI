import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';

export type DetailSection = {
  title?: string;
  body: string;
};

export type DetailScreenProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: React.ReactNode;
  sections?: readonly DetailSection[];
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
  children?: React.ReactNode;
};

/** Legacy detail layout (image, eyebrow, title, actions, text sections) on theme tokens and `AppButton`. */
export function DetailScreen({
  eyebrow,
  title,
  subtitle,
  image,
  sections = [],
  actions = [],
  children,
}: DetailScreenProps) {
  return (
    <YStack gap="$x6">
      {image ? (
        <YStack borderRadius="$card" overflow="hidden">
          {image}
        </YStack>
      ) : null}
      <YStack gap="$x2">
        {eyebrow ? (
          <AppText tone="teal" variant="overline">
            {eyebrow}
          </AppText>
        ) : null}
        <Heading variant="h1">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>

      {actions.length ? (
        <XStack flexWrap="wrap" gap="$x3">
          {actions.map((action) => (
            <AppButton
              key={action.label}
              label={action.label}
              onPress={action.onPress}
              variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
            />
          ))}
        </XStack>
      ) : null}

      {children}

      {sections.map((section, index) => (
        <YStack gap="$x2" key={section.title ?? index}>
          {section.title ? <Heading variant="h3">{section.title}</Heading> : null}
          <AppText tone="muted">{section.body}</AppText>
        </YStack>
      ))}
    </YStack>
  );
}
