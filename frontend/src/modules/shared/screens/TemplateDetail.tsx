import { DetailScreen, type DetailSection } from '../components/DetailScreen';

export type TemplateDetailProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: React.ReactNode;
  sections?: readonly DetailSection[];
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
};

export function TemplateDetail({
  eyebrow,
  title,
  subtitle,
  image,
  sections,
  actions,
}: TemplateDetailProps) {
  return (
    <DetailScreen
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      image={image}
      sections={sections}
      actions={actions}
    />
  );
}
