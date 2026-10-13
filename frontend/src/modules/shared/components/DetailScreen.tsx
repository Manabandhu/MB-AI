import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';

export type DetailSection = { title?: string; body: string };
export type DetailScreenProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: ReactNode;
  sections?: readonly DetailSection[];
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
  children?: ReactNode;
};
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
    <YStack gap="$x5">
      {image}
      <YStack gap="$x2">
        {eyebrow ? (
          <AppText variant="overline" tone="primary">
            {eyebrow}
          </AppText>
        ) : null}
        <Heading variant="h1">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>
      {actions.length ? (
        <XStack flexWrap="wrap" gap="$x2">
          {actions.map((action, index) => (
            <AppButton key={`${action.label}-${index}`} {...action} />
          ))}
        </XStack>
      ) : null}
      {sections.map((section, index) => (
        <Card key={`${section.title}-${index}`} gap="$x3">
          {section.title ? <Heading variant="h3">{section.title}</Heading> : null}
          <AppText>{section.body}</AppText>
        </Card>
      ))}
      {children}
    </YStack>
  );
}
