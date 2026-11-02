import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { type LegalDocument, privacyPolicy, termsOfService } from './content';

/** Renders a legal document. Public: readable before sign-up, on the web, and from store listings. */
function LegalScreen({ document }: { document: LegalDocument }) {
  return (
    <Screen>
      <YStack gap="$x5" maxWidth={720} width="100%">
        <BackButton />
        <YStack gap="$x2">
          <AppText role="heading" variant="h1">
            {document.title}
          </AppText>
          <AppText tone="muted" variant="caption">
            Last updated {document.updated}
          </AppText>
          <AppText variant="lead">{document.intro}</AppText>
        </YStack>
        {document.sections.map((section) => (
          <Card key={section.heading} padding="$x4">
            <YStack gap="$x2">
              <AppText role="heading" variant="h4">
                {section.heading}
              </AppText>
              {section.paragraphs.map((paragraph) => (
                <AppText key={paragraph} variant="body">
                  {paragraph}
                </AppText>
              ))}
            </YStack>
          </Card>
        ))}
      </YStack>
    </Screen>
  );
}

export function TermsScreen() {
  return <LegalScreen document={termsOfService} />;
}

export function PrivacyScreen() {
  return <LegalScreen document={privacyPolicy} />;
}
